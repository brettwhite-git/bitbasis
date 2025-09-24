// This is a placeholder index file for future component exports
// As we implement each component, we'll add the exports here

// Temporary exports to maintain backward compatibility during refactoring
export { PerformanceReturnsWrapper } from './performance-returns-wrapper.tsx';

// Export metrics components individually to avoid directory issues
export { PortfolioValue } from './metrics/portfolio-value.tsx';
export { CostBasis } from './metrics/cost-basis.tsx';
export { BitcoinHoldings } from './metrics/bitcoin-holdings.tsx';
export { FeesPaid } from './metrics/fees-paid.tsx';
export { HoldingsTerm } from './metrics/holdings-term.tsx';

// Export performance components individually
export { CumulativeReturns } from './performance/cumulative-returns.tsx';
export { CompoundGrowth } from './performance/compound-growth.tsx';
export { ReturnsTable } from './performance/returns-table.tsx';

// Export tax components
// TODO: Re-enable when tax components are implemented
// export { CostBasisComparison } from './tax/cost-basis-comparison';
// export { TaxLiability } from './tax/tax-liability';

// Export wrappers
export { PortfolioMetricsWrapper } from './portfolio-metrics-wrapper.tsx';

// Export data hooks
export { usePerformanceMetrics, usePortfolioMetrics } from '@/lib/hooks';
