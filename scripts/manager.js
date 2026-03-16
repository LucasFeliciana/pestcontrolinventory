const STORAGE_KEY = "pci_inventory_v1";
const MANAGER_NAME = "Manager";

const form = document.querySelector("#managerForm");
const message = document.querySelector("#message");
const historyBody = document.querySelector("#historyBody");

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayISO() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function setMessage(text) {
  message.textContent = text;
}

function renderInventory(state) {
  for (const key of Object.keys(state.inventory)) {
    const cell = document.querySelector(`#stock-${key}`);
    if (cell) cell.textContent = String(state.inventory[key].stock);
  }
}

function renderHistory(state) {
  historyBody.innerHTML = "";

  const items = [...state.history].reverse();

  for (const item of items) {
    // item.type pode não existir se você ainda não salvou isso no app.js do técnico
    const type = item.type ? item.type.toUpperCase() : "OUT";

    const note = item.note ? item.note : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${type}</td>
      <td>${item.product}</td>
      <td>${item.qty}</td>
      <td>${item.tech}</td>
      <td>${note}</td>
    `;
    historyBody.appendChild(tr);
  }
}

// Boot
let state = loadState();

if (!state) {
  setMessage("No data found yet. Go to Technician page and create the first record.");
} else {
  renderInventory(state);
  renderHistory(state);
}

// Handle IN / ADJUST
form.addEventListener("submit", (e) => {
  e.preventDefault();

  state = loadState();
  if (!state) {
    setMessage("No data found. Create data first on Technician page.");
    return;
  }

  const actionType = document.querySelector("#actionType").value; // in | adjust
  const productKey = document.querySelector("#product").value;
  const qty = Number(document.querySelector("#qty").value);
  const note = document.querySelector("#note").value.trim();

  if (!productKey) {
    setMessage("Please select a product.");
    return;
  }
  if (!Number.isFinite(qty) || qty < 1) {
    setMessage("Please enter a valid quantity.");
    return;
  }

  const product = state.inventory[productKey];
  if (!product) {
    setMessage("Product not found.");
    return;
  }

  if (actionType === "in") {
    product.stock += qty;
    state.history.push({
      date: todayISO(),
      type: "in",
      product: product.name,
      qty,
      tech: MANAGER_NAME,
      note,
    });
  } else {
    // adjust: por enquanto, vamos tratar como "setar" via +qty (correção positiva)
    // Se quiser ajuste negativo também, a gente melhora já já.
    product.stock += qty;
    state.history.push({
      date: todayISO(),
      type: "adjust",
      product: product.name,
      qty,
      tech: MANAGER_NAME,
      note: note || "Adjustment",
    });
  }

  saveState(state);
  renderInventory(state);
  renderHistory(state);

  setMessage("Saved ✅");
  form.reset();
});
