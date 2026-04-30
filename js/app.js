// ─── Data ────────────────────────────────────────────────────────────────────

let transactions = [];

const CATEGORY_COLORS = {
  Food:      "#FF6B6B",
  Transport: "#4ECDC4",
  Fun:       "#FFE66D",
};

const CATEGORIES = ["Food", "Transport", "Fun"];

// ─── Persistence ─────────────────────────────────────────────────────────────

/**
 * Read the transactions array from localStorage.
 * Falls back to [] if the key is missing or the stored value is malformed JSON.
 * @returns {Array} Parsed transactions array.
 */
function loadFromStorage() {
  const raw = localStorage.getItem("transactions") ?? "[]";
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("expense-tracker: could not parse stored transactions; resetting to [].", e);
    return [];
  }
}

/**
 * Persist the current transactions array to localStorage.
 * If storage is unavailable (e.g. private-browsing quota exceeded) the app
 * continues to work in-memory and a warning is logged to the console.
 * @param {Array} transactions - The array to persist.
 */
function saveToStorage(transactions) {
  try {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  } catch (e) {
    console.warn("expense-tracker: localStorage is unavailable; data will not persist across sessions.", e);
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Application entry point.
 * Loads persisted data, renders all UI components, and wires up event listeners.
 * Render and mutation functions are implemented in later tasks.
 */
function init() {
  // 6.1 — Load persisted transactions and populate the global array
  transactions = loadFromStorage();

  // 2.3, 4.4, 5.5 — Render all UI components from stored data
  renderList();
  renderBalance();
  renderChart();

  // 4.4 — Wire up form submission
  document.getElementById("add-form").addEventListener("submit", handleFormSubmit);

  // 6.1 — Delegated click listener for delete buttons on the transaction list
  document.getElementById("transaction-list").addEventListener("click", function (event) {
    const target = event.target.closest("[data-id]");
    if (target) {
      deleteTransaction(target.dataset.id);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  init();
});

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate the three form fields before a transaction is added.
 *
 * @param {string} name     - Raw value from #name-input.
 * @param {*}      amount   - Raw value from #amount-input (may be string or number).
 * @param {string} category - Selected value from #category-select.
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validateForm(name, amount, category) {
  const errors = {};

  // 7.1 — name must be non-empty after trimming whitespace
  if (typeof name !== "string" || name.trim() === "") {
    errors.name = "Item name is required.";
  }

  // 7.2 — amount must be a finite number greater than zero
  const numericAmount = Number(amount);
  if (!isFinite(numericAmount) || numericAmount <= 0) {
    errors.amount = "Please enter an amount greater than zero.";
  }

  // 7.3 — category must be one of the three allowed values
  if (!CATEGORIES.includes(category)) {
    errors.category = "Please select a category.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Write validation error messages to the corresponding error spans.
 * Only spans whose key is present in `errors` are updated; all others are
 * left unchanged so that previously-set messages are not accidentally cleared.
 *
 * @param {{ name?: string, amount?: string, category?: string }} errors
 */
function showErrors(errors) {
  if (errors.name !== undefined) {
    document.getElementById("name-error").textContent = errors.name;
  }
  if (errors.amount !== undefined) {
    document.getElementById("amount-error").textContent = errors.amount;
  }
  if (errors.category !== undefined) {
    document.getElementById("category-error").textContent = errors.category;
  }
}

/**
 * Clear all three inline validation error spans.
 * Called before a successful form submission so stale messages are removed.
 */
function clearErrors() {
  document.getElementById("name-error").textContent = "";
  document.getElementById("amount-error").textContent = "";
  document.getElementById("category-error").textContent = "";
}

// ─── Transaction Mutations ────────────────────────────────────────────────────

/**
 * Add a new transaction to the in-memory array, persist it, and re-render.
 *
 * @param {string} name     - Item name (will be trimmed).
 * @param {number|string} amount   - Positive numeric amount.
 * @param {string} category - One of "Food", "Transport", "Fun".
 */
function addTransaction(name, amount, category) {
  // Generate a unique id; fall back for browsers without crypto.randomUUID
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random();

  transactions.push({
    id,
    name: name.trim(),
    amount: parseFloat(amount),
    category,
  });

  saveToStorage(transactions);
  renderList();
  renderBalance();
  renderChart();
}

/**
 * Remove the transaction with the given id from the in-memory array,
 * persist the updated array, and re-render.
 * If no transaction with that id exists, returns without mutating state.
 *
 * @param {string} id - The id of the transaction to remove.
 */
function deleteTransaction(id) {
  const index = transactions.findIndex(function (t) { return t.id === id; });
  if (index === -1) {
    return;
  }

  transactions.splice(index, 1);

  saveToStorage(transactions);
  renderList();
  renderBalance();
  renderChart();
}

/**
 * Handle the #add-form submit event.
 * Validates input, shows errors on failure, or adds the transaction and resets
 * the form on success.
 *
 * @param {Event} event - The form submit event.
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const name = document.getElementById("name-input").value;
  const amount = document.getElementById("amount-input").value;
  const category = document.getElementById("category-select").value;

  const { valid, errors } = validateForm(name, amount, category);

  if (!valid) {
    showErrors(errors);
    return;
  }

  clearErrors();
  addTransaction(name, amount, category);
  form.reset();
}

// ─── Render Functions ─────────────────────────────────────────────────────────

/**
 * Compute the sum of all transaction amounts and display it as a formatted
 * currency string in the #balance element.
 * Reads directly from the global `transactions` array.
 */
function renderBalance() {
  const total = transactions.reduce(function (sum, t) {
    return sum + t.amount;
  }, 0);

  document.getElementById("balance").textContent =
    "$" + total.toFixed(2);
}

/**
 * Re-render the transaction list by clearing #transaction-list and rebuilding
 * one <li> per transaction.  Each item shows the name, formatted amount, a
 * colour-coded category badge, and a delete button carrying the transaction id.
 * Delete clicks are handled via event delegation wired up in init().
 * Reads directly from the global `transactions` array.
 */
function renderList() {
  const ul = document.getElementById("transaction-list");
  ul.innerHTML = "";

  transactions.forEach(function (t) {
    const li = document.createElement("li");
    li.className = "transaction-item";

    // Item name
    const nameSpan = document.createElement("span");
    nameSpan.className = "transaction-name";
    nameSpan.textContent = t.name;

    // Formatted amount
    const amountSpan = document.createElement("span");
    amountSpan.className = "transaction-amount";
    amountSpan.textContent = "$" + t.amount.toFixed(2);

    // Category badge
    const badge = document.createElement("span");
    badge.className = "category-badge";
    badge.textContent = t.category;
    badge.style.backgroundColor = CATEGORY_COLORS[t.category] || "#ccc";

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.id = t.id;
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", "Delete transaction: " + t.name);

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(badge);
    li.appendChild(deleteBtn);

    ul.appendChild(li);
  });
}

/**
 * Re-render the pie chart on <canvas id="pie-chart"> and populate the
 * #chart-summary list.
 *
 * Empty state: draws a grey placeholder circle with a centred "No data" label
 * and sets a placeholder message in #chart-summary.
 *
 * Non-empty state: draws one arc segment per category that has transactions,
 * proportional to that category's share of the grand total.  Segments start
 * from the top of the circle (-Math.PI / 2).  Also populates #chart-summary
 * with one <li> per category showing a colour swatch, name, and total amount.
 *
 * Reads directly from the global `transactions` array.
 */
function renderChart() {
  const canvas = document.getElementById("pie-chart");
  const ctx = canvas.getContext("2d");

  // Always clear before drawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy) - 10;

  const summary = document.getElementById("chart-summary");

  // ── Empty state ──────────────────────────────────────────────────────────
  if (transactions.length === 0) {
    // Grey placeholder circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#d1d5db";
    ctx.fill();

    // Centred "No data" label
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No data", cx, cy);

    summary.innerHTML =
      "<li class=\"chart-summary-placeholder\">No transactions yet.</li>";
    return;
  }

  // ── Compute per-category totals ──────────────────────────────────────────
  const totals = {};
  CATEGORIES.forEach(function (cat) {
    totals[cat] = 0;
  });

  transactions.forEach(function (t) {
    if (totals[t.category] !== undefined) {
      totals[t.category] += t.amount;
    }
  });

  const grandTotal = Object.values(totals).reduce(function (sum, v) {
    return sum + v;
  }, 0);

  // ── Draw arc segments ────────────────────────────────────────────────────
  let startAngle = -Math.PI / 2; // start from the top

  CATEGORIES.forEach(function (cat) {
    const catTotal = totals[cat];
    if (catTotal <= 0) return;

    const sliceAngle = (catTotal / grandTotal) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = CATEGORY_COLORS[cat];
    ctx.fill();

    startAngle += sliceAngle;
  });

  // ── Populate chart summary list ──────────────────────────────────────────
  summary.innerHTML = "";

  CATEGORIES.forEach(function (cat) {
    const catTotal = totals[cat];
    if (catTotal <= 0) return;

    const li = document.createElement("li");
    li.className = "chart-summary-item";

    // Colour swatch
    const swatch = document.createElement("span");
    swatch.className = "chart-swatch";
    swatch.setAttribute("aria-hidden", "true");
    swatch.style.display = "inline-block";
    swatch.style.width = "12px";
    swatch.style.height = "12px";
    swatch.style.borderRadius = "2px";
    swatch.style.backgroundColor = CATEGORY_COLORS[cat];
    swatch.style.marginRight = "6px";
    swatch.style.verticalAlign = "middle";

    // Category name
    const nameSpan = document.createElement("span");
    nameSpan.className = "chart-summary-name";
    nameSpan.textContent = cat + ": ";

    // Total amount
    const amountSpan = document.createElement("span");
    amountSpan.className = "chart-summary-amount";
    amountSpan.textContent = "$" + catTotal.toFixed(2);

    li.appendChild(swatch);
    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    summary.appendChild(li);
  });
}
