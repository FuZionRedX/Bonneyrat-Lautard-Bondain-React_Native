# TODO

## Completed

- [x] Allow multi-select per category in Recipes screen
  - [x] Change `selectedByCategory` state from single ID to array of IDs per category
  - [x] Toggle selection on tap (add/remove from array)
  - [x] Update auto-select and selectedMeals computation
  - [x] Update hint text to reflect multi-select
- [x] Show Recipes selections on Planner page
  - [x] Create `MealPlanContext` to share selected meals between screens
  - [x] Move `selectedByCategory` state from Recipes local state to shared context
  - [x] Update Planner to read from context and display selected meals by category
  - [x] Show dynamic calorie totals based on BMR calculation
  - [x] Show over-limit alert (red progress bar + message) when planned > target
  - [x] Remove hardcoded Daily Goals section
  - [x] Show empty state with prompt to go to Recipes when no meals selected
- [x] Connect Groceries page to meal selections
  - [x] Replace hardcoded grocery items with ingredients from selected meals
  - [x] Group ingredients by meal name
  - [x] Checkbox state for marking items as bought
  - [x] Empty state when no meals selected
- [x] Trigger notification when over-limit alert activates
  - [x] Detect transition into over-limit state in Planner
  - [x] Show one-time in-app notification per activation event

## In Progress

- [x] Add browser-aware API base URL for database access
  - [x] Detect web platform and use browser-reachable backend URL
  - [x] Keep Android emulator default URL for native builds
  - [x] Validate TypeScript/lint after API-layer changes
