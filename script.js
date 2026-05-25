const menu = [
  { id: 1, name: "Espresso", price: 18000, category: "Coffee", image: "assets/espresso.svg" },
  { id: 2, name: "Americano", price: 22000, category: "Coffee", image: "assets/americano.svg" },
  { id: 3, name: "Cappuccino", price: 28000, category: "Coffee", image: "assets/cappuccino.svg" },
  { id: 4, name: "Cafe Latte", price: 30000, category: "Coffee", image: "assets/latte.svg" },
  { id: 5, name: "Mocha", price: 32000, category: "Coffee", image: "assets/mocha.svg" },
  { id: 6, name: "Matcha Latte", price: 33000, category: "Non Coffee", image: "assets/matcha.svg" },
  { id: 7, name: "Croissant", price: 25000, category: "Snack", image: "assets/croissant.svg" },
  { id: 8, name: "Brownies", price: 20000, category: "Snack", image: "assets/brownies.svg" }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let settings = JSON.parse(localStorage.getItem("settings")) || {
  storeName: "BrewCash Coffee",
  cashierName: "Farrel",
  taxRate: 10,
  currency: "Rp"
};

let activeCategory = "All";
let searchQuery = "";

const menuList = document.getElementById("menuList");
const cartItems = document.getElementById("cartItems");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const paymentInput = document.getElementById("payment");
const changeEl = document.getElementById("change");
const categoryTabs = document.getElementById("categoryTabs");

function saveData() {
  localStorage.setItem("cart", JSON.stringify(cart));
  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("settings", JSON.stringify(settings));
}

function formatRupiah(number) {
  return settings.currency + Number(number).toLocaleString("id-ID");
}

function showModal(title, message, icon = "✅") {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalMessage").textContent = message;
  document.getElementById("modalIcon").textContent = icon;
  document.getElementById("modalOverlay").classList.add("show");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
}

function switchPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  renderOrders();
  renderHistory();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => switchPage(btn.dataset.page));
});

function renderCategories() {
  const categories = ["All", ...new Set(menu.map(item => item.category))];

  categoryTabs.innerHTML = categories.map(category => `
    <button class="category-btn ${activeCategory === category ? "active" : ""}" onclick="setCategory('${category}')">
      ${category}
    </button>
  `).join("");
}

function setCategory(category) {
  activeCategory = category;
  renderCategories();
  renderMenu();
}

function renderMenu() {
  const filteredMenu = menu.filter(item => {
    const matchCategory = activeCategory === "All" || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  menuList.innerHTML = filteredMenu.map(item => `
    <article class="menu-card">
      <img src="${item.image}" alt="${item.name}" />
      <div class="menu-body">
        <div class="menu-meta">
          <div>
            <h4>${item.name}</h4>
            <p class="menu-category">${item.category}</p>
          </div>
          <span>${formatRupiah(item.price)}</span>
        </div>
        <button class="add-btn" onclick="addToCart(${item.id})">Tambah ke Order</button>
      </div>
    </article>
  `).join("");

  document.getElementById("totalMenu").textContent = menu.length;
}

function addToCart(id) {
  const selectedItem = menu.find(item => item.id === id);
  const existingItem = cart.find(item => item.id === id);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ ...selectedItem, qty: 1 });
  }

  saveData();
  renderCart();
}

function increaseQty(id) {
  const item = cart.find(item => item.id === id);
  item.qty += 1;
  saveData();
  renderCart();
}

function decreaseQty(id) {
  const item = cart.find(item => item.id === id);

  if (item.qty > 1) {
    item.qty -= 1;
  } else {
    cart = cart.filter(item => item.id !== id);
  }

  saveData();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(item => item.id !== id);
  saveData();
  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty">Belum ada pesanan. Tambahin dulu, jangan berharap struk muncul dari kehampaan.</p>`;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-top">
          <div>
            <strong>${item.name}</strong>
            <small>${formatRupiah(item.price)} / item</small>
          </div>
          <b>${formatRupiah(item.price * item.qty)}</b>
        </div>

        <div class="qty-control">
          <button onclick="decreaseQty(${item.id})">-</button>
          <span>${item.qty}</span>
          <button onclick="increaseQty(${item.id})">+</button>
          <button class="remove" onclick="removeItem(${item.id})">x</button>
        </div>
      </div>
    `).join("");
  }

  updateSummary();
  updateStats();
}

function getTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = Math.round(subtotal * (Number(settings.taxRate) / 100));
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function updateSummary() {
  const { subtotal, tax, total } = getTotals();
  const payment = Number(paymentInput.value) || 0;
  const change = payment - total;

  subtotalEl.textContent = formatRupiah(subtotal);
  taxEl.textContent = formatRupiah(tax);
  totalEl.textContent = formatRupiah(total);
  changeEl.textContent = change >= 0 ? formatRupiah(change) : formatRupiah(0);
}

function checkout() {
  const { subtotal, tax, total } = getTotals();
  const payment = Number(paymentInput.value) || 0;

  if (cart.length === 0) {
    showModal("Pesanan Kosong", "Pilih menu dulu sebelum checkout. Mesin kasir juga butuh bahan kerja.", "🛒");
    return;
  }

  if (payment < total) {
    showModal("Uang Kurang", `Totalnya ${formatRupiah(total)}, uang bayar belum cukup. Ekonomi memang kejam.`, "⚠️");
    return;
  }

  const order = {
    id: "ORD-" + Date.now(),
    date: new Date().toLocaleString("id-ID"),
    cashier: settings.cashierName,
    items: cart,
    subtotal,
    tax,
    total,
    payment,
    change: payment - total
  };

  orders.unshift(order);
  cart = [];
  paymentInput.value = "";

  saveData();
  renderCart();
  renderOrders();
  renderHistory();

  showModal(
    "Transaksi Berhasil",
    `Order berhasil diproses. Total ${formatRupiah(total)} dan kembalian ${formatRupiah(order.change)}.`,
    "✅"
  );
}

function clearCart() {
  cart = [];
  paymentInput.value = "";
  saveData();
  renderCart();
}

function renderOrders() {
  const ordersList = document.getElementById("ordersList");

  if (!ordersList) return;

  if (orders.length === 0) {
    ordersList.innerHTML = `<p class="empty">Belum ada order selesai.</p>`;
    return;
  }

  ordersList.innerHTML = orders.map(order => `
    <div class="order-row">
      <div>
        <strong>${order.id}</strong>
        <p>${order.date} • Kasir: ${order.cashier}</p>
      </div>
      <div>
        <strong>${formatRupiah(order.total)}</strong>
        <p>${order.items.length} jenis item</p>
      </div>
      <span class="badge">Paid</span>
    </div>
  `).join("");
}

function renderHistory() {
  const historyList = document.getElementById("historyList");

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.qty, 0);
  }, 0);

  document.getElementById("historyOrders").textContent = orders.length;
  document.getElementById("historyRevenue").textContent = formatRupiah(totalRevenue);
  document.getElementById("historyItems").textContent = totalItems;
  document.getElementById("todayRevenue").textContent = formatRupiah(totalRevenue);

  if (!historyList) return;

  if (orders.length === 0) {
    historyList.innerHTML = `<p class="empty">History masih kosong.</p>`;
    return;
  }

  historyList.innerHTML = orders.map(order => `
    <div class="history-row">
      <div>
        <strong>${order.id}</strong>
        <p>${order.items.map(item => `${item.name} x${item.qty}`).join(", ")}</p>
      </div>
      <div>
        <strong>${formatRupiah(order.total)}</strong>
        <p>${order.date}</p>
      </div>
      <span class="badge">Done</span>
    </div>
  `).join("");
}

function clearOrders() {
  orders = [];
  saveData();
  renderOrders();
  renderHistory();
  renderCart();
  showModal("Orders Dihapus", "Semua order berhasil dibersihkan.", "🗑️");
}

function exportHistory() {
  if (orders.length === 0) {
    showModal("History Kosong", "Tidak ada data yang bisa diexport.", "📄");
    return;
  }

  let text = `${settings.storeName} - Transaction History\n\n`;

  orders.forEach(order => {
    text += `${order.id}\n`;
    text += `Tanggal: ${order.date}\n`;
    text += `Kasir: ${order.cashier}\n`;
    text += `Items: ${order.items.map(item => `${item.name} x${item.qty}`).join(", ")}\n`;
    text += `Total: ${formatRupiah(order.total)}\n\n`;
  });

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "history-transaksi.txt";
  link.click();
  URL.revokeObjectURL(url);

  showModal("Export Berhasil", "File history transaksi berhasil dibuat.", "📄");
}

function saveSettings(event) {
  event.preventDefault();

  settings = {
    storeName: document.getElementById("storeName").value || "BrewCash Coffee",
    cashierName: document.getElementById("cashierName").value || "Kasir",
    taxRate: Number(document.getElementById("taxRate").value) || 0,
    currency: document.getElementById("currency").value || "Rp"
  };

  saveData();
  applySettings();
  renderMenu();
  renderCart();
  renderOrders();
  renderHistory();

  showModal("Settings Tersimpan", "Pengaturan toko berhasil diperbarui.", "⚙️");
}

function applySettings() {
  document.getElementById("storeName").value = settings.storeName;
  document.getElementById("cashierName").value = settings.cashierName;
  document.getElementById("taxRate").value = settings.taxRate;
  document.getElementById("currency").value = settings.currency;
  document.getElementById("storeLabel").textContent = settings.storeName;
}

function updateStats() {
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("cartCount").textContent = cartCount;
  document.getElementById("orderCount").textContent = orders.length;
  renderHistory();
}

document.getElementById("searchInput").addEventListener("input", (event) => {
  searchQuery = event.target.value;
  renderMenu();
});

paymentInput.addEventListener("input", updateSummary);

applySettings();
renderCategories();
renderMenu();
renderCart();
renderOrders();
renderHistory();
