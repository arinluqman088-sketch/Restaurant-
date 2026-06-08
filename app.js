// Restaurant POS - working copy-paste version v28
// Default login: admin / 1234

const STORE_KEY = "restaurant_pos_v28";

const DEFAULTS = {
  user: {
    username: "admin",
    password: "1234",
    captainPassword: "1111",
    kitchenPassword: "2222",
    restaurantName: "سیستەمی ڕێستۆرانت",
    phone: "0770 000 0000",
    servicePercent: 0,
    taxPercent: 0,
    receiptNote: "سوپاس بۆ سەردانتان"
  },
  tables: [
    { id: "T1", name: "مێزی 1", status: "empty", sort: 1 },
    { id: "T2", name: "مێزی 2", status: "empty", sort: 2 },
    { id: "T3", name: "مێزی 3", status: "empty", sort: 3 },
    { id: "T4", name: "مێزی 4", status: "empty", sort: 4 },
    { id: "T5", name: "مێزی 5", status: "empty", sort: 5 },
    { id: "T6", name: "مێزی 6", status: "empty", sort: 6 },
    { id: "TA", name: "سەفەری", status: "empty", sort: 7 },
    { id: "DL", name: "گەیاندن", status: "empty", sort: 8 }
  ],
  menu: [
    { id: "F001", code: "F001", name: "بەرگەر", category: "خواردن", price: 5000, cost: 3000, stock: 50, minStock: 5, sort: 1 },
    { id: "F002", code: "F002", name: "پیتزا", category: "خواردن", price: 7000, cost: 4200, stock: 40, minStock: 5, sort: 2 },
    { id: "F003", code: "F003", name: "مریشک", category: "خواردن", price: 8000, cost: 5000, stock: 35, minStock: 5, sort: 3 },
    { id: "D001", code: "D001", name: "ئاو", category: "خواردنەوە", price: 500, cost: 250, stock: 100, minStock: 15, sort: 4 },
    { id: "D002", code: "D002", name: "پێپسی", category: "خواردنەوە", price: 1000, cost: 650, stock: 80, minStock: 10, sort: 5 },
    { id: "S001", code: "S001", name: "شیرینی", category: "شیرینی", price: 3500, cost: 1800, stock: 25, minStock: 5, sort: 6 }
  ]
};

let data = {
  user: { ...DEFAULTS.user },
  tables: [],
  menu: [],
  orders: {},
  sales: [],
  expenses: [],
  customers: []
};

let state = {
  page: "dashboard",
  logged: false,
  role: "",
  selectedTable: null,
  selectedCategory: "",
  menuSearch: "",
  editingItem: null
};

function byId(id) { return document.getElementById(id); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function makeId(prefix = "id") { return prefix + "_" + Date.now() + "_" + Math.random().toString(16).slice(2); }
function today() { return new Date().toISOString().slice(0, 10); }
function month() { return new Date().toISOString().slice(0, 7); }
function nowISO() { return new Date().toISOString(); }
function money(n) { return Number(n || 0).toLocaleString() + " IQD"; }
function esc(v) { return String(v ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])); }
function statusText(s) { return ({ empty: "بەتاڵ", busy: "سەرقاڵ", reserved: "گیراوە", open: "کراوە", kitchen: "چێشتخانە", ready: "ئامادەیە" })[s] || s || "بەتاڵ"; }
function canManage() { return state.role === "admin" || state.role === "cashier"; }
function canAdmin() { return state.role === "admin"; }

function baseData() {
  return {
    user: { ...DEFAULTS.user },
    tables: clone(DEFAULTS.tables),
    menu: clone(DEFAULTS.menu),
    orders: {},
    sales: [],
    expenses: [],
    customers: []
  };
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (!saved) data = baseData();
    else {
      data.user = { ...DEFAULTS.user, ...(saved.user || {}) };
      data.tables = Array.isArray(saved.tables) && saved.tables.length ? saved.tables : clone(DEFAULTS.tables);
      data.menu = Array.isArray(saved.menu) && saved.menu.length ? saved.menu : clone(DEFAULTS.menu);
      data.orders = saved.orders && typeof saved.orders === "object" ? saved.orders : {};
      data.sales = Array.isArray(saved.sales) ? saved.sales : [];
      data.expenses = Array.isArray(saved.expenses) ? saved.expenses : [];
      data.customers = Array.isArray(saved.customers) ? saved.customers : [];
    }
  } catch (e) {
    data = baseData();
  }
}

function saveData() { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function saveAndRender() { saveData(); render(); }

function getTable(id) { return data.tables.find(t => t.id === id); }
function getItem(id) { return data.menu.find(i => i.id === id); }

function blankOrder(tableId) {
  return {
    tableId,
    items: [],
    discount: 0,
    type: "dinein",
    status: "open",
    note: "",
    customerName: "",
    customerPhone: "",
    created: nowISO(),
    updated: nowISO()
  };
}

function getOrder(tableId) { return data.orders[tableId] || blankOrder(tableId); }
function itemsTotal(o) { return (o.items || []).reduce((s, i) => s + Number(i.qty || 0) * Number(i.price || 0), 0); }
function serviceAmount(o) { return Math.round(itemsTotal(o) * Number(data.user.servicePercent || 0) / 100); }
function taxAmount(o) { return Math.round((itemsTotal(o) + serviceAmount(o) - Number(o.discount || 0)) * Number(data.user.taxPercent || 0) / 100); }
function orderTotal(o) { return Math.max(0, itemsTotal(o) + serviceAmount(o) + taxAmount(o) - Number(o.discount || 0)); }

function saleProfit(s) {
  return (s.items || []).reduce((a, i) => a + (Number(i.price || 0) - Number(i.cost || 0)) * Number(i.qty || 0), 0)
    + Number(s.service || 0)
    + Number(s.tax || 0)
    - Number(s.discount || 0);
}

function renderLoading() {
  byId("app").innerHTML = `<div class="loading">Loading Restaurant POS Cloud...</div>`;
}

function render() {
  const app = byId("app");
  if (!app) return;

  if (!state.logged) {
    app.innerHTML = `
      <div class="login card">
        <div class="logo">POS</div>
        <h2>چوونەژوورەوە</h2>
        <p class="muted">سیستەمی ڕێستۆرانت - Working Version</p>
        <div class="slogan">کاشێر، کاپتن و چێشتخانە بە یەک سیستەم</div>

        <label>ناوی بەکارهێنەر</label>
        <input id="loginUser" value="admin">

        <label>پاسۆرد</label>
        <input id="loginPass" type="password" placeholder="1234">

        <label>ڕۆڵ</label>
        <select id="loginRole">
          <option value="admin">ئەدمین / کاشێر</option>
          <option value="cashier">Cashier</option>
          <option value="captain">کاپتن</option>
          <option value="kitchen">چێشتخانە</option>
        </select>

        <button onclick="login()" style="margin-top:12px">چوونەژوورەوە</button>
        <p class="muted small">Admin: admin / 1234 | Captain: 1111 | Kitchen: 2222</p>
      </div>`;
    return;
  }

  const navs = state.role === "captain"
    ? nav("orders", "ئۆردەری کاپتن")
    : state.role === "kitchen"
      ? nav("kitchen", "بەشی چێشتخانە")
      : nav("dashboard", "داشبۆرد") +
        nav("orders", "مێزەکان / ئۆردەر") +
        nav("kitchen", "چێشتخانە") +
        nav("menu", "مینیو / ستۆک") +
        nav("customers", "کڕیاران") +
        nav("expenses", "مەسروفات") +
        nav("reports", "ڕاپۆرت") +
        nav("settings", "ڕێکخستن");

  app.innerHTML = `
    <div class="app">
      <div class="topbar">
        <div class="brand">POS ${esc(data.user.restaurantName)} <span class="badge blue">${esc(state.role)}</span></div>
        <div class="actions">
          <span class="badge">${new Date().toLocaleDateString()}</span>
          <button class="secondary" onclick="logout()">چوونەدەرەوە</button>
        </div>
      </div>

      <div class="layout">
        <div class="sidebar">${navs}</div>
        <div class="content">${pageHtml()}</div>
      </div>
    </div>
    <div id="printArea" class="hidden"></div>`;
}

function nav(p, t) {
  return `<button class="navbtn ${state.page === p ? "active" : ""}" onclick="go('${p}')">${t}</button>`;
}

function pageHtml() {
  if (state.page === "dashboard") return dashboardHtml();
  if (state.page === "orders") return ordersHtml();
  if (state.page === "kitchen") return kitchenHtml();
  if (state.page === "menu") return menuHtml();
  if (state.page === "customers") return customersHtml();
  if (state.page === "expenses") return expensesHtml();
  if (state.page === "reports") return reportsHtml();
  return settingsHtml();
}

function dashboardHtml() {
  const todaySales = data.sales.filter(s => String(s.date || "").slice(0, 10) === today());
  const monthSales = data.sales.filter(s => String(s.date || "").slice(0, 7) === month());

  const expToday = data.expenses
    .filter(e => String(e.date || "").slice(0, 10) === today())
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const total = todaySales.reduce((s, x) => s + Number(x.total || 0), 0);
  const profit = todaySales.reduce((s, x) => s + saleProfit(x), 0) - expToday;
  const openOrders = Object.values(data.orders).filter(o => (o.items || []).length).length;

  const lowRows = data.menu
    .filter(i => Number(i.stock || 0) <= Number(i.minStock || 0))
    .map(i => `<tr><td>${esc(i.name)}</td><td>${i.stock}</td><td>${i.minStock}</td></tr>`)
    .join("") || `<tr><td colspan="3" class="muted">هیچ ئایتمێک ستۆکی کەم نییە</td></tr>`;

  const recentRows = data.sales.slice(0, 8)
    .map(s => `<tr><td>${new Date(s.date).toLocaleString()}</td><td>${esc(s.type)}</td><td>${money(s.total)}</td></tr>`)
    .join("") || `<tr><td colspan="3" class="muted">هێشتا فرۆشتن نییە</td></tr>`;

  return `
    <div class="grid four">
      <div class="card glass"><div class="muted">فرۆشتنی ئەمڕۆ</div><div class="kpi">${money(total)}</div></div>
      <div class="card glass"><div class="muted">قازانجی پاک</div><div class="kpi">${money(profit)}</div></div>
      <div class="card glass"><div class="muted">ئۆردەری کراوە</div><div class="kpi">${openOrders}</div></div>
      <div class="card glass"><div class="muted">فرۆشتنی مانگ</div><div class="kpi">${money(monthSales.reduce((s, x) => s + Number(x.total || 0), 0))}</div></div>
    </div>

    <div class="grid two" style="margin-top:14px">
      <div class="card">
        <h2>ستۆکی کەم</h2>
        <div class="tablewrap">
          <table>
            <thead><tr><th>ئایتم</th><th>ستۆک</th><th>ئاگاداری</th></tr></thead>
            <tbody>${lowRows}</tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h2>دوایین وەسلەکان</h2>
        <div class="tablewrap">
          <table>
            <thead><tr><th>کات</th><th>جۆر</th><th>کۆی گشتی</th></tr></thead>
            <tbody>${recentRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function ordersHtml() {
  const tableCards = data.tables.map(t => {
    const o = getOrder(t.id);
    const has = (o.items || []).length > 0;
    const cls = has ? (o.status === "ready" ? "ready" : "busy") : (t.status === "reserved" ? "reserved" : "");

    return `
      <div class="tablecard ${cls} ${state.selectedTable === t.id ? "active" : ""}" onclick="selectTable('${t.id}')">
        <h3>${esc(t.name)}</h3>
        <span class="badge ${has ? "green" : ""}">${has ? statusText(o.status) : statusText(t.status)}</span>
        <div class="muted">ئایتمەکان: ${(o.items || []).length}</div>
        <strong>${money(orderTotal(o))}</strong>
        ${canManage() ? `<button class="secondary" onclick="event.stopPropagation();toggleReserve('${t.id}')">گیراوە / بەتاڵ</button>` : ""}
      </div>`;
  }).join("");

  return `
    <div class="grid two">
      <div class="card">
        <h2>مێزەکان / ئۆردەر</h2>
        <div class="tablegrid">${tableCards}</div>
      </div>

      <div class="card">
        <h2>وردەکاری ئۆردەر</h2>
        ${orderBoxHtml()}
      </div>
    </div>`;
}

function orderBoxHtml() {
  if (!state.selectedTable) return `<p class="muted">سەرەتا مێزێک هەڵبژێرە.</p>`;

  const t = getTable(state.selectedTable);
  if (!t) return `<p class="muted">مێز نەدۆزرایەوە.</p>`;

  const o = getOrder(t.id);
  const cats = [...new Set(data.menu.map(i => i.category || "Other"))];
  const q = state.menuSearch.toLowerCase();

  const items = data.menu.filter(i =>
    (!state.selectedCategory || i.category === state.selectedCategory) &&
    ((i.name || "").toLowerCase().includes(q) || (i.code || "").toLowerCase().includes(q))
  );

  const menuButtons = items.map(i => `
    <button class="itembtn" onclick="addItem('${t.id}','${i.id}')">
      <b>${esc(i.name)}</b>
      <span>${esc(i.category)}</span>
      <strong>${money(i.price)}</strong>
    </button>
  `).join("") || `<p class="muted">ئایتم نەدۆزرایەوە</p>`;

  const orderRows = (o.items || []).map((i, idx) => `
    <tr>
      <td>${esc(i.name)}</td>
      <td><input style="width:75px" type="number" min="1" value="${i.qty}" onchange="setItemQty('${t.id}',${idx},this.value)"></td>
      <td>${money(Number(i.qty) * Number(i.price))}</td>
      <td><button class="red" onclick="removeItem('${t.id}',${idx})">X</button></td>
    </tr>
  `).join("") || `<tr><td colspan="4" class="muted">هیچ ئایتمێک نییە</td></tr>`;

  return `
    <h3>${esc(t.name)}</h3>
    <div class="kpi">${money(orderTotal(o))}</div>
    <p class="muted">
      کۆی لاوەکی: ${money(itemsTotal(o))} |
      خزمەتگوزاری: ${money(serviceAmount(o))} |
      باج: ${money(taxAmount(o))} |
      داشکاندن: ${money(o.discount)}
    </p>

    <div class="row">
      <div>
        <label>جۆری ئۆردەر</label>
        <select onchange="setOrderField('${t.id}','type',this.value)">
          <option value="dinein" ${o.type === "dinein" ? "selected" : ""}>لەناو هۆڵ</option>
          <option value="takeaway" ${o.type === "takeaway" ? "selected" : ""}>سەفەری</option>
          <option value="delivery" ${o.type === "delivery" ? "selected" : ""}>گەیاندن</option>
        </select>
      </div>

      <div>
        <label>دۆخ</label>
        <select onchange="setOrderField('${t.id}','status',this.value)">
          <option value="open" ${o.status === "open" ? "selected" : ""}>کراوە</option>
          <option value="kitchen" ${o.status === "kitchen" ? "selected" : ""}>چێشتخانە</option>
          <option value="ready" ${o.status === "ready" ? "selected" : ""}>ئامادەیە</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div><label>کڕیار</label><input value="${esc(o.customerName)}" oninput="setOrderField('${t.id}','customerName',this.value)"></div>
      <div><label>مۆبایل</label><input value="${esc(o.customerPhone)}" oninput="setOrderField('${t.id}','customerPhone',this.value)"></div>
    </div>

    ${canManage() ? `
      <div class="paybox">
        <label>داشکاندن</label>
        <input type="number" min="0" value="${Number(o.discount || 0)}" oninput="setOrderField('${t.id}','discount',this.value)">
      </div>
    ` : ""}

    <label>تێبینی</label>
    <textarea class="order-note" oninput="setOrderField('${t.id}','note',this.value)">${esc(o.note)}</textarea>

    <div class="categorybar">
      <button class="secondary" onclick="setSelectedCategory('')">هەموو</button>
      ${cats.map(c => `<button class="secondary" onclick="setSelectedCategory('${encodeURIComponent(c)}')">${esc(c)}</button>`).join("")}
    </div>

    <input placeholder="گەڕان بە ناو یان کۆد..." value="${esc(state.menuSearch)}" oninput="setMenuSearch(this.value)">
    <div class="menugrid">${menuButtons}</div>

    <h3>ئایتمەکان</h3>
    <div class="tablewrap">
      <table>
        <thead><tr><th>ئایتم</th><th>دانە</th><th>کۆی گشتی</th><th></th></tr></thead>
        <tbody>${orderRows}</tbody>
      </table>
    </div>

    <div class="actions" style="margin-top:12px">
      <button class="purple" onclick="setOrderField('${t.id}','status','kitchen')">بنێرە چێشتخانە</button>
      ${canManage() ? `<button class="red" onclick="checkout('${t.id}')">فرۆشتن و چاپ</button><button class="secondary" onclick="clearOrder('${t.id}')">پاککردنەوە</button>` : ""}
    </div>`;
}

function kitchenHtml() {
  const rows = Object.values(data.orders)
    .filter(o => (o.items || []).length && ["kitchen", "ready"].includes(o.status))
    .map(o => `
      <tr>
        <td>${esc(getTable(o.tableId)?.name || o.tableId)}</td>
        <td>${statusText(o.status)}</td>
        <td>${(o.items || []).map(i => `${esc(i.name)} × ${i.qty}`).join("<br>")}</td>
        <td>${esc(o.note || "")}</td>
        <td><button class="green" onclick="setOrderField('${o.tableId}','status','ready')">ئامادەیە</button></td>
      </tr>
    `).join("") || `<tr><td colspan="5" class="muted">هیچ ئۆردەرێک لە چێشتخانە نییە</td></tr>`;

  return `
    <div class="card">
      <h2>شاشەی چێشتخانە</h2>
      <div class="tablewrap">
        <table>
          <thead><tr><th>مێز</th><th>دۆخ</th><th>ئایتمەکان</th><th>تێبینی</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function menuHtml() {
  if (!canManage()) return `<div class="card"><h2>ڕێگەت پێنەدراوە</h2></div>`;

  const p = state.editingItem ? getItem(state.editingItem) : null;

  const rows = data.menu.map(i => `
    <tr>
      <td>${esc(i.code)}</td>
      <td>${esc(i.name)}</td>
      <td>${esc(i.category)}</td>
      <td>${money(i.price)}</td>
      <td><span class="badge ${Number(i.stock) <= Number(i.minStock) ? "red" : ""}">${i.stock}</span></td>
      <td>
        <button class="blue" onclick="editMenuItem('${i.id}')">دەستکاری</button>
        <button class="red" onclick="deleteMenuItem('${i.id}')">سڕینەوە</button>
      </td>
    </tr>
  `).join("");

  return `
    <div class="grid two">
      <div class="card">
        <h2>${p ? "دەستکاری ئایتم" : "زیادکردنی ئایتم"}</h2>

        <label>کۆد</label>
        <input id="menuCode" value="${esc(p?.code || "")}">

        <label>ناو</label>
        <input id="menuName" value="${esc(p?.name || "")}">

        <label>جۆر</label>
        <input id="menuCategory" value="${esc(p?.category || "")}" placeholder="خواردن / خواردنەوە">

        <div class="row">
          <div><label>نرخی فرۆشتن</label><input id="menuPrice" type="number" value="${Number(p?.price || 0)}"></div>
          <div><label>نرخی کڕین</label><input id="menuCost" type="number" value="${Number(p?.cost || 0)}"></div>
        </div>

        <div class="row">
          <div><label>ستۆک</label><input id="menuStock" type="number" value="${Number(p?.stock || 20)}"></div>
          <div><label>ئاگاداری ستۆکی کەم</label><input id="menuMinStock" type="number" value="${Number(p?.minStock || 5)}"></div>
        </div>

        <div class="actions" style="margin-top:12px">
          <button class="green" onclick="saveMenuItem()">هەڵگرتن</button>
          <button class="secondary" onclick="newMenuItem()">نوێ</button>
        </div>
      </div>

      <div class="card">
        <h2>مینیو / ستۆک</h2>
        <div class="tablewrap">
          <table>
            <thead><tr><th>کۆد</th><th>ناو</th><th>جۆر</th><th>نرخ</th><th>ستۆک</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function customersHtml() {
  const rows = data.customers.map(c => `
    <tr>
      <td>${esc(c.name)}</td>
      <td>${esc(c.phone)}</td>
      <td>${c.visits || 0}</td>
      <td>${money(c.total)}</td>
    </tr>
  `).join("") || `<tr><td colspan="4" class="muted">هێشتا هیچ کڕیارێک نییە</td></tr>`;

  return `
    <div class="card">
      <h2>کڕیاران</h2>
      <div class="tablewrap">
        <table>
          <thead><tr><th>ناو</th><th>مۆبایل</th><th>سەردان</th><th>کۆی گشتی</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function expensesHtml() {
  if (!canManage()) return `<div class="card"><h2>ڕێگەت پێنەدراوە</h2></div>`;

  const rows = data.expenses.map(e => `
    <tr>
      <td>${new Date(e.date).toLocaleString()}</td>
      <td>${esc(e.title)}</td>
      <td>${money(e.amount)}</td>
      <td><button class="red" onclick="deleteExpense('${e.id}')">سڕینەوە</button></td>
    </tr>
  `).join("") || `<tr><td colspan="4" class="muted">مەسروف نییە</td></tr>`;

  return `
    <div class="grid two">
      <div class="card">
        <h2>زیادکردنی مەسروف</h2>
        <label>ناونیشان</label>
        <input id="expenseTitle">
        <label>بڕ</label>
        <input id="expenseAmount" type="number">
        <button class="green" style="margin-top:12px" onclick="addExpense()">زیادکردن</button>
      </div>

      <div class="card">
        <h2>مەسروفات</h2>
        <div class="tablewrap">
          <table>
            <thead><tr><th>کات</th><th>ناو</th><th>بڕ</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function reportsHtml() {
  const totalSales = data.sales.reduce((s, x) => s + Number(x.total || 0), 0);
  const totalExpenses = data.expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalProfit = data.sales.reduce((s, x) => s + saleProfit(x), 0) - totalExpenses;

  const rows = data.sales.map(s => `
    <tr>
      <td>${new Date(s.date).toLocaleString()}</td>
      <td>${esc(s.tableName)}</td>
      <td>${esc(s.type)}</td>
      <td>${money(s.total)}</td>
      <td>${money(saleProfit(s))}</td>
    </tr>
  `).join("") || `<tr><td colspan="5" class="muted">هیچ فرۆشتنێک نییە</td></tr>`;

  return `
    <div class="grid three">
      <div class="card glass"><div class="muted">کۆی فرۆشتن</div><div class="kpi">${money(totalSales)}</div></div>
      <div class="card glass"><div class="muted">کۆی مەسروف</div><div class="kpi">${money(totalExpenses)}</div></div>
      <div class="card glass"><div class="muted">قازانج</div><div class="kpi">${money(totalProfit)}</div></div>
    </div>

    <div class="card" style="margin-top:14px">
      <h2>هەموو وەسلەکان</h2>
      <div class="tablewrap">
        <table>
          <thead><tr><th>کات</th><th>مێز</th><th>جۆر</th><th>کۆی گشتی</th><th>قازانج</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function settingsHtml() {
  if (!canAdmin()) return `<div class="card"><h2>تەنها ئەدمین دەتوانێت</h2></div>`;

  const rows = data.tables.map(t => `
    <tr>
      <td>${esc(t.name)}</td>
      <td>${statusText(t.status)}</td>
      <td><button class="red" onclick="deleteTable('${t.id}')">سڕینەوە</button></td>
    </tr>
  `).join("");

  return `
    <div class="grid two">
      <div class="card">
        <h2>ڕێکخستن</h2>

        <label>ناوی ڕێستۆرانت</label>
        <input id="restaurantName" value="${esc(data.user.restaurantName)}">

        <label>ژمارەی مۆبایل</label>
        <input id="restaurantPhone" value="${esc(data.user.phone)}">

        <div class="row">
          <div><label>Service %</label><input id="servicePercent" type="number" value="${Number(data.user.servicePercent || 0)}"></div>
          <div><label>Tax %</label><input id="taxPercent" type="number" value="${Number(data.user.taxPercent || 0)}"></div>
        </div>

        <label>پاسۆردی نوێی ئەدمین</label>
        <input id="newAdminPass" type="password" placeholder="بەتاڵ بهێڵە ئەگەر ناگۆڕیت">

        <label>پاسۆردی کاپتن</label>
        <input id="captainPass" value="${esc(data.user.captainPassword)}">

        <label>پاسۆردی چێشتخانە</label>
        <input id="kitchenPass" value="${esc(data.user.kitchenPassword)}">

        <label>تێبینی وەسل</label>
        <textarea id="receiptNote">${esc(data.user.receiptNote)}</textarea>

        <div class="actions" style="margin-top:12px">
          <button class="green" onclick="saveSettings()">هەڵگرتن</button>
          <button class="secondary" onclick="exportBackup()">Backup</button>
        </div>
      </div>

      <div class="card">
        <h2>مێزەکان</h2>
        <label>ناوی مێزی نوێ</label>
        <input id="newTableName">
        <button class="blue" style="margin-top:12px" onclick="addTable()">زیادکردنی مێز</button>

        <div class="tablewrap" style="margin-top:12px">
          <table>
            <thead><tr><th>مێز</th><th>دۆخ</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function login() {
  const u = byId("loginUser").value.trim();
  const p = byId("loginPass").value;
  const role = byId("loginRole").value;

  if (role === "captain" && p === String(data.user.captainPassword || "1111")) {
    state.logged = true;
    state.role = "captain";
    state.page = "orders";
    render();
    return;
  }

  if (role === "kitchen" && p === String(data.user.kitchenPassword || "2222")) {
    state.logged = true;
    state.role = "kitchen";
    state.page = "kitchen";
    render();
    return;
  }

  if ((role === "admin" || role === "cashier") && u === data.user.username && p === data.user.password) {
    state.logged = true;
    state.role = role;
    state.page = "dashboard";
    render();
    return;
  }

  alert("ناوی بەکارهێنەر یان پاسۆرد هەڵەیە");
}

function logout() {
  state.logged = false;
  state.role = "";
  state.selectedTable = null;
  render();
}

function go(page) {
  state.page = page;
  state.selectedCategory = "";
  state.menuSearch = "";
  render();
}

function selectTable(id) {
  state.selectedTable = id;
  render();
}

function setSelectedCategory(encoded) {
  state.selectedCategory = encoded ? decodeURIComponent(encoded) : "";
  render();
}

function setMenuSearch(value) {
  state.menuSearch = value || "";
  render();
}

function toggleReserve(id) {
  const t = getTable(id);
  if (!t) return;

  if ((getOrder(id).items || []).length) {
    return alert("ئەم مێزە ئۆردەری هەیە");
  }

  t.status = t.status === "reserved" ? "empty" : "reserved";
  saveAndRender();
}

function setOrderField(tableId, field, value) {
  const o = getOrder(tableId);
  o[field] = field === "discount" ? Number(value || 0) : value;
  o.updated = nowISO();

  data.orders[tableId] = o;

  const t = getTable(tableId);
  if (t && (o.items || []).length) t.status = "busy";

  saveAndRender();
}

function addItem(tableId, itemId) {
  const p = getItem(itemId);
  if (!p) return;

  if (Number(p.stock || 0) <= 0) {
    return alert("ئەم ئایتمە ستۆکی نەماوە");
  }

  const o = getOrder(tableId);
  const existing = o.items.find(x => x.id === itemId);

  if (existing) existing.qty = Number(existing.qty || 0) + 1;
  else o.items.push({ id: p.id, name: p.name, price: Number(p.price || 0), cost: Number(p.cost || 0), qty: 1 });

  data.orders[tableId] = o;

  const t = getTable(tableId);
  if (t) t.status = "busy";

  saveAndRender();
}

function setItemQty(tableId, index, value) {
  const o = getOrder(tableId);
  if (!o.items[index]) return;

  o.items[index].qty = Math.max(1, Number(value || 1));
  data.orders[tableId] = o;

  saveAndRender();
}

function removeItem(tableId, index) {
  const o = getOrder(tableId);
  o.items.splice(index, 1);
  data.orders[tableId] = o;

  saveAndRender();
}

function clearOrder(tableId) {
  if (!confirm("دەتەوێت ئەم ئۆردەرە پاک بکەیتەوە؟")) return;

  delete data.orders[tableId];

  const t = getTable(tableId);
  if (t) t.status = "empty";

  saveAndRender();
}

function checkout(tableId) {
  if (!canManage()) return alert("تەنها کاشێر دەتوانێت فرۆشتن تەواو بکات");

  const o = getOrder(tableId);
  if (!(o.items || []).length) return alert("ئۆردەرەکە بەتاڵە");

  const total = orderTotal(o);
  const paidText = prompt(`کۆی گشتی ${money(total)}\nپارەی وەرگیراو بنووسە:`, String(total));

  if (paidText === null) return;

  const paid = Number(paidText || 0);
  if (paid < total) return alert("پارەکە کەمە");

  const sale = {
    id: makeId("sale"),
    tableId,
    tableName: getTable(tableId)?.name || tableId,
    items: clone(o.items),
    type: o.type,
    customerName: o.customerName || "",
    customerPhone: o.customerPhone || "",
    note: o.note || "",
    subtotal: itemsTotal(o),
    service: serviceAmount(o),
    tax: taxAmount(o),
    discount: Number(o.discount || 0),
    total,
    paid,
    change: paid - total,
    date: nowISO()
  };

  sale.items.forEach(line => {
    const m = getItem(line.id);
    if (m) m.stock = Math.max(0, Number(m.stock || 0) - Number(line.qty || 0));
  });

  data.sales.unshift(sale);
  addCustomerSale(sale.customerName, sale.customerPhone, sale.total);

  delete data.orders[tableId];

  const t = getTable(tableId);
  if (t) t.status = "empty";

  saveData();
  printReceipt(sale);
  render();
}

function addCustomerSale(name, phone, total) {
  if (!name && !phone) return;

  const key = (phone || name).toLowerCase();
  let c = data.customers.find(x => (x.phone || x.name).toLowerCase() === key);

  if (!c) {
    c = {
      id: makeId("customer"),
      name: name || "بێ ناو",
      phone: phone || "",
      visits: 0,
      total: 0,
      updated: nowISO()
    };
    data.customers.unshift(c);
  }

  c.name = name || c.name;
  c.phone = phone || c.phone;
  c.visits = Number(c.visits || 0) + 1;
  c.total = Number(c.total || 0) + Number(total || 0);
  c.updated = nowISO();
}

function printReceipt(sale) {
  const area = byId("printArea");
  if (!area) return;

  area.innerHTML = `
    <div class="receipt">
      <div class="receipt-head">
        <div class="receipt-logo">POS</div>
        <h3>${esc(data.user.restaurantName)}</h3>
        <p>${esc(data.user.phone)}</p>
        <p>${new Date(sale.date).toLocaleString()}</p>
      </div>

      <p>Table: ${esc(sale.tableName)} | Type: ${esc(sale.type)}</p>

      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>
          ${sale.items.map(i => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${money(Number(i.qty) * Number(i.price))}</td></tr>`).join("")}
        </tbody>
      </table>

      <div class="receipt-total">
        <p>Subtotal: ${money(sale.subtotal)}</p>
        <p>Service: ${money(sale.service)}</p>
        <p>Tax: ${money(sale.tax)}</p>
        <p>Discount: ${money(sale.discount)}</p>
        <h3>Total: ${money(sale.total)}</h3>
        <p>Paid: ${money(sale.paid)}</p>
        <p>Change: ${money(sale.change)}</p>
      </div>

      <div class="receipt-footer">
        <p>${esc(data.user.receiptNote)}</p>
        <p>سوپاس POS</p>
      </div>
    </div>`;

  area.classList.remove("hidden");
  document.body.classList.add("printing-receipt");

  setTimeout(() => window.print(), 300);

  const cleanPrint = () => {
    document.body.classList.remove("printing-receipt");
    area.classList.add("hidden");
    area.innerHTML = "";
    window.removeEventListener("afterprint", cleanPrint);
    render();
  };

  window.addEventListener("afterprint", cleanPrint);

  setTimeout(() => {
    if (document.body.classList.contains("printing-receipt")) cleanPrint();
  }, 60000);
}

function newMenuItem() {
  state.editingItem = null;
  render();
}

function editMenuItem(id) {
  state.editingItem = id;
  render();
}

function saveMenuItem() {
  const code = byId("menuCode").value.trim();
  const name = byId("menuName").value.trim();
  const price = Number(byId("menuPrice").value || 0);

  if (!code || !name || !price) {
    return alert("کۆد، ناو و نرخ پێویستن");
  }

  const id = state.editingItem || code.replace(/[^A-Za-z0-9_-]/g, "_") || makeId("item");
  const old = getItem(id) || {};

  const item = {
    ...old,
    id,
    code,
    name,
    category: byId("menuCategory").value.trim() || "Other",
    price,
    cost: Number(byId("menuCost").value || 0),
    stock: Number(byId("menuStock").value || 0),
    minStock: Number(byId("menuMinStock").value || 0),
    sort: old.sort || Date.now()
  };

  const idx = data.menu.findIndex(i => i.id === id);
  if (idx >= 0) data.menu[idx] = item;
  else data.menu.push(item);

  state.editingItem = null;
  saveAndRender();
}

function deleteMenuItem(id) {
  if (!confirm("ئەم ئایتمە بسڕدرێتەوە؟")) return;
  data.menu = data.menu.filter(i => i.id !== id);
  saveAndRender();
}

function addExpense() {
  const title = byId("expenseTitle").value.trim();
  const amount = Number(byId("expenseAmount").value || 0);

  if (!title || !amount) return alert("ناونیشان و بڕ پێویستن");

  data.expenses.unshift({
    id: makeId("expense"),
    title,
    amount,
    date: nowISO()
  });

  saveAndRender();
}

function deleteExpense(id) {
  if (!confirm("ئەم مەسروفە بسڕدرێتەوە؟")) return;
  data.expenses = data.expenses.filter(e => e.id !== id);
  saveAndRender();
}

function saveSettings() {
  const np = byId("newAdminPass").value;

  data.user = {
    ...data.user,
    restaurantName: byId("restaurantName").value.trim() || DEFAULTS.user.restaurantName,
    phone: byId("restaurantPhone").value.trim(),
    servicePercent: Number(byId("servicePercent").value || 0),
    taxPercent: Number(byId("taxPercent").value || 0),
    captainPassword: byId("captainPass").value.trim() || "1111",
    kitchenPassword: byId("kitchenPass").value.trim() || "2222",
    receiptNote: byId("receiptNote").value.trim() || DEFAULTS.user.receiptNote
  };

  if (np) data.user.password = np;

  saveAndRender();
  alert("ڕێکخستنەکان هەڵگیران");
}

function addTable() {
  const name = byId("newTableName").value.trim();
  if (!name) return alert("ناوی مێز بنووسە");

  data.tables.push({
    id: makeId("table"),
    name,
    status: "empty",
    sort: Date.now()
  });

  saveAndRender();
}

function deleteTable(id) {
  if ((getOrder(id).items || []).length) {
    return alert("سەرەتا ئۆردەری ئەم مێزە پاک بکەرەوە");
  }

  if (!confirm("ئەم مێزە بسڕدرێتەوە؟")) return;

  data.tables = data.tables.filter(t => t.id !== id);
  delete data.orders[id];

  saveAndRender();
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "restaurant-pos-backup.json";
  a.click();
}

Object.assign(window, {
  login,
  logout,
  go,
  selectTable,
  setSelectedCategory,
  setMenuSearch,
  toggleReserve,
  setOrderField,
  addItem,
  setItemQty,
  removeItem,
  clearOrder,
  checkout,
  newMenuItem,
  editMenuItem,
  saveMenuItem,
  deleteMenuItem,
  addExpense,
  deleteExpense,
  saveSettings,
  addTable,
  deleteTable,
  exportBackup
});

loadData();
renderLoading();
setTimeout(render, 150);