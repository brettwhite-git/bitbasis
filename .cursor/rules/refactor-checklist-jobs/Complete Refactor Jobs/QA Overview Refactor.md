# Refactoring Plan: Overview Dashboard ✅

**Goal:** Reorganize the components currently in `components/overview` into a more structured `components/dashboard/overview` directory. This involves moving files, renaming where appropriate for consistency (kebab-case for files, PascalCase for components), and potentially minor internal adjustments to update imports. The visual layout and styling must remain unchanged.

**Proposed Structure:**

```
components/
├── dashboard/
│   ├── overview/
│   │   ├── summary-cards/       # Components for the top row KPIs (Extracted or moved)
│   │   │   ├── portfolio-value-card.tsx
│   │   │   ├── cost-basis-card.tsx
│   │   │   ├── unrealized-gains-card.tsx
│   │   │   ├── average-buy-price-card.tsx
│   │   │   ├── hodl-time-card.tsx
│   │   │   └── summary-card-base.tsx  # Optional: Base component for common styling
│   │   ├── charts/              # Chart components
│   │   │   ├── portfolio-summary-chart.tsx # Moved from components/overview
│   │   │   └── buy-pattern-histogram.tsx  # Moved from components/overview
│   │   ├── widgets/             # Self-contained widgets
│   │   │   ├── savings-goal-widget.tsx    # Moved & renamed from SavingsGoalWidget.tsx
│   │   │   ├── fear-greed-gauge.tsx       # Moved & renamed from fear-greed-multi-gauge.tsx
│   │   │   └── recent-transactions.tsx    # Moved from components/overview
│   │   ├── index.ts             # Barrel file for easy exports
│   │   └── overview-layout.tsx  # Renamed from dashboard-content.tsx, manages layout
│   ├── shared/                # Components shared across dashboard sections
│   └── ... (other dashboard sections: settings, performance, etc.)
└── ... (landing, ui, etc.)
```

**Checklist:**

1.  **Preparation:** ✅
    *   [x] Ensure current working directory is clean.
    *   [x] Commit current changes: `git add . && git commit -m "Checkpoint: Before overview dashboard refactor"`

2.  **Directory Structure Setup:** ✅
    *   [x] Create `components/dashboard/overview/`
    *   [x] Create `components/dashboard/overview/summary-cards/`
    *   [x] Create `components/dashboard/overview/charts/`
    *   [x] Create `components/dashboard/overview/widgets/`

3.  **Layout Component:** ✅
    *   [x] Move `components/overview/dashboard-content.tsx` to `components/dashboard/overview/overview-layout.tsx`.
    *   [x] Update component import in `app/dashboard/page.tsx`.

4.  **KPI/Summary Cards (Top Row):** ✅
    *   [x] Analyze `components/dashboard/overview/overview-layout.tsx` to see how KPIs are rendered.
    *   [x] **If KPIs are inline:** Extract each KPI into a separate component in `components/dashboard/overview/summary-cards/` (e.g., `portfolio-value-card.tsx`).
    *   [x] **If KPIs are already components:** Move existing components to `components/dashboard/overview/summary-cards/`.
    *   [x] Update imports within `overview-layout.tsx` to use the components from the `summary-cards` directory.

5.  **Chart Components:** ✅
    *   [x] Move `components/overview/portfolio-summary-chart.tsx` to `components/dashboard/overview/charts/portfolio-summary-chart.tsx`.
    *   [x] Move `components/overview/buy-pattern-histogram.tsx` to `components/dashboard/overview/charts/buy-pattern-histogram.tsx`.
    *   [x] Update imports within `overview-layout.tsx`.

6.  **Widget Components:** ✅
    *   [x] Move `components/overview/SavingsGoalWidget.tsx` to `components/dashboard/overview/widgets/savings-goal-widget.tsx`. (Ensure filename is kebab-case).
    *   [x] Move `components/overview/fear-greed-multi-gauge.tsx` to `components/dashboard/overview/widgets/fear-greed-gauge.tsx`. (Rename file for clarity).
    *   [x] Move `components/overview/recent-transactions.tsx` to `components/dashboard/overview/widgets/recent-transactions.tsx`.
    *   [x] Update imports within `overview-layout.tsx`.
    *   [x] Check component names (`PascalCase`) within the renamed files (`kebab-case`) are correct.

7.  **Exports & Imports:** ⚠️ (Partial)
    *   [x] Create `components/dashboard/overview/index.ts`.
    *   [x] Add exports for `OverviewLayout` and other necessary components from the subdirectories (e.g., `export * from './charts/portfolio-summary-chart';`).
    *   [ ] Update `app/dashboard/page.tsx` to import `OverviewLayout` via the barrel file: `import { OverviewLayout } from '@/components/dashboard/overview';`
    
    **Note:** We created the barrel file but encountered Next.js client/server component issues when trying to use it for imports. The barrel file loses the "use client" directives when re-exporting components, causing compilation errors. We've kept the direct imports to maintain compatibility with Next.js component model.

8.  **Cleanup & Verification:** ✅
    *   [x] Delete the old `components/overview` directory.
    *   [x] Run linter (`npm run lint` or framework equivalent) and fix issues.
    *   [x] Run dev server (`npm run dev`).
    *   [x] Visually inspect the `/dashboard` page. Confirm layout, styling, and data are identical to the pre-refactor state. Test responsiveness if applicable.
    
    **Note:** We also rearranged the widget order as requested: Fear & Greed Index at top, Weekly Buy Pattern in middle, and Savings Goal at bottom.

9.  **Final Commit:** ✅
    *   [x] Stage all changes (`git add .`).
    *   [x] Commit the refactor: `git commit -m "refactor(dashboard): Reorganize overview components structure"`
