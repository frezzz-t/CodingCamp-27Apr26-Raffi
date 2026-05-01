// dark mode function

let darkmode = localStorage.getItem('darkmode')
const themeswitch = document.getElementById('theme-switch')

const enableDarkmode = () => {
  document.body.classList.add('darkmode')
  localStorage.setItem('darkmode', 'activate')
}

const disableDarkmode = () => {
  document.body.classList.remove('darkmode')
  localStorage.setItem('darkmode', 'null')
}

if(darkmode === "activate") enableDarkmode()

themeswitch.addEventListener("click", () => {
  darkmode = localStorage.getItem('darkmode')
  darkmode !== "activate" ? enableDarkmode() : disableDarkmode()
})

// ─── Data ────────────────────────────────────────────────────────────────────

let transactions = [];

// Built-in categories and their fixed colours
const BUILTIN_CATEGORIES = ["Food", "Transport", "Fun"];

const CATEGORY_COLORS = {
  Food:      "#FF6B6B",
  Transport: "#4ECDC4",
  Fun:       "#FFE66D",
};

// Palette for auto-assigning colours to custom categories
const CUSTOM_COLOR_PALETTE = [
  "#A78BFA", "#34D399", "#FB923C", "#60A5FA",
  "#F472B6", "#FBBF24", "#4ADE80", "#E879F9",
  "#38BDF8", "#F87171",
];

// Custom categories added by user (persisted separately)
let customCategories = [];

// Sort state — does NOT mutate transactions array; applied at render time only
// sortKey: "none" | "amount-asc" | "amount-desc" | "category-asc" | "category-desc"
let sortKey = "none";

function getSortedTransactions() {
  if (sortKey === "none") return transactions.slice();
  return transactions.slice().sort(function (a, b) {
    if (sortKey === "amount-asc")    return a.amount - b.amount;
    if (sortKey === "amount-desc")   return b.amount - a.amount;
    if (sortKey === "category-asc")  return a.category.localeCompare(b.category);
    if (sortKey === "category-desc") return b.category.localeCompare(a.category);
    return 0;
  });
}

// Dynamic full list — always built-in first, then custom
function getCategories() {
  return BUILTIN_CATEGORIES.concat(customCategories);
}

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

function loadCustomCategoriesFromStorage() {
  const raw = localStorage.getItem("customCategories") ?? "[]";
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("expense-tracker: could not parse custom categories; resetting to [].", e);
    return [];
  }
}

function saveToStorage(transactions) {
  try {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  } catch (e) {
    console.warn("expense-tracker: localStorage is unavailable; data will not persist across sessions.", e);
  }
}

function saveCustomCategoriesToStorage() {
  try {
    localStorage.setItem("customCategories", JSON.stringify(customCategories));
  } catch (e) {
    console.warn("expense-tracker: localStorage is unavailable; custom categories will not persist.", e);
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/**
 * Application entry point.
 * Loads persisted data, renders all UI components, and wires up event listeners.
 * Render and mutation functions are implemented in later tasks.
 */
function init() {
  // Load persisted data
  customCategories = loadCustomCategoriesFromStorage();
  // Assign colours for any custom categories already stored
  customCategories.forEach(function (cat) {
    if (!CATEGORY_COLORS[cat]) {
      assignCustomColor(cat);
    }
  });

  transactions = loadFromStorage();

  // Populate select with any persisted custom categories
  customCategories.forEach(function (cat) {
    addCategoryOption(cat);
  });

  renderList();
  renderBalance();
  renderChart();

  document.getElementById("add-form").addEventListener("submit", handleFormSubmit);

  document.getElementById("transaction-list").addEventListener("click", function (event) {
    const target = event.target.closest("[data-id]");
    if (target) {
      deleteTransaction(target.dataset.id);
    }
  });

  // Sort control
  document.getElementById("sort-select").addEventListener("change", function () {
    sortKey = this.value;
    renderList();
  });

  // Show/hide custom category input when "Add custom…" selected
  document.getElementById("category-select").addEventListener("change", function () {    const customGroup = document.getElementById("custom-category-group");
    customGroup.style.display = this.value === "__custom__" ? "flex" : "none";
  });

  // "Add" button next to custom category input
  document.getElementById("add-custom-category-btn").addEventListener("click", function () {
    const input = document.getElementById("custom-category-input");
    const name = input.value.trim();
    if (!name) return;

    const all = getCategories();
    if (all.map(function (c) { return c.toLowerCase(); }).includes(name.toLowerCase())) {
      // Already exists — just select it
      document.getElementById("category-select").value = all.find(function (c) {
        return c.toLowerCase() === name.toLowerCase();
      });
    } else {
      // New custom category
      customCategories.push(name);
      assignCustomColor(name);
      saveCustomCategoriesToStorage();
      addCategoryOption(name);
      document.getElementById("category-select").value = name;
    }

    // Hide custom input group
    document.getElementById("custom-category-group").style.display = "none";
    input.value = "";
  });
}

document.addEventListener("DOMContentLoaded", function () {
  init();
});

// ─── Custom Category Helpers ──────────────────────────────────────────────────

// Assign next available colour from palette to a new custom category
function assignCustomColor(name) {
  const usedCount = customCategories.indexOf(name);
  CATEGORY_COLORS[name] = CUSTOM_COLOR_PALETTE[usedCount % CUSTOM_COLOR_PALETTE.length];
}

// Inject a new <option> into #category-select before the "Add custom…" option
function addCategoryOption(name) {
  const select = document.getElementById("category-select");
  const customOpt = document.getElementById("opt-custom");
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  select.insertBefore(opt, customOpt);
}

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

  if (typeof name !== "string" || name.trim() === "") {
    errors.name = "Item name is required.";
  }

  const numericAmount = Number(amount);
  if (!isFinite(numericAmount) || numericAmount <= 0) {
    errors.amount = "Please enter an amount greater than zero.";
  }

  // Validate against dynamic category list; "__custom__" is never a valid final value
  if (!getCategories().includes(category)) {
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

  getSortedTransactions().forEach(function (t) {
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
  const allCategories = getCategories();
  const totals = {};
  allCategories.forEach(function (cat) {
    totals[cat] = 0;
  });

  transactions.forEach(function (t) {
    if (totals[t.category] !== undefined) {
      totals[t.category] += t.amount;
    } else {
      // transaction has a category not in current list (edge case) — still show it
      totals[t.category] = t.amount;
      if (!CATEGORY_COLORS[t.category]) {
        CATEGORY_COLORS[t.category] = "#aaaaaa";
      }
    }
  });

  const grandTotal = Object.values(totals).reduce(function (sum, v) {
    return sum + v;
  }, 0);

  // ── Draw arc segments ────────────────────────────────────────────────────
  let startAngle = -Math.PI / 2;

  Object.keys(totals).forEach(function (cat) {
    const catTotal = totals[cat];
    if (catTotal <= 0) return;

    const sliceAngle = (catTotal / grandTotal) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = CATEGORY_COLORS[cat] || "#aaaaaa";
    ctx.fill();

    startAngle += sliceAngle;
  });

  // ── Populate chart summary list ──────────────────────────────────────────
  summary.innerHTML = "";

  Object.keys(totals).forEach(function (cat) {
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
