const STORAGE_KEY = "pci_inventory_v2";

const removeForm = document.getElementById("removeForm");
const productSelect = document.getElementById("product");
const messageEl = document.getElementById("message");
const inventoryBody = document.getElementById("inventoryBody");
const historyBody = document.getElementById("historyBody");

function createDefaultState() {
  return {
    inventory: [
      { id: "termidor", name: "Termidor", unit: "Bottle", stock: 12 },
      { id: "talstar", name: "Talstar", unit: "Bottle", stock: 8 },
      { id: "advion-gel", name: "Advion Gel", unit: "Tube", stock: 20 },
      { id: "maxforce", name: "Maxforce", unit: "Tube", stock: 15 }
    ],
    history: []
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const state = createDefaultState();
    saveState(state);
    return state;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.inventory) || !Array.isArray(parsed.history)) {
      return createDefaultState();
    }
    return parsed;
  } catch (error) {
    return createDefaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function buildProductOptions(inventory) {
  productSelect.innerHTML = '<option value="">Select a product</option>';
  inventory.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.name} (${item.stock} ${item.unit})`;
    productSelect.appendChild(option);
  });
}

function renderInventory(state) {
  inventoryBody.innerHTML = "";
  state.inventory.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.unit}</td>
      <td>${item.stock}</td>
    `;
    inventoryBody.appendChild(row);
  });

  buildProductOptions(state.inventory);
}

function renderHistory(state) {
  historyBody.innerHTML = "";

  if (state.history.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="7">No transactions yet.</td>';
    historyBody.appendChild(row);
    return;
  }

  [...state.history].reverse().forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.type.toUpperCase()}</td>
      <td>${entry.productName}</td>
      <td>${entry.qty}</td>
      <td>${entry.user}</td>
      <td>${entry.note || "-"}</td>
      <td>${entry.balance}</td>
    `;
    historyBody.appendChild(row);
  });
}

function getProductById(state, id) {
  return state.inventory.find((item) => item.id === id);
}

function removeStock(event) {
  event.preventDefault();

  const techName = document.getElementById("techName").value.trim();
  const productId = productSelect.value;
  const qty = Number(document.getElementById("qty").value);

  if (!techName) {
    showMessage("Technician name is required.", "error");
    return;
  }

  if (!productId) {
    showMessage("Please choose a product.", "error");
    return;
  }

  if (!Number.isInteger(qty) || qty <= 0) {
    showMessage("Quantity must be a whole number greater than 0.", "error");
    return;
  }

  const state = loadState();
  const product = getProductById(state, productId);

  if (!product) {
    showMessage("Product was not found.", "error");
    return;
  }

  if (qty > product.stock) {
    showMessage(`Not enough stock. Available: ${product.stock}.`, "error");
    return;
  }

  product.stock -= qty;

  state.history.push({
    date: today(),
    type: "out",
    productId: product.id,
    productName: product.name,
    qty,
    user: techName,
    note: "Technician removed stock",
    balance: product.stock
  });

  saveState(state);
  renderInventory(state);
  renderHistory(state);
  removeForm.reset();
  showMessage("Stock removed successfully.", "success");
}

const appState = loadState();
renderInventory(appState);
renderHistory(appState);
removeForm.addEventListener("submit", removeStock);
