/**
 * Portfolio Core Module - Clean Index
 * 
 * This file serves as the main entry point for portfolio functionality,
 * re-exporting from the organized modules in the portfolio/ directory.
 * 
 * All portfolio logic has been organized into specific modules:
 * - metrics.ts: Core portfolio calculations
 * - performance.ts: Performance and historical analysis
 * - cost-basis.ts: Cost basis calculations
 * - tax.ts: Tax-related calculations
 * - types.ts: TypeScript interfaces
 */

// Re-export everything from organized modules
export * from './portfolio'
export * from './portfolio/types'
export * from './portfolio/metrics'
export * from './portfolio/performance'
export * from './portfolio/cost-basis'
export * from './portfolio/tax' 