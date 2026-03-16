// ====== Simple LocalStorage Inventory (Technician OUT) ======
const form = document.querySelector("#requestForm");
const message = document.querySelector("#message");
const historyBody = document.querySelector("#historyBody");

const STORAGE_KEY = "pci_inventory_v1";
const TECH_NAME = "Lucas"; // depois a gente troca por "usuário logado"

// Produtos iniciais (precisa bater com os values do <select>)
const DEFAULT_INVENTORY = {
  termidor: { name: "Termidor", unit: "Bottle", stock: 12 },
  talstar: { name: "Talstar", unit: "Bottle", stock: 8 },
  advion: { name: "Advion Gel", unit: "Tubes", stock: 20 },
  maxforce: { name: "Maxforce", unit: "Tubes", stock: 15 },
};

// Estrutura do estado salvo
function defaultState() {
  return {
    inventory: DEFAULT_INVENTORY,
    history: [
      // exemplo (pode deixar vazio se quiser)
      { date: "2026-01-25", product: "Termidor", qty: 2, tech: "Lucas" },
    ],
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();

  try {
    const parsed = JSON.parse(raw);

    // Garantir que tem estrutura mínima
    if (!parsed.inventory || !parsed.history) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function setMessage(text) {
  message.textContent = text;
}

function renderInventory(state) {
  // Atualiza os <td id="stock-..."> com o valor do state
  for (const key of Object.keys(state.inventory)) {
    const cell = document.querySelector(`#stock-${key}`);
    if (cell) cell.textContent = String(state.inventory[key].stock);
  }
}

function renderHistory(state) {
  // Limpa e re-renderiza
  historyBody.innerHTML = "";

  // Mostra do mais recente pro mais antigo
  const items = [...state.history].reverse();

  for (const item of items) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${item.product}</td>
      <td>${item.qty}</td>
      <td>${item.tech}</td>
    `;
    historyBody.appendChild(tr);
  }
}

// ====== Boot ======
let state = loadState();
renderInventory(state);
renderHistory(state);

// ====== Handle OUT (technician withdrawal) ======
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const productKey = document.querySelector("#product").value;
  const qty = Number(document.querySelector("#qty").value);

  if (!productKey) {
    setMessage("Please select a product.");
    return;
  }
  if (!Number.isFinite(qty) || qty < 1) {
    setMessage("Please enter a valid quantity (1 or more).");
    return;
  }

  const product = state.inventory[productKey];
  if (!product) {
    setMessage("Product not found. Check your select values.");
    return;
  }

  if (qty > product.stock) {
    setMessage(`Not enough stock. Available: ${product.stock}`);
    return;
  }

  // Update stock
  product.stock -= qty;

  // Add history record (OUT)
  state.history.push({
    date: todayISO(),
    type: "out",
    product: product.name,
    qty,
    tech: TECH_NAME,
  });

  saveState(state);
  renderInventory(state);
  renderHistory(state);

  setMessage("Added to history ✅");
  form.reset();
});