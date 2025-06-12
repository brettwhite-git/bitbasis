// This is a placeholder index file for future component exports
// As we implement each component, we'll add the exports here

// Temporary exports to maintain backward compatibility during refactoring
export { PerformanceReturnsWrapper } from './performance-returns-wrapper';

// Export metrics components individually to avoid directory issues
export { PortfolioValue } from './metrics/portfolio-value';
export { CostBasis } from './metrics/cost-basis';
export { BitcoinHoldings } from './metrics/bitcoin-holdings';
export { FeesPaid } from './metrics/fees-paid';
export { HoldingsTerm } from './metrics/holdings-term';

// Export performance components individually
export { CumulativeReturns } from './performance/cumulative-returns';
export { CompoundGrowth } from './performance/compound-growth';
export { ReturnsTable } from './performance/returns-table';

// Export tax components
export { CostBasisComparison } from './tax/cost-basis-comparison';
export { TaxLiability } from './tax/tax-liability';

// Export wrappers
export { PortfolioMetricsWrapper } from './portfolio-metrics-wrapper';

// Export data hooks
export { usePerformanceMetrics, usePortfolioMetrics } from '@/lib/hooks';
