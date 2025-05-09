# Portfolio Charts Refactoring Plan

## Week 1: Service Layer Extraction

### Create Core Data Service
- [x] Define data service interfaces and types
- [x] Extract portfolio calculation logic from existing components
- [x] Implement `PortfolioDataService` with core methods
- [ ] Add unit tests for calculation functions

### Build Chart Configuration Factory
- [x] Create `ChartConfigFactory` class
- [x] Extract configuration logic from chart components
- [x] Implement shared configuration methods
- [x] Create specialized config generators for each chart type

### Establish Type System
- [x] Define comprehensive TypeScript interfaces for all data structures
- [ ] Create type guards for runtime validation
- [x] Document type relationships in code comments

### Implement Price Data Integration
- [x] Create interface for spot price data from existing table
- [x] Implement service to fetch current BTC spot price
- [x] Add logic to prioritize spot price for current month calculations
- [x] Create fallback mechanism for historical price data

## Week 2: Component Architecture

### Create Base Chart Component
- [x] Build `BasePortfolioChart` component with shared functionality
- [x] Implement props interface with required and optional properties
- [x] Add React hooks for data processing and state management

### Extend Specialized Charts
- [x] Create `PortfolioSummaryChart` extending base component
- [x] Create `PerformanceChartChart` extending base component
- [x] Ensure proper inheritance of props and methods

### Implement Shared Utilities
- [x] Create date handling utilities
- [x] Build data filtering helpers
- [x] Develop common calculation functions
- [x] Add price data normalization utilities for mixing spot and historical prices

### Legacy Integration
- [x] Update imports in existing components
- [x] Create migration guide for transition
- [x] Ensure backward compatibility 