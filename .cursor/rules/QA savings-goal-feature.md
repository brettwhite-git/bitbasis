# Savings Goal Feature Plan

## 1. Feature

Savings Goal Calculator & Tracker

## 2. Component

`components/calculator/savings-goal-calculator.tsx`

## 3. Objective

- Allow users to interactively calculate the projected growth of recurring investments in Bitcoin over time, based on their contribution amount, frequency, timeframe, and estimated price growth.
- Provide visualizations (chart, summary KPIs) of the projection.
- Allow users to optionally "Save" a specific projection as their active "Savings Goal".
- Display the progress of the active Savings Goal (loaded from local storage), initially based on time elapsed vs. target timeframe.

## 4. UI Structure

### A. Goal Tracker Display (Top Section - Visible if a goal is saved in `localStorage`)

- *Inspiration:* Second image provided in conversation.
- `Circular Gauge:` Shows progress towards the saved target amount (e.g., 27% of goal). Displays current/target BTC (e.g., "0.0270 BTC / 0.1000 BTC"). Sub-text: "X BTC more to reach your goal". (Initially, progress % might reflect time elapsed).
- `KPIs:` Projected Value (from saved goal), Time to Goal (from saved goal), Return on Investment (from saved goal).
- `Progress Bar:` Linear bar showing progress (optional, maybe redundant with gauge).
- `Projected Growth Chart (Static):` Small version of the line chart saved with the goal.

### B. Interactive Calculator & Goal Setter (Main Section - Always Visible)

- *Inspiration:* "Your Savings Goal" and "EMI Calculator" images.
- `Inputs (Sliders + Precise Input Fields):`
    - `Goal Name:` (Optional, Text Input, defaults to something like "My Projection")
    - `Contribution Amount ($USD):` User defines how much they plan to invest per period.
    - `Contribution Frequency:` (e.g., Monthly, Weekly) - Select/Radio.
    - `Expected Annual Return / Price Growth (%):` User's estimate.
    - `Projection Period (Years):` How long the projection runs.
    - `Initial Investment ($USD):` (Optional, default $0) User's starting amount.
- `Interactive Outputs (Update in real-time):`
    - `Projected Value ($USD):` The main calculated outcome.
    - `Time to Reach X BTC/Sats:` (Maybe? Or just show projected value)
    - `Return on Investment (%):` Calculated ROI.
    - `Total Principal Invested vs. Total Interest Earned:` Text or small visualization.
    - `Estimated Completion Date:` Calculated based on projection period.
- `Projected Growth Chart (Dynamic):` Line chart visualizing the calculated `Projected Value` growth over the `Projection Period`.
- `Action Button:` "Save as Savings Goal". Pressing this saves the *current configuration and calculated outputs* to `localStorage`.

## 5. Data Storage (`localStorage`)

- Key: `savingsGoal`
- Structure (Example, based on user *setting* a goal from the interactive calculator):
  ```json
  {
    "goalName": "Reach 0.5 BTC", // Name given when saving
    "savedProjection": { // The state of the calculator when saved
      "contributionAmountUSD": 100,
      "contributionFrequency": "weekly",
      "expectedGrowthPercent": "40",
      "projectionPeriodYears": 5,
      "initialInvestmentUSD": 500
    },
    "calculatedOutputs": { // The results calculated at the time of saving
       "projectedValueUSD": 25500,
       "projectedValueBTC": "0.51000000", // Example if BTC price was part of calc
       "roiPercent": 150.5,
       "completionDate": "2029-07-26",
       "totalPrincipal": 26500 // (Initial + (Contribution * Periods))
    },
    "startDate": "2024-07-26", // Date the goal was saved
    "targetBTC": "0.50000000" // Explicit target derived or confirmed when saving
  }
  ```
- *(Note: The exact target BTC needs to be explicitly captured or confirmed when the user clicks "Save as Savings Goal", as the projection might overshoot or undershoot a round number target.)*

## 6. Core Logic

- Component mounts, tries to load `savingsGoal` from `localStorage`.
- State holds interactive calculator inputs (`contributionAmountUSD`, `frequency`, etc.).
- `useEffect` recalculates projections (`projectedValueUSD`, `roiPercent`, chart data, etc.) whenever calculator inputs change.
- Calculation simulates growth period-by-period.
- "Save" button captures current inputs & outputs, potentially prompts user to confirm/set the exact `targetBTC` based on the projection, and saves the full object to `localStorage`, triggering a UI update to show the Goal Tracker Display.

## 7. Future Enhancements

- Inflation adjustment option.
- Connect progress tracking to actual user portfolio data.
- Allow editing/deleting the saved goal. 