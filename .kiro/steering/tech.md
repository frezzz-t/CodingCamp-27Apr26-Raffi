---
inclusion: always
---

# Tech Stack

## Core Stack

| Layer | Technology | File |
|-------|-----------|------|
| Markup | HTML5 | `index.html` |
| Styles | Plain CSS | `css/styles.css` |
| Logic | Vanilla JavaScript ES6+ | `js/app.js` |

No frameworks, no build tools, no external dependencies. The app opens directly in a browser as a local HTML file — no server or build step required.

## JavaScript

- **Single file**: all logic lives in `js/app.js`. Do not create additional JS files or split into modules.
- **No `import`/`export`**: loaded as a classic `<script>`, not an ES module.
- **No transpilation**: write ES6+ that runs natively in current Chrome, Firefox, Edge, and Safari.
- **DOM ready**: wrap all initialization and event listener registration in a `DOMContentLoaded` callback.
- **DOM selection**: use `document.querySelector` / `getElementById` only — no jQuery or similar libraries.
- **Form validation**: render inline error messages adjacent to the relevant field; clear errors on successful re-submission.
- **No external libraries**: do not introduce any third-party JS unless the user explicitly approves.

## CSS

- **Single file**: all styles live in `css/styles.css`. No preprocessors (Sass, Less, PostCSS).
- Use CSS custom properties (`--var-name`) for shared values such as colors, spacing, and font sizes.
- No CSS frameworks (Bootstrap, Tailwind, etc.) unless explicitly approved.

## Data Persistence

- Use `localStorage` exclusively — no IndexedDB, sessionStorage, network requests, or backend.
- **Storage key**: `"transactions"` (single key, consistent across all reads and writes).
- **Read pattern**: `JSON.parse(localStorage.getItem("transactions") ?? "[]")`
- **Write pattern**: `localStorage.setItem("transactions", JSON.stringify(array))`
- Persist the updated array immediately after every add or delete operation.

## Charting

- Render the spending pie chart using the **Canvas API** or **inline SVG** — both are acceptable.
- **Never** introduce external charting libraries (Chart.js, D3, Recharts, etc.) unless the user explicitly approves.
- Re-render the chart in place on every transaction list change (add or delete).
- Each category slice should be visually distinct; use consistent colors tied to category identity.

## Browser Support

- Target current stable versions of Chrome, Firefox, Edge, and Safari.
- Avoid APIs that lack broad support across all four browsers (check MDN compatibility tables when uncertain).
