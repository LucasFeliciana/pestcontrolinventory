const STORAGE_KEY = "pci_inventory_v2";

const productForm = document.getElementById("productForm");
const managerForm = document.getElementById("managerForm");
const managerProductSelect = document.getElementById("managerProduct");
const inventoryBody = document.getElementById("inventoryBody");
const historyBody = document.getElementById("historyBody");
const productMessage = document.getElementById("productMessage");
const managerMessage = document.getElementById("managerMessage");

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

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getProductById(state, id) {
  return state.inventory.find((item) => item.id === id);
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

function renderProductSelect(state) {
  managerProductSelect.innerHTML = '<option value="">Select a product</option>';
  state.inventory.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.name} (${item.stock} ${item.unit})`;
    managerProductSelect.appendChild(option);
  });
}

function refreshUI() {
  const state = loadState();
  renderInventory(state);
  renderHistory(state);
  renderProductSelect(state);
}

function createProduct(event) {
  event.preventDefault();

  const name = document.getElementById("newProductName").value.trim();
  const unit = document.getElementById("newProductUnit").value.trim();
  const stock = Number(document.getElementById("newProductStock").value);

  if (!name || !unit) {
    showMessage(productMessage, "Product name and unit are required.", "error");
    return;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    showMessage(productMessage, "Starting stock must be 0 or more.", "error");
    return;
  }

  const state = loadState();
  const id = slugify(name);

  if (!id) {
    showMessage(productMessage, "Please enter a valid product name.", "error");
    return;
  }

  const exists = state.inventory.some((item) => item.id === id || item.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    showMessage(productMessage, "A product with this name already exists.", "error");
    return;
  }

  const newItem = { id, name, unit, stock };
  state.inventory.push(newItem);

  state.history.push({
    date: today(),
    type: "create",
    productId: id,
    productName: name,
    qty: stock,
    user: "Manager",
    note: "New product created",
    balance: stock
  });

  saveState(state);
  productForm.reset();
  showMessage(productMessage, "Product created successfully.", "success");
  refreshUI();
}

function saveManagerAction(event) {
  event.preventDefault();

  const managerName = document.getElementById("managerName").value.trim() || "Manager";
  const productId = managerProductSelect.value;
  const actionType = document.getElementById("actionType").value;
  const qty = Number(document.getElementById("managerQty").value);
  const note = document.getElementById("managerNote").value.trim();

  if (!productId) {
    showMessage(managerMessage, "Please select a product.", "error");
    return;
  }

  if (!Number.isInteger(qty) || qty < 0) {
    showMessage(managerMessage, "Quantity must be a whole number 0 or more.", "error");
    return;
  }

  const state = loadState();
  const product = getProductById(state, productId);

  if (!product) {
    showMessage(managerMessage, "Product not found.", "error");
    return;
  }

  if (actionType === "in") {
    if (qty === 0) {
      showMessage(managerMessage, "Add stock must be greater than 0.", "error");
      return;
    }

    product.stock += qty;
    state.history.push({
      date: today(),
      type: "in",
      productId: product.id,
      productName: product.name,
      qty,
      user: managerName,
      note: note || "Stock added",
      balance: product.stock
    });
  } else {
    product.stock = qty;
    state.history.push({
      date: today(),
      type: "adjust",
      productId: product.id,
      productName: product.name,
      qty,
      user: managerName,
      note: note || "Adjusted to exact value",
      balance: product.stock
    });
  }

  saveState(state);
  managerForm.reset();
  document.getElementById("managerName").value = managerName;
  showMessage(managerMessage, "Manager action saved.", "success");
  refreshUI();
}

refreshUI();
productForm.addEventListener("submit", createProduct);
managerForm.addEventListener("submit", saveManagerAction);
