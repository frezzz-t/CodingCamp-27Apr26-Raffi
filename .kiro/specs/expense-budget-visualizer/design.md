# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page, client-side web application delivered as three static files: `index.html`, `css/styles.css`, and `js/app.js`. It requires no server, no build step, and no external dependencies. The user opens `index.html` directly in a browser.

The application lets users log expense transactions (name, amount, category), view and delete them in a scrollable list, track a running total balance, and see spending broken down by category in a pie chart rendered with the Canvas API. All data is persisted in `localStorage` under the key `"transactions"`.

### Design Goals

- **Zero dependencies** — every feature is implemented with vanilla HTML/CSS/JS and browser-native APIs.
- **Single source of truth** — one in-memory array (`transactions`) drives every UI component; all renders are derived from that array.
- **Re-render on change** — every add/delete triggers a full re-render of the transaction list, balance, pie chart, and chart summary.
- **Resilient persistence** — `localStorage` is read on load and written synchronously on every mutation.

---

## Architecture

The application follows a simple **data → render** loop with no virtual DOM or reactive framework.

```
┌─────────────────────────────────────────────────────────┐
│                        index.html                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Input Form  │  │ Balance Disp │  │  Transaction  │  │
│  │  (#add-form) │  │ (#balance)   │  │  List (#list) │  │
│  └──────┬───────┘  └──────────────┘  └───────┬───────┘  │
│         │  submit                     delete │           │
│         ▼                                    ▼           │
│  ┌──────────────────────────────────────────────────┐    │
│  │                   app.js                         │    │
│  │                                                  │    │
│  │  transactions[]  ◄──── localStorage.getItem()    │    │
│  │       │                                          │    │
│  │  addTransaction() / deleteTransaction()          │    │
│  │       │                                          │    │
│  │       ├──► saveToStorage()                       │    │
│  │       ├──► renderList()                          │    │
│  │       ├──► renderBalance()                       │    │
│  │       └──► renderChart()                         │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Chart Area                                      │    │
│  │  <canvas id="pie-chart">  +  #chart-summary      │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. On `DOMContentLoaded`, `app.js` loads `transactions` from `localStorage` and calls all render functions.
2. When the user submits the form, `addTransaction()` validates input, pushes to the array, saves, and re-renders.
3. When the user clicks a delete button, `deleteTransaction(id)` splices the array, saves, and re-renders.
4. All render functions read directly from the `transactions` array — there is no intermediate state.

---

## Components and Interfaces

### 1. Input Form (`#add-form`)

**HTML elements:**
- `<input type="text" id="name-input">` — item name
- `<input type="number" id="amount-input" min="0.01" step="0.01">` — amount
- `<select id="category-select">` — options: Food, Transport, Fun
- `<button type="submit">` — triggers validation and add
- `<span class="error" id="name-error">`, `<span class="error" id="amount-error">`, `<span class="error" id="category-error">` — inline validation messages

**Behaviour:**
- `submit` event listener calls `handleFormSubmit(event)`.
- On success: transaction added, form reset via `form.reset()`, error spans cleared.
- On failure: relevant error spans populated; transaction not added.

### 2. Balance Display (`#balance`)

**HTML element:** `<span id="balance">` inside a heading or paragraph.

**Render function:** `renderBalance()`
- Sums all `transaction.amount` values.
- Writes formatted currency string to `#balance.textContent`.

### 3. Transaction List (`#transaction-list`)

**HTML element:** `<ul id="transaction-list">` with `overflow-y: auto` and a fixed max-height in CSS.

**Render function:** `renderList()`
- Clears the `<ul>`.
- For each transaction, creates an `<li>` containing: name, formatted amount, category badge, and a delete `<button data-id="...">`.
- Delegates delete clicks via a single event listener on the `<ul>` (event delegation).

### 4. Pie Chart (`<canvas id="pie-chart">`)

**HTML element:** `<canvas id="pie-chart" width="300" height="300">`.

**Render function:** `renderChart()`
- Computes per-category totals from `transactions`.
- If no transactions exist, draws a placeholder circle with a "No data" label.
- Otherwise, draws arc segments using `CanvasRenderingContext2D.arc()` with proportional angles.
- Each category is assigned a fixed colour (see Data Models).
- Re-renders by calling `ctx.clearRect()` before each draw.

**Chart Summary (`#chart-summary`):**
- A `<ul id="chart-summary">` rendered alongside the canvas.
- `renderChart()` also populates this list with one `<li>` per category showing a colour swatch, category name, and total amount.
- Only categories with at least one transaction are shown.

### 5. Validator

**Function:** `validateForm(name, amount, category) → { valid: boolean, errors: { name?, amount?, category? } }`

Rules:
- `name`: must be a non-empty string after trimming whitespace.
- `amount`: must be a finite number greater than zero.
- `category`: must be one of `["Food", "Transport", "Fun"]`.

Error display is handled by `showErrors(errors)` and `clearErrors()` which write to / clear the `<span class="error">` elements.

---

## Data Models

### Transaction Object

```js
{
  id: string,        // crypto.randomUUID() or Date.now().toString() fallback
  name: string,      // trimmed, non-empty item name
  amount: number,    // positive float, stored as-is (no rounding in model)
  category: string   // "Food" | "Transport" | "Fun"
}
```

### localStorage Schema

```
Key:   "transactions"
Value: JSON.stringify(Transaction[])
```

On load: `JSON.parse(localStorage.getItem("transactions") || "[]")`  
On save: `localStorage.setItem("transactions", JSON.stringify(transactions))`

### Category Colour Map

```js
const CATEGORY_COLORS = {
  Food:      "#FF6B6B",   // coral red
  Transport: "#4ECDC4",   // teal
  Fun:       "#FFE66D"    // yellow
};
```

### Function Signatures (public interface of `app.js`)

```js
// Lifecycle
function init()                          // called on DOMContentLoaded

// Mutations
function addTransaction(name, amount, category)   // validates, pushes, saves, re-renders
function deleteTransaction(id)                    // splices, saves, re-renders

// Persistence
function loadFromStorage()  → Transaction[]
function saveToStorage(transactions)

// Rendering
function renderList(transactions)
function renderBalance(transactions)
function renderChart(transactions)

// Validation
function validateForm(name, amount, category) → { valid, errors }
function showErrors(errors)
function clearErrors()
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid transaction addition is reflected in state and storage

*For any* transactions array of length n and any valid transaction (non-empty trimmed name, positive numeric amount, category in {Food, Transport, Fun}), after calling `addTransaction()` the in-memory array must have length n+1, must contain an entry matching the submitted name, amount, and category, and `JSON.parse(localStorage.getItem("transactions"))` must also contain that entry.

**Validates: Requirements 1.2, 1.3, 2.1**

### Property 2: Whitespace-only names are rejected

*For any* string composed entirely of whitespace characters (empty string, spaces, tabs, newlines), submitting it as the item name must cause `validateForm()` to return `valid: false` with a name error, and the transactions array must remain unchanged.

**Validates: Requirements 7.1**

### Property 3: Non-positive and non-numeric amounts are rejected

*For any* amount value that is zero, negative, `NaN`, or non-numeric, submitting it must cause `validateForm()` to return `valid: false` with an amount error, and the transactions array must remain unchanged.

**Validates: Requirements 7.2**

### Property 4: Transaction deletion removes exactly the target from state and storage

*For any* transactions array of length n ≥ 1 and any id present in that array, after calling `deleteTransaction(id)` the in-memory array must have length n−1, must contain no entry with that id, must preserve all other entries unchanged, and `JSON.parse(localStorage.getItem("transactions"))` must also contain no entry with that id.

**Validates: Requirements 3.2, 3.3**

### Property 5: Balance always equals the arithmetic sum of all amounts

*For any* transactions array (including the empty array), the value computed for the Balance Display must equal the sum of all `transaction.amount` values in that array (0 for an empty array).

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 6: Pie chart proportions are mathematically correct

*For any* non-empty transactions array, the proportion computed for each category must equal the sum of that category's transaction amounts divided by the total of all transaction amounts, and the proportions across all categories present must sum to exactly 1.

**Validates: Requirements 5.1, 5.2, 5.7**

### Property 7: localStorage round-trip preserves all transaction data

*For any* array of transaction objects, serializing it via `saveToStorage()` and then deserializing it via `loadFromStorage()` must produce an array that is deeply equal to the original — same length, same ids, names, amounts, and categories in the same order.

**Validates: Requirements 6.1, 6.2, 2.3**

### Property 8: Valid resubmission clears all prior error messages

*For any* form state in which one or more error `<span>` elements contain non-empty text, submitting the form with all fields valid must result in every error span having empty `textContent`.

**Validates: Requirements 7.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private browsing, quota exceeded) | Wrap `setItem` in `try/catch`; log warning to console; app continues in-memory only |
| `localStorage` contains malformed JSON | `JSON.parse` wrapped in `try/catch`; fall back to empty array `[]` |
| `crypto.randomUUID` unavailable (older browsers) | Fall back to `Date.now().toString() + Math.random()` for id generation |
| Canvas not supported | Show a `<p>` fallback message inside the `<canvas>` element (native browser behaviour) |
| Amount field receives non-numeric input | HTML `type="number"` prevents most cases; Validator catches `NaN` and `<= 0` |
| Delete called with unknown id | `Array.prototype.findIndex` returns `-1`; guard clause skips splice and re-render |

---

## Testing Strategy

This project has no test runner (per the tech stack constraints — no npm, no bundler, no test framework). All testing is manual and browser-based. The correctness properties defined above serve as the specification for what to verify during manual testing.

### Manual Smoke Tests

1. **Add a valid transaction** — fill all fields, submit; verify entry appears in list, balance updates, chart updates.
2. **Add with empty name** — submit; verify name error message appears adjacent to the name field, no transaction added.
3. **Add with whitespace-only name** — submit `"   "`; verify name error appears, no transaction added.
4. **Add with zero amount** — submit `0`; verify amount error appears, no transaction added.
5. **Add with negative amount** — submit `-5`; verify amount error appears, no transaction added.
6. **Add with no category selected** — submit; verify category error appears, no transaction added.
7. **Correct a field and resubmit** — trigger an error, fix the field, resubmit; verify prior error clears.
8. **Delete a transaction** — click delete; verify entry removed from list, balance and chart update.
9. **Reload the page** — verify all transactions are restored from `localStorage`.
10. **Empty state** — delete all transactions; verify chart shows placeholder, balance shows `0`.
11. **Multiple categories** — add transactions across Food, Transport, Fun; verify chart shows three segments with correct proportions and correct colour coding.
12. **Responsive layout** — resize viewport to 320px width; verify all components remain usable.

### Property Verification (Manual)

Each correctness property can be spot-checked manually:

| Property | Manual Check |
|---|---|
| **P1** — Addition grows state and storage | Add 3 transactions one at a time; count list items and inspect `localStorage` after each. |
| **P2** — Whitespace names rejected | Submit `""`, `"   "`, `"\t"` as names — all should show an error and leave the list unchanged. |
| **P3** — Non-positive amounts rejected | Submit `0`, `-5`, `"abc"` as amounts — all should show an error and leave the list unchanged. |
| **P4** — Deletion removes exactly the target | Add 3 transactions, delete the middle one; verify only that entry is gone from list and `localStorage`. |
| **P5** — Balance equals sum | Add transactions with known amounts (e.g. $10, $25, $5); verify balance shows $40. |
| **P6** — Chart proportions correct | Add $10 Food, $10 Transport; verify each segment is exactly 50% of the chart. |
| **P7** — localStorage round-trip | Add transactions, close and reopen the tab; verify all data (name, amount, category) is intact. |
| **P8** — Errors cleared on valid resubmit | Trigger errors on all fields, then fill all fields correctly and submit; verify all error spans are empty. |

### Edge Case Checks

- **Empty chart placeholder** — with zero transactions, the canvas should show a "No data" message rather than attempting to draw segments.
- **Single transaction** — one transaction should produce a full-circle segment (100%) in the chart.
- **All same category** — all transactions in one category should produce a single full-circle segment.
- **Large transaction list** — add 20+ transactions; verify the list scrolls and the chart still renders correctly.

### Cross-Browser Checks

Run the manual smoke tests in Chrome, Firefox, Edge, and Safari to satisfy Requirement 8.1. Pay particular attention to Canvas API rendering and `localStorage` behaviour across browsers.
