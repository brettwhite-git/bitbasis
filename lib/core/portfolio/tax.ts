import { Order } from './types'

// Tax rates - these should be configurable in a real app
export const SHORT_TERM_TAX_RATE = 0.37; // 37% for short-term capital gains
export const LONG_TERM_TAX_RATE = 0.20;  // 20% for long-term capital gains

/**
 * Calculates the tax classification of BTC holdings based on acquisition date
 * @param orders Array of buy/sell orders
 * @returns Object with short-term and long-term holdings amounts
 */
export function calculateHoldingsClassification(orders: Order[]): { 
  shortTerm: number, 
  longTerm: number 
} {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  let shortTermHoldings = 0;
  let longTermHoldings = 0;
  
  // Process buy orders first to determine initial holdings
  orders
    .filter(order => order.type === 'buy' && order.received_btc_amount)
    .forEach(order => {
      const acquisitionDate = new Date(order.date);
      const amount = order.received_btc_amount || 0;
      
      if (acquisitionDate > oneYearAgo) {
        shortTermHoldings += amount;
      } else {
        longTermHoldings += amount;
      }
    });
  
  // Then process sell orders to reduce holdings proportionally
  orders
    .filter(order => order.type === 'sell' && order.sell_btc_amount)
    .forEach(order => {
      const sellAmount = order.sell_btc_amount || 0;
      const totalHoldings = shortTermHoldings + longTermHoldings;
      
      if (totalHoldings > 0) {
        // Reduce holdings proportionally
        const shortTermRatio = shortTermHoldings / totalHoldings;
        const longTermRatio = longTermHoldings / totalHoldings;
        
        shortTermHoldings -= sellAmount * shortTermRatio;
        longTermHoldings -= sellAmount * longTermRatio;
      }
    });
  
  // Ensure non-negative values
  return {
    shortTerm: Math.max(0, shortTermHoldings),
    longTerm: Math.max(0, longTermHoldings)
  };
}

/**
 * Estimates potential tax liability based on unrealized gains
 * @param unrealizedGain Total unrealized gain
 * @param shortTermRatio Ratio of holdings that are short-term
 * @param longTermRatio Ratio of holdings that are long-term
 * @returns Estimated tax liability
 */
export function estimateTaxLiability(
  unrealizedGain: number,
  shortTermRatio: number,
  longTermRatio: number
): { shortTerm: number, longTerm: number, total: number } {
  if (unrealizedGain <= 0) {
    return { shortTerm: 0, longTerm: 0, total: 0 };
  }
  
  const shortTermLiability = unrealizedGain * shortTermRatio * SHORT_TERM_TAX_RATE;
  const longTermLiability = unrealizedGain * longTermRatio * LONG_TERM_TAX_RATE;
  
  return {
    shortTerm: shortTermLiability,
    longTerm: longTermLiability,
    total: shortTermLiability + longTermLiability
  };
}

/**
 * Calculates realized gains from sell transactions
 * @param sellAmount Amount of BTC sold
 * @param sellPrice Price per BTC at the time of sale
 * @param costBasis Cost basis per BTC
 * @returns Realized gain or loss
 */
export function calculateRealizedGain(
  sellAmount: number,
  sellPrice: number,
  costBasis: number
): number {
  const proceeds = sellAmount * sellPrice;
  const cost = sellAmount * costBasis;
  return proceeds - cost;
}

/**
 * Determines if a transaction would be taxed as long-term or short-term
 * @param acquisitionDate Date when the asset was acquired
 * @param disposalDate Date when the asset was disposed (sold)
 * @returns 'long-term' if held for more than a year, otherwise 'short-term'
 */
export function getTaxClassification(
  acquisitionDate: Date,
  disposalDate: Date
): 'short-term' | 'long-term' {
  // Calculate holding period in milliseconds
  const holdingPeriod = disposalDate.getTime() - acquisitionDate.getTime();
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  
  return holdingPeriod > oneYearInMs ? 'long-term' : 'short-term';
}
