# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a zero-dependency, client-side expense tracker as three static files: `index.html`, `css/styles.css`, and `js/app.js`. Implementation follows the data → render loop defined in the design: a single in-memory `transactions` array drives every UI component, with `localStorage` as the persistence layer and the Canvas API for the pie chart.

## Tasks

- [x] 1. Create the HTML skeleton (`index.html`)
  - Create `index.html` with the full page structure: `<head>` with charset, viewport meta, and `<link>` to `css/styles.css`; `<body>` containing the balance display (`<span id="balance">`), the input form (`#add-form`) with `#name-input`, `#amount-input`, `#category-select`, submit button, and three `<span class="error">` elements for inline validation messages; the transaction list (`<ul id="transaction-list">`); and the chart area with `<canvas id="pie-chart" width="300" height="300">` and `<ul id="chart-summary">`
  - Add `<script src="js/app.js">` at the bottom of `<body>`
  - Add a text fallback inside `<canvas>` for browsers that do not support it
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 8.2, 8.5_

- [x] 2. Implement data layer and persistence (`js/app.js`)
  - [x] 2.1 Set up the module scaffold and data constants
    - Open `js/app.js`; declare `let transactions = []` as the single source of truth
    - Define the `CATEGORY_COLORS` constant: `{ Food: "#FF6B6B", Transport: "#4ECDC4", Fun: "#FFE66D" }`
    - Define the `CATEGORIES` constant array `["Food", "Transport", "Fun"]`
    - Wrap all initialization and event-listener registration in a `DOMContentLoaded` callback that calls `init()`
    - _Requirements: 8.2_

  - [x] 2.2 Implement `loadFromStorage()` and `saveToStorage()`
    - `loadFromStorage()`: read `localStorage.getItem("transactions") ?? "[]"`, wrap `JSON.parse` in `try/catch`, fall back to `[]` on malformed JSON, return the parsed array
    - `saveToStorage(transactions)`: wrap `localStorage.setItem("transactions", JSON.stringify(transactions))` in `try/catch`; log a console warning if storage is unavailable but allow the app to continue in-memory
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 2.3 Manual verification — localStorage round-trip (Property 7)
    - **Property 7: localStorage round-trip preserves all transaction data**
    - Add several transactions, open DevTools → Application → localStorage, confirm the `"transactions"` key holds a JSON array with correct `id`, `name`, `amount`, and `category` for every entry; close and reopen the tab and confirm all data is restored
    - **Validates: Requirements 6.1, 6.2, 2.3**

- [x] 3. Implement input validation (`js/app.js`)
  - [x] 3.1 Implement `validateForm(name, amount, category)`
    - Return `{ valid: boolean, errors: { name?, amount?, category? } }`
    - `name`: reject if `name.trim()` is empty (covers empty string, spaces, tabs, newlines)
    - `amount`: reject if the value is not a finite number or is `<= 0`
    - `category`: reject if value is not in `["Food", "Transport", "Fun"]`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.2 Implement `showErrors(errors)` and `clearErrors()`
    - `showErrors`: write each error message string to the corresponding `#name-error`, `#amount-error`, `#category-error` span's `textContent`; leave spans with no error unchanged
    - `clearErrors`: set all three error spans' `textContent` to `""`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 3.3 Manual verification — validation rules (Properties 2 & 3)
    - **Property 2: Whitespace-only names are rejected**
    - Submit `""`, `"   "`, and a tab character as the name; confirm the name error span shows a message and the transaction list is unchanged
    - **Property 3: Non-positive and non-numeric amounts are rejected**
    - Submit `0`, `-5`, and a non-numeric string as the amount; confirm the amount error span shows a message and the transaction list is unchanged
    - **Validates: Requirements 7.1, 7.2**

- [x] 4. Implement transaction mutations (`js/app.js`)
  - [x] 4.1 Implement `addTransaction(name, amount, category)`
    - Generate a unique `id` using `crypto.randomUUID()` with a fallback to `Date.now().toString() + Math.random()`
    - Push `{ id, name: name.trim(), amount: parseFloat(amount), category }` onto `transactions`
    - Call `saveToStorage(transactions)`
    - Call `renderList()`, `renderBalance()`, `renderChart()`
    - _Requirements: 1.2, 1.3, 2.1_

  - [x] 4.2 Implement `deleteTransaction(id)`
    - Use `findIndex` to locate the entry; if index is `-1`, return early without mutating state
    - Splice the entry from `transactions`
    - Call `saveToStorage(transactions)`
    - Call `renderList()`, `renderBalance()`, `renderChart()`
    - _Requirements: 3.2, 3.3_

  - [x] 4.3 Implement `handleFormSubmit(event)`
    - Prevent default form submission
    - Read values from `#name-input`, `#amount-input`, `#category-select`
    - Call `validateForm`; if invalid call `showErrors(errors)` and return
    - Call `clearErrors()`, then `addTransaction(name, amount, category)`, then `form.reset()`
    - _Requirements: 1.2, 1.4, 1.5, 7.4_

  - [ ]* 4.4 Manual verification — add and delete correctness (Properties 1 & 4)
    - **Property 1: Valid transaction addition is reflected in state and storage**
    - Add 3 transactions one at a time; after each, confirm the list item count increases by 1 and `localStorage` contains the new entry
    - **Property 4: Transaction deletion removes exactly the target from state and storage**
    - Add 3 transactions, delete the middle one; confirm only that entry is gone from the list and from `localStorage`, and the other two remain intact
    - **Validates: Requirements 1.2, 1.3, 3.2, 3.3, 2.1**

- [x] 5. Checkpoint — core data flow working
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` in a browser; add a valid transaction and confirm it appears in the list, the balance updates, and `localStorage` is written; delete it and confirm the reverse; submit with empty fields and confirm error messages appear

- [x] 6. Implement render functions (`js/app.js`)
  - [x] 6.1 Implement `renderBalance(transactions)`
    - Sum all `transaction.amount` values (return `0` for an empty array)
    - Write a formatted currency string (e.g. `"$40.00"`) to `document.getElementById("balance").textContent`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 6.2 Manual verification — balance sum (Property 5)
    - **Property 5: Balance always equals the arithmetic sum of all amounts**
    - Add transactions with known amounts (e.g. $10, $25, $5); confirm the balance display shows $40.00; delete one and confirm the balance updates correctly; delete all and confirm the balance shows $0.00
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [x] 6.3 Implement `renderList(transactions)`
    - Clear `<ul id="transaction-list">` by setting `innerHTML = ""`
    - For each transaction, create an `<li>` containing: item name, formatted amount, a category badge `<span>` styled with the category colour, and a `<button data-id="...">` delete control with an accessible label
    - Attach a single delegated `click` listener on the `<ul>` (set once in `init()`); when a click target has `dataset.id`, call `deleteTransaction(dataset.id)`
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 6.4 Implement `renderChart(transactions)`
    - Obtain the 2D context from `<canvas id="pie-chart">`; call `ctx.clearRect(0, 0, canvas.width, canvas.height)` at the start of every render
    - If `transactions` is empty: draw a full grey circle and render a centred "No data" text label; clear `#chart-summary` with a matching placeholder message; return early
    - Otherwise: compute per-category totals and the grand total; for each category with amount > 0, draw an arc segment using `ctx.arc()` with the proportional angle (`(categoryTotal / grandTotal) * 2 * Math.PI`) and fill with the category's colour from `CATEGORY_COLORS`
    - Populate `<ul id="chart-summary">`: one `<li>` per category that has transactions, showing a colour swatch, the category name, and the formatted total amount
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 6.5 Manual verification — chart proportions (Property 6)
    - **Property 6: Pie chart proportions are mathematically correct**
    - Add $10 Food and $10 Transport; confirm each segment is visually ~50% of the chart; add $20 Fun; confirm Food and Transport are each ~25% and Fun is ~50%; verify the chart summary shows the correct totals per category
    - **Validates: Requirements 5.1, 5.2, 5.7**

- [x] 7. Implement `init()` and wire everything together (`js/app.js`)
  - Implement `init()`: call `loadFromStorage()` and assign the result to `transactions`; call `renderList(transactions)`, `renderBalance(transactions)`, `renderChart(transactions)`; attach the `submit` listener on `#add-form` pointing to `handleFormSubmit`; attach the delegated `click` listener on `#transaction-list`
  - Confirm the `DOMContentLoaded` callback calls `init()` and nothing else runs at the top level
  - _Requirements: 2.3, 4.4, 5.5, 6.1_

  - [ ]* 7.1 Manual verification — error clearing on valid resubmit (Property 8)
    - **Property 8: Valid resubmission clears all prior error messages**
    - Submit the form with all fields empty to trigger all three error spans; then fill all fields with valid data and submit; confirm every error span has empty `textContent` after the successful submission
    - **Validates: Requirements 7.4**

- [x] 8. Checkpoint — full render pipeline working
  - Ensure all tests pass, ask the user if questions arise.
  - Reload `index.html`; confirm previously saved transactions are restored (list, balance, chart all populated); add and delete transactions and confirm all four render functions update in sync

- [x] 9. Implement CSS layout and visual design (`css/styles.css`)
  - [x] 9.1 Define CSS custom properties and base styles
    - Declare `--color-food`, `--color-transport`, `--color-fun`, `--color-bg`, `--color-surface`, `--color-text`, `--color-error`, `--spacing-*`, and `--font-size-*` custom properties in `:root`
    - Set `box-sizing: border-box` globally; apply a neutral background and readable base font
    - _Requirements: 8.3_

  - [x] 9.2 Style the balance display, input form, and validation errors
    - Make the balance display prominent (large font, high contrast against background — minimum 4.5:1 ratio)
    - Style the form fields, dropdown, and submit button with clear focus states
    - Style `.error` spans in a distinct colour (e.g. red) with sufficient contrast; hide them when empty via CSS (e.g. `min-height` or `visibility`)
    - _Requirements: 8.3, 8.4_

  - [x] 9.3 Style the transaction list
    - Apply `overflow-y: auto` and a fixed `max-height` to `#transaction-list` so it scrolls when entries exceed the visible area
    - Style each `<li>` with name, amount, category badge, and delete button laid out clearly
    - Style category badges using the category colour custom properties
    - _Requirements: 2.2, 3.1, 8.4_

  - [x] 9.4 Style the chart area and responsive layout
    - Place the canvas and `#chart-summary` side-by-side on wider viewports; stack them vertically on narrow viewports (≤ 600px) using a media query or flexbox wrapping
    - Ensure the layout remains usable at 320px viewport width through to 1920px
    - _Requirements: 5.7, 8.4_

- [x] 10. Final checkpoint — complete application
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` directly as a local file (no server) in Chrome, Firefox, Edge, and Safari; run through all manual smoke tests from the design document; verify the layout is usable at 320px and 1920px viewport widths; confirm no external network requests are made (DevTools → Network tab)

## Notes

- Tasks marked with `*` are optional manual verification steps — they describe what to check in the browser rather than automated test code, since this project has no test runner
- Each task references specific requirements for traceability
- Checkpoints (tasks 5, 8, 10) are natural integration points to confirm the app works end-to-end before moving on
- The `transactions` array is the single source of truth — every render function reads from it directly; never update the DOM without going through the render functions
- All four render functions (`renderList`, `renderBalance`, `renderChart`, and the chart summary inside `renderChart`) must be called together after every mutation to keep the UI in sync
