/**
 * Hardcoded benchmark CAGR values for comparison
 * These values are approximate and should be updated periodically
 * Data sources: Various financial data providers
 * Last updated: September 2024
 */

export interface BenchmarkCAGR {
  bitcoin: number
  gold: number
  sp500: number
}

export const BENCHMARK_CAGR: Record<string, BenchmarkCAGR> = {
  '1': {
    bitcoin: 77,
    gold: 43,
    sp500: 17
  },
  '2': {
    bitcoin: 106,
    gold: 40,
    sp500: 24
  },
  '3': {
    bitcoin: 81,
    gold: 32,
    sp500: 22
  },
  '4': {
    bitcoin: 27,
    gold: 21,
    sp500: 11
  },
  '5': {
    bitcoin: 61,
    gold: 15,
    sp500: 15
  },
  '6': {
    bitcoin: 54,
    gold: 16,
    sp500: 14
  },
  '7': {
    bitcoin: 50,
    gold: 18,
    sp500: 13
  },
  '8': {
    bitcoin: 53,
    gold: 14,
    sp500: 13
  },
  '9': {
    bitcoin: 79,
    gold: 12,
    sp500: 13
  },
  '10': {
    bitcoin: 85,
    gold: 13,
    sp500: 13
  }
}

/**
 * Gets benchmark CAGR for a specific period
 */
export function getBenchmarkCAGR(years: number): BenchmarkCAGR | null {
  const yearKey = Math.floor(years).toString()
  return BENCHMARK_CAGR[yearKey] || null
}

/**
 * Gets all available benchmark periods
 */
export function getAvailableBenchmarkPeriods(): number[] {
  return Object.keys(BENCHMARK_CAGR).map(Number).sort((a, b) => a - b)
}
