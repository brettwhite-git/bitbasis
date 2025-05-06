import { CSVRow, ParsedOrder, ParsedTransaction, ParsedTransfer } from "./types";
import { normalizeTransactionType } from "./utils"; // Import necessary utils

// =============================================
// Primitive Parsers
// =============================================

/**
 * Parses a string or number value into a number, cleaning currency symbols and whitespace.
 * Returns null if parsing fails.
 * Handles optional negative values.
 */
export const parseAmount = (value: string | number | undefined | null, allowNegative: boolean = false): number | null => {
  if (value === null || value === undefined || value === '') return null;

  let numValue: number;

  if (typeof value === 'number') {
    // Value is already a number
    numValue = value;
  } else if (typeof value === 'string') {
    // Value is a string, clean it
    const cleanValue = value.replace(/[$,]/g, '').trim();
    if (cleanValue === '') return null; // Return null if empty after cleaning
    numValue = Number(cleanValue);
  } else {
    // Handle unexpected types (e.g., objects) by returning null
    console.warn(`parseAmount received unexpected type: ${typeof value}, value:`, value);
    return null;
  }
  
  // Check if parsing resulted in NaN
  if (isNaN(numValue)) {
      // console.warn(`Could not parse "${value}" as number`);
      return null;
  }
  
  return allowNegative ? numValue : Math.abs(numValue);
};

/**
 * Parses various date string formats into an ISO 8601 string.
 * Throws an error if parsing fails.
 */
export const parseDate = (dateStr: string | undefined): string => {
  if (!dateStr) throw new Error('Date string is empty or undefined');

  // Attempt direct parsing first (handles ISO strings and many common formats)
  let parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  // Add more robust parsing logic here if needed (e.g., using date-fns)
  // Example: Try specific formats if direct parsing fails
  // const formats = ['MM/dd/yy HH:mm', ...]; // Define formats
  // for (const format of formats) { ... try parsing ... }

  // Fallback attempt or throw error
  console.warn(`Attempting direct parse for date after initial failure: ${dateStr}`);
  parsed = new Date(dateStr); 
  if (isNaN(parsed.getTime())) {
      throw new Error(`Unable to parse date format: ${dateStr}`);
  }
  return parsed.toISOString();
};

// =============================================
// Header Mapping (Placeholder)
// =============================================

// Define expected normalized header keys
// These should match the keys used in transformRowToTransaction
const EXPECTED_HEADERS = {
    date: 'date',
    type: 'type',
    asset: 'asset',
    price: 'price',
    exchange: 'exchange',
    buyFiatAmount: 'buy_fiat_amount',
    receivedBtcAmount: 'received_btc_amount',
    sellBtcAmount: 'sell_btc_amount',
    receivedFiatAmount: 'received_fiat_amount',
    serviceFee: 'service_fee',
    amountBtc: 'amount_btc',
    feeAmountBtc: 'fee_amount_btc',
    amountFiat: 'amount_fiat',
    hash: 'hash',
    // Alternative common names that map to the above
    fiatAmount: 'fiat_amount',
    btcAmount: 'btc_amount',
    buyCurrency: 'buy_currency',
    sellBtcCurrency: 'sell_btc_currency',
    receivedFiatCurrency: 'received_fiat_currency',
    serviceFeeCurrency: 'service_fee_currency'
};

// Maps common variations to our expected keys
const HEADER_VARIATIONS: { [key: string]: string[] } = {
    [EXPECTED_HEADERS.date]: ['date', 'timestamp', 'created at', 'time'],
    [EXPECTED_HEADERS.type]: ['type', 'transaction type', 'kind'],
    [EXPECTED_HEADERS.buyFiatAmount]: ['buy_fiat_amount', 'fiat_amount', 'amount', 'total', 'usd amount', 'subtotal', 'amount paid'],
    [EXPECTED_HEADERS.receivedBtcAmount]: ['received_btc_amount', 'btc_amount', 'quantity', 'amount btc', 'crypto amount'],
    [EXPECTED_HEADERS.sellBtcAmount]: ['sell_btc_amount', 'btc_amount', 'quantity', 'amount btc', 'crypto amount'],
    [EXPECTED_HEADERS.receivedFiatAmount]: ['received_fiat_amount', 'fiat_amount', 'amount', 'total', 'usd amount', 'proceeds', 'amount received'],
    [EXPECTED_HEADERS.serviceFee]: ['service_fee', 'fee', 'fees', 'exchange fee'],
    [EXPECTED_HEADERS.amountBtc]: ['amount_btc', 'btc_amount', 'quantity', 'crypto amount'], // For transfers
    [EXPECTED_HEADERS.feeAmountBtc]: ['fee_amount_btc', 'network fee', 'btc fee'],
    [EXPECTED_HEADERS.price]: ['price', 'btc price', 'price per btc', 'spot price'],
    [EXPECTED_HEADERS.exchange]: ['exchange', 'source', 'platform'],
    [EXPECTED_HEADERS.hash]: ['hash', 'txid', 'transaction id'],
    // Add other fields as needed
};

/**
 * Normalizes a single row object by mapping known header variations to standard keys.
 * Uses the HEADER_VARIATIONS map.
 */
export function normalizeHeaders(rawRow: Record<string, any>): CSVRow {
    const normalizedRow: CSVRow = {};
    const processedKeys = new Set<string>(); // Track which expected keys we've filled

    // Create a reverse map for quick lookup: variation -> standardKey
    const variationMap: { [variation: string]: string } = {};
    for (const standardKey in HEADER_VARIATIONS) {
        // Check if the entry exists before trying to access its properties
        if (HEADER_VARIATIONS[standardKey]) { 
            HEADER_VARIATIONS[standardKey].forEach(variation => {
                variationMap[variation.toLowerCase().trim()] = standardKey;
            });
        }
    }

    // Iterate through the actual headers in the raw row
    for (const rawHeader in rawRow) {
        const lowerTrimmedHeader = rawHeader.toLowerCase().trim();
        const standardKey = variationMap[lowerTrimmedHeader];

        // If we found a mapping and haven't already processed this standard key
        if (standardKey && !processedKeys.has(standardKey)) {
            // Ensure value is converted to string, default to empty string if null/undefined
            normalizedRow[standardKey as keyof CSVRow] = rawRow[rawHeader]?.toString() ?? ''; // Cast standardKey 
            processedKeys.add(standardKey);
        } else if (!standardKey) {
            // Optional: Keep unmapped columns if needed, maybe prefix them
            // normalizedRow[`unmapped_${rawHeader}`] = rawRow[rawHeader]?.toString();
            // console.warn(`Unmapped header found: ${rawHeader}`);
        }
    }

    return normalizedRow;
}

// =============================================
// Row Transformation
// =============================================

/**
 * Transforms a single CSV row (with normalized headers) into a ParsedTransaction object.
 */
export const transformRowToTransaction = (row: CSVRow, source: 'csv' | 'manual' = 'csv'): ParsedTransaction => {
  try {
    // 1. Normalize and validate type
    const type = normalizeTransactionType(row.type);
    if (!type || type === 'unknown') {
      throw new Error(`Invalid or missing transaction type: "${row.type}"`);
    }

    // 2. Parse and validate date
    const date = parseDate(row.date);
    const transactionDate = new Date(date);
    if (isNaN(transactionDate.getTime())) {
       throw new Error(`Invalid date parsed: ${date}`);
    }

    // 3. Generate unique ID for processing
    const transactionId = `${source}-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;

    // 4. Handle transfer transactions
    if (type === 'withdrawal' || type === 'deposit') {
      const rawAmount = parseAmount(row.amount_btc || row.btc_amount, true);
      if (rawAmount === null) {
        throw new Error('Transfer transaction requires a valid BTC amount');
      }
      const amount_btc: number = Math.abs(rawAmount); 
      const fee_amount_btc: number | null = parseAmount(row.fee_amount_btc, true);
      const amount_fiat: number | null = parseAmount(row.amount_fiat || row.fiat_amount, true);
      const price = parseAmount(row.price);

      const transfer: ParsedTransfer = {
        id: transactionId,
        source: source,
        originalRowData: row, 
        type: type,
        date: transactionDate,
        asset: row.asset || 'BTC', // Default to BTC if asset missing
        amountBtc: amount_btc,
        amountFiat: amount_fiat ? Math.abs(amount_fiat) : null, // Store positive fiat
        feeAmountBtc: fee_amount_btc ? Math.abs(fee_amount_btc) : null, // Store positive fee
        price: price, 
        hash: row.hash?.trim() || null,
      };
      return transfer;
    }

    // 5. Handle buy/sell transactions
    const buy_fiat_amount = parseAmount(row.buy_fiat_amount || row.fiat_amount);
    const received_btc_amount = parseAmount(row.received_btc_amount || row.btc_amount);
    const sell_btc_amount = parseAmount(row.sell_btc_amount || row.btc_amount);
    const received_fiat_amount = parseAmount(row.received_fiat_amount || row.fiat_amount);
    const service_fee = parseAmount(row.service_fee);
    let price = parseAmount(row.price);

    // Calculate price if missing and possible
    if (price === null) {
      if (type === 'buy' && buy_fiat_amount && received_btc_amount && received_btc_amount !== 0) {
        price = buy_fiat_amount / received_btc_amount;
      } else if (type === 'sell' && received_fiat_amount && sell_btc_amount && sell_btc_amount !== 0) {
        price = received_fiat_amount / sell_btc_amount;
      }
    }

    const order: ParsedOrder = {
      id: transactionId,
      source: source,
      originalRowData: row,
      type: type as 'buy' | 'sell',
      date: transactionDate,
      asset: row.asset || 'BTC',
      exchange: row.exchange?.trim() || null,
      price: price,
      buyFiatAmount: type === 'buy' ? buy_fiat_amount : null,
      buyCurrency: type === 'buy' ? (row.buy_currency?.trim() || 'USD') : null,
      receivedBtcAmount: type === 'buy' ? received_btc_amount : null,
      sellBtcAmount: type === 'sell' ? sell_btc_amount : null,
      sellBtcCurrency: type === 'sell' ? (row.sell_btc_currency?.trim() || 'BTC') : null,
      receivedFiatAmount: type === 'sell' ? received_fiat_amount : null,
      receivedFiatCurrency: type === 'sell' ? (row.received_fiat_currency?.trim() || 'USD') : null,
      serviceFee: service_fee,
      serviceFeeCurrency: row.service_fee_currency?.trim() || (service_fee ? 'USD' : null),
    };

    // Add basic validation check within transform (can be expanded in validation.ts)
    if (type === 'buy' && (order.buyFiatAmount === null || order.receivedBtcAmount === null)) {
      // Consider making this a warning instead of error if price is calculable
      throw new Error('Buy transaction missing required amount fields (Fiat Amount or BTC Received)');
    }
    if (type === 'sell' && (order.sellBtcAmount === null || order.receivedFiatAmount === null)) {
      throw new Error('Sell transaction missing required amount fields (BTC Sold or Fiat Received)');
    }

    return order;

  } catch (err) {
    console.error('Error transforming row:', { error: err, row });
    // Re-throw but maybe wrap in a custom error type later
    throw new Error(`Failed to transform row: ${err instanceof Error ? err.message : String(err)}`); 
  }
}; 