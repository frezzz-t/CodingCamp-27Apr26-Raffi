# Project Structure

```
/
├── index.html          # Single HTML entry point; loads CSS and JS
├── css/
│   └── styles.css      # All styles — one file, no preprocessor
├── js/
│   └── app.js          # All application logic — one file, vanilla JS
├── .kiro/
│   ├── specs/
│   │   └── expense-budget-visualizer/
│   │       ├── requirements.md
│   │       └── .config.kiro
│   └── steering/       # This directory
└── README.md
```

## Conventions
- **One JS file, one CSS file** — do not split into modules or multiple files unless the spec explicitly calls for it
- **No external dependencies** — do not introduce npm packages, CDN libraries, or frameworks without explicit user approval
- **localStorage key** — use a single, consistent key (e.g., `"transactions"`) to store the serialized transaction array
- **DOM manipulation** — use plain `document.querySelector` / `getElementById`; avoid jQuery or similar
- **Event handling** — attach listeners in `app.js` after DOM content is loaded (`DOMContentLoaded`)
- **Validation** — inline error messages rendered next to the relevant form field; cleared on successful re-submission
- **Chart updates** — re-render the pie chart in place whenever the transaction list changes (add or delete)
