// Export types
export * from './types';

// Export metrics functions
export * from './metrics';

// Export cost basis functions
export * from './cost-basis';

// Export performance functions
export * from './performance';

// Export tax functions
export * from './tax';

// Export all types
export * from './types';

// Export from metrics.ts
export {
  calculateTotalBTC,
  calculateCostBasis as calculateCostBasisFromOrders,
  calculateTotalFees,
  calculateUnrealizedGains,
  calculateAverageBuyPrice,
  calculateShortTermHoldings,
  calculateLongTermHoldings,
  calculatePortfolioMetrics,
  getPortfolioMetrics
} from './metrics';

// Export from cost-basis.ts
export {
  calculateCostBasis
} from './cost-basis';

// Export from performance.ts
export {
  calculateDCAPerformance,
  getPerformanceMetrics
} from './performance';

// Export from tax.ts
export {
  SHORT_TERM_TAX_RATE,
  LONG_TERM_TAX_RATE,
  calculateHoldingsClassification,
  estimateTaxLiability,
  calculateRealizedGain,
  getTaxClassification
} from './tax';

// Note: Temporary re-exports from old module are now removed as they are directly
// exported from the new modules. This ensures backward compatibility.
