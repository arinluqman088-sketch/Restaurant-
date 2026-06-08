// Restaurant POS Cloud - Kurdish Unicode-safe version v26
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore, doc, collection, setDoc, getDoc, getDocs, deleteDoc,
  onSnapshot, query, orderBy, writeBatch, increment
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAleyu9rnAvsrjAOVgaMO94anX6kBMK9iU",
  authDomain: "restaurant-41f16.firebaseapp.com",
  projectId: "restaurant-41f16",
  storageBucket: "restaurant-41f16.firebasestorage.app",
  messagingSenderId: "95826782677",
  appId: "1:95826782677:web:f32e3e2d4388c4a1f3355c",
  measurementId: "G-DZXNZ3HM05"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

const RESTAURANT_ID = "main";
const PATH = ["restaurants", RESTAURANT_ID];

const DEFAULT = {
  user: {
    username: "admin",
    password: "1234",
    captain\u067e\u0627\u0633\u06c6\u0631\u062f: "1111",
    kitchen\u067e\u0627\u0633\u06c6\u0631\u062f: "2222",
    restaurant\u0646\u0627\u0648: "\u0633\u06cc\u0633\u062a\u06d5\u0645\u06cc \u0695\u06ce\u0633\u062a\u06c6\u0631\u0627\u0646\u062a",
    phone: "0770 000 0000",
    servicePercent: 0,
    taxPercent: 0,
    receiptNote: "\u0633\u0648\u067e\u0627\u0633 \u0628\u06c6 \u0633\u06d5\u0631\u062f\u0627\u0646\u062a\u0627\u0646"
  },
  tables: [
    { id:"T1", name:"\u0645\u06ce\u0632\u06cc 1", status:"\u0628\u06d5\u062a\u0627\u06b5", sort:1 },
    { id:"T2", name:"\u0645\u06ce\u0632\u06cc 2", status:"\u0628\u06d5\u062a\u0627\u06b5", sort:2 },
    { id:"T3", name:"\u0645\u06ce\u0632\u06cc 3", status:"\u0628\u06d5\u062a\u0627\u06b5", sort:3 },
    { id:"T4", name:"\u0645\u06ce\u0632\u06cc 4", status:"\u0628\u06d5\u062a\u0627\u06b5", sort:4 },
    { id:"T5", name:"\u0645\u06ce\u0632\u06cc 5", status:"\u0628\u06d5\u062a\u0627\u06b5", sort:5 },
    { id:"T6", name:"\u0645\u06ce\u0632\u06cc 6", status:"\u0628\u06d5\u062a\u0627\u06b5", sort:6 },
    { id:"TA", name:"\u0633\u06d5\u0641\u06d5\u0631\u06cc", status:"\u0628\u06d5\u062a\u0627\u06b5", sort:7 },
    { id:"DL", name:"\u06af\u06d5\u06cc\u0627\u0646\u062f\u0646", status:"\u0628\u06d5\u062a\u0627\u06b5", sort:8 }
  ],
  menu: [
    { id:"F001", code:"F001", name:"\u0628\u06d5\u0631\u06af\u06d5\u0631", category:"\u062e\u0648\u0627\u0631\u062f\u0646", price:5000, cost:3000, stock:50, min\u0633\u062a\u06c6\u06a9:5, sort:1 },
    { id:"F002", code:"F002", name:"\u067e\u06cc\u062a\u0632\u0627", category:"\u062e\u0648\u0627\u0631\u062f\u0646", price:7000, cost:4200, stock:40, min\u0633\u062a\u06c6\u06a9:5, sort:2 },
    { id:"F003", code:"F003", name:"\u0645\u0631\u06cc\u0634\u06a9", category:"\u062e\u0648\u0627\u0631\u062f\u0646", price:8000, cost:5000, stock:35, min\u0633\u062a\u06c6\u06a9:5, sort:3 },
    { id:"D001", code:"D001", name:"\u0626\u0627\u0648", category:"\u062e\u0648\u0627\u0631\u062f\u0646\u06d5\u0648\u06d5", price:500, cost:250, stock:100, min\u0633\u062a\u06c6\u06a9:15, sort:4 },
    { id:"D002", code:"D002", name:"\u067e\u06ce\u067e\u0633\u06cc", category:"\u062e\u0648\u0627\u0631\u062f\u0646\u06d5\u0648\u06d5", price:1000, cost:650, stock:80, min\u0633\u062a\u06c6\u06a9:10, sort:5 },
    { id:"S001", code:"S001", name:"\u0634\u06cc\u0631\u06cc\u0646\u06cc", category:"\u0634\u06cc\u0631\u06cc\u0646\u06cc", price:3500, cost:1800, stock:25, min\u0633\u062a\u06c6\u06a9:5, sort:6 }
  ]
};

let data = {
  user: DEFAULT.user,
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
  selected\u0645\u06ce\u0632: null,
  editing\u0626\u0627\u06cc\u062a\u0645: null,
  selectedCat: "",
  ready: false,
  error: ""
};

let unsubscribers = [];

function settingsRef(){ return doc(db, ...PATH, "settings", "main"); }
function colRef(name){ return collection(db, ...PATH, name); }
function docRef(name,id){ return doc(db, ...PATH, name, id); }
function clean(obj){ return JSON.parse(JSON.stringify(obj)); }
function byId(id){ return document.getElementById(id); }
function money(n){ return Number(n || 0).toLocaleString() + " IQD"; }
function today(){ return new Date().toISOString().slice(0,10); }
function month(){ return new Date().toISOString().slice(0,7); }
function nowISO(){ return new Date().toISOString(); }

function tableById(id){ return data.tables.find(t => t.id === id); }

function newOrder(tableId){
  return {
    tableId,
    items: [],
    discount: 0,
    type: "dinein",
    status: "open",
    note: "",
    customer\u0646\u0627\u0648: "",
    customer\u0645\u06c6\u0628\u0627\u06cc\u0644: "",
    created: nowISO(),
    updated: nowISO()
  };
}

function order(id){ return data.orders[id] || newOrder(id); }
function items\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o){ return (o.items || []).reduce((s,i) => s + Number(i.qty || 0) * Number(i.price || 0), 0); }
function service\u0628\u0695(o){ return Math.round(items\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o) * Number(data.user.servicePercent || 0) / 100); }
function tax\u0628\u0695(o){ return Math.round((items\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o) + service\u0628\u0695(o) - Number(o.discount || 0)) * Number(data.user.taxPercent || 0) / 100); }
function order\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o){ return Math.max(0, items\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o) + service\u0628\u0695(o) + tax\u0628\u0695(o) - Number(o.discount || 0)); }

function profitOfSale(s){
  return (s.items || []).reduce((a,i) => a + (Number(i.price || 0) - Number(i.cost || 0)) * Number(i.qty || 0), 0)
    + Number(s.service || 0)
    + Number(s.tax || 0)
    - Number(s.discount || 0);
}

function canManage(){ return state.role === "admin" || state.role === "cashier"; }
function can\u0695\u06ce\u06a9\u062e\u0633\u062a\u0646(){ return state.role === "admin"; }

async function ensureInitialData(){
  const s = await getDoc(settingsRef());

  if(!s.exists()){
    await setDoc(settingsRef(), clean(DEFAULT.user));
  }

  const tablesSnap = await getDocs(colRef("tables"));
  if(tablesSnap.empty){
    const b = writeBatch(db);
    DEFAULT.tables.forEach(t => b.set(docRef("tables", t.id), clean(t)));
    await b.commit();
  }

  const menuSnap = await getDocs(colRef("menu"));
  if(menuSnap.empty){
    const b = writeBatch(db);
    DEFAULT.menu.forEach(i => b.set(docRef("menu", i.id), clean(i)));
    await b.commit();
  }
}

function startListeners(){
  unsubscribers.forEach(u => u());
  unsubscribers = [];

  unsubscribers.push(onSnapshot(settingsRef(), snap => {
    data.user = Object.assign({}, DEFAULT.user, snap.data() || {});
    state.ready = true;
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("tables"), orderBy("sort","asc")), snap => {
    data.tables = snap.docs.map(d => Object.assign({ id:d.id }, d.data()));
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("menu"), orderBy("sort","asc")), snap => {
    data.menu = snap.docs.map(d => Object.assign({ id:d.id }, d.data()));
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(colRef("orders"), snap => {
    const obj = {};
    snap.docs.forEach(d => { obj[d.id] = Object.assign({ tableId:d.id }, d.data()); });
    data.orders = obj;
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("sales"), orderBy("date","desc")), snap => {
    data.sales = snap.docs.map(d => Object.assign({ id:d.id }, d.data()));
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("expenses"), orderBy("date","desc")), snap => {
    data.expenses = snap.docs.map(d => Object.assign({ id:d.id }, d.data()));
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("customers"), orderBy("updated","desc")), snap => {
    data.customers = snap.docs.map(d => Object.assign({ id:d.id }, d.data()));
    render();
  }, handleError));
}

function handleError(err){
  console.error(err);
  state.error = "Firebase error: " + (err.message || err);
  render();
}

async function init(){
  renderLoading();

  try{
    await ensureInitialData();
    startListeners();
    state.ready = true;
    render();
  }catch(e){
    handleError(e);
  }
}

function renderLoading(){
  byId("app").innerHTML = `<div class="loading">Loading \u0633\u06cc\u0633\u062a\u06d5\u0645\u06cc \u0695\u06ce\u0633\u062a\u06c6\u0631\u0627\u0646\u062a...</div>`;
}

function render(){
  const app = byId("app");

  if(state.error){
    app.innerHTML = `
    <div class="app">
      <div class="card" style="margin:40px auto;max-width:760px">
        <h2>\u06a9\u06ce\u0634\u06d5\u06cc Firebase</h2>
        <div class="errorbox">${state.error}</div>
        <p class="muted">\u0632\u06c6\u0631\u062c\u0627\u0631 \u0626\u06d5\u0645\u06d5 \u0648\u0627\u062a\u06d5 Firestore Database \u06cc\u0627\u0646 Rules \u0626\u0627\u0645\u0627\u062f\u06d5 \u0646\u06cc\u0646.</p>
      </div>
    </div>`;
    return;
  }

  if(!state.ready){
    renderLoading();
    return;
  }

  if(!state.logged){
    app.innerHTML = `
    <div class="login card">
      <div class="logo">POS</div>
      <h2>\u0686\u0648\u0648\u0646\u06d5\u0698\u0648\u0648\u0631\u06d5\u0648\u06d5</h2>
      <p class="muted">\u0633\u06cc\u0633\u062a\u06d5\u0645\u06cc \u0695\u06ce\u0633\u062a\u06c6\u0631\u0627\u0646\u062a - Cloud Sync</p>
      <div class="slogan">\u06a9\u0627\u067e\u062a\u0646\u060c \u06a9\u0627\u0634\u06ce\u0631 \u0648 \u0686\u06ce\u0634\u062a\u062e\u0627\u0646\u06d5 \u0647\u06d5\u0645\u0627\u0646 \u0626\u06c6\u0631\u062f\u06d5\u0631 \u0628\u06d5 \u0695\u0627\u0633\u062a\u06d5\u0648\u062e\u06c6 \u062f\u06d5\u0628\u06cc\u0646\u0646</div>

      <label>\u0646\u0627\u0648\u06cc \u0628\u06d5\u06a9\u0627\u0631\u0647\u06ce\u0646\u06d5\u0631</label>
      <input id="loginUser" value="admin">

      <label>\u067e\u0627\u0633\u06c6\u0631\u062f</label>
      <input id="loginPass" type="password" value="">

      <label>\u0695\u06c6\u06b5</label>
      <select id="login\u0695\u06c6\u06b5">
        <option value="admin">\u0626\u06d5\u062f\u0645\u06cc\u0646 / \u06a9\u0627\u0634\u06ce\u0631</option>
        <option value="cashier">Cashier</option>
        <option value="captain">\u06a9\u0627\u067e\u062a\u0646</option>
        <option value="kitchen">\u0634\u0627\u0634\u06d5\u06cc \u0686\u06ce\u0634\u062a\u062e\u0627\u0646\u06d5</option>
      </select>

      <button onclick="login()" style="margin-top:12px">\u0686\u0648\u0648\u0646\u06d5\u0698\u0648\u0648\u0631\u06d5\u0648\u06d5</button>
      <p class="muted small">\u067e\u0627\u0633\u06c6\u0631\u062f\u06cc \u0695\u06c6\u06b5\u06d5\u06a9\u06d5\u062a \u0628\u0646\u0648\u0648\u0633\u06d5 \u0628\u06c6 \u0628\u06d5\u0631\u062f\u06d5\u0648\u0627\u0645\u0628\u0648\u0648\u0646</p>
    </div>`;
    return;
  }

  const navs = state.role === "captain"
    ? `${nav("orders","\u0626\u06c6\u0631\u062f\u06d5\u0631\u06cc \u06a9\u0627\u067e\u062a\u0646")}`
    : state.role === "kitchen"
      ? `${nav("kitchen","\u0628\u06d5\u0634\u06cc \u0686\u06ce\u0634\u062a\u062e\u0627\u0646\u06d5")}`
      : `${nav("dashboard","\u062f\u0627\u0634\u0628\u06c6\u0631\u062f")}${nav("orders","\u0645\u06ce\u0632\u06d5\u06a9\u0627\u0646 / \u0626\u06c6\u0631\u062f\u06d5\u0631")}${nav("kitchen","\u0628\u06d5\u0634\u06cc \u0686\u06ce\u0634\u062a\u062e\u0627\u0646\u06d5")}${nav("menu","\u0645\u06cc\u0646\u06cc\u0648 / \u0633\u062a\u06c6\u06a9")}${nav("customers","\u06a9\u0695\u06cc\u0627\u0631\u0627\u0646")}${nav("expenses","\u0645\u06d5\u0633\u0631\u0648\u0641\u0627\u062a")}${nav("reports","\u0695\u0627\u067e\u06c6\u0631\u062a\u06d5\u06a9\u0627\u0646")}${nav("settings","\u0695\u06ce\u06a9\u062e\u0633\u062a\u0646")}`;

  app.innerHTML = `
  <div class="app">
    <div class="topbar">
      <div class="brand">POS ${data.user.restaurant\u0646\u0627\u0648} <span class="badge blue">${state.role}</span></div>
      <div class="actions">
        <span class="badge">${new Date().toLocaleDateString()}</span>
        <button class="secondary" onclick="logout()">\u0686\u0648\u0648\u0646\u06d5\u062f\u06d5\u0631\u06d5\u0648\u06d5</button>
      </div>
    </div>

    <div class="layout">
      <div class="sidebar">${navs}</div>
      <div class="content">${pageHtml()}</div>
    </div>
  </div>

  <div id="printArea" class="hidden"></div>`;

  afterRender();
}

function nav(p,t){
  return `<button class="navbtn ${state.page === p ? "active" : ""}" onclick="go('${p}')">${t}</button>`;
}

function go(p){
  state.page = p;
  render();
}

function login(){
  const u = byId("loginUser").value.trim();
  const p = byId("loginPass").value;
  const role = byId("login\u0695\u06c6\u06b5").value;

  if(role === "captain" && p === String(data.user.captain\u067e\u0627\u0633\u06c6\u0631\u062f || "1111")){
    state.logged = true;
    state.role = "captain";
    state.page = "orders";
    render();
    return;
  }

  if(role === "kitchen" && p === String(data.user.kitchen\u067e\u0627\u0633\u06c6\u0631\u062f || "2222")){
    state.logged = true;
    state.role = "kitchen";
    state.page = "kitchen";
    render();
    return;
  }

  if((role === "admin" || role === "cashier") && u === data.user.username && p === data.user.password){
    state.logged = true;
    state.role = role;
    state.page = "dashboard";
    render();
    return;
  }

  alert("\u0646\u0627\u0648\u06cc \u0628\u06d5\u06a9\u0627\u0631\u0647\u06ce\u0646\u06d5\u0631 \u06cc\u0627\u0646 \u067e\u0627\u0633\u06c6\u0631\u062f \u0647\u06d5\u06b5\u06d5\u06cc\u06d5");
}

function logout(){
  state.logged = false;
  state.role = "";
  state.selectedTable = null;
  render();
}

function pageHtml(){
  if(state.page === "dashboard") return dashboardHtml();
  if(state.page === "orders") return ordersHtml();
  if(state.page === "kitchen") return kitchenHtml();
  if(state.page === "menu") return menuHtml();
  if(state.page === "customers") return customersHtml();
  if(state.page === "expenses") return expensesHtml();
  if(state.page === "reports") return reportsHtml();
  return settingsHtml();
}

function afterRender(){
  if(state.page === "orders"){
    render\u0645\u06ce\u0632\u06d5\u06a9\u0627\u0646();
    renderOrderBox();
  }

  if(state.page === "menu"){
    renderMenuTable();
  }

  if(state.page === "expenses"){
    render\u0645\u06d5\u0633\u0631\u0648\u0641\u0627\u062a();
  }
}

/* DASHBOARD */

function dashboardHtml(){
  const d = data.sales.filter(s => String(s.date || "").slice(0,10) === today());
  const m = data.sales.filter(s => String(s.date || "").slice(0,7) === month());
  const expToday = data.expenses
    .filter(e => String(e.date || "").slice(0,10) === today())
    .reduce((s,e) => s + Number(e.amount || 0), 0);

  const total = d.reduce((s,x) => s + Number(x.total || 0), 0);
  const profit = d.reduce((s,x) => s + profitOfSale(x), 0) - expToday;
  const openOrders = Object.values(data.orders).filter(o => (o.items || []).length).length;

  return `
  <div class="grid four">
    <div class="card glass"><div class="muted">\u0641\u0631\u06c6\u0634\u062a\u0646\u06cc \u0626\u06d5\u0645\u0695\u06c6</div><div class="kpi">${money(total)}</div></div>
    <div class="card glass"><div class="muted">\u0642\u0627\u0632\u0627\u0646\u062c\u06cc \u067e\u0627\u06a9</div><div class="kpi">${money(profit)}</div></div>
    <div class="card glass"><div class="muted">\u0626\u06c6\u0631\u062f\u06d5\u0631\u06cc \u06a9\u0631\u0627\u0648\u06d5</div><div class="kpi">${openOrders}</div></div>
    <div class="card glass"><div class="muted">\u0641\u0631\u06c6\u0634\u062a\u0646\u06cc \u0645\u0627\u0646\u06af</div><div class="kpi">${money(m.reduce((s,x) => s + Number(x.total || 0), 0))}</div></div>
  </div>

  <div class="grid two" style="margin-top:14px">
    <div class="card"><h2>\u0633\u062a\u06c6\u06a9\u06cc \u06a9\u06d5\u0645</h2>${low\u0633\u062a\u06c6\u06a9Table()}</div>
    <div class="card"><h2>\u062f\u0648\u0627\u06cc\u06cc\u0646 \u0648\u06d5\u0633\u0644\u06d5\u06a9\u0627\u0646</h2>${recentSalesTable(8)}</div>
  </div>`;
}

function low\u0633\u062a\u06c6\u06a9Table(){
  const rows = data.menu
    .filter(i => Number(i.stock) <= Number(i.min\u0633\u062a\u06c6\u06a9))
    .map(i => `<tr><td>${i.name}</td><td>${i.stock}</td><td>${i.min\u0633\u062a\u06c6\u06a9}</td></tr>`)
    .join("");

  return `
  <div class="tablewrap">
    <table>
      <thead><tr><th>\u0626\u0627\u06cc\u062a\u0645</th><th>\u0633\u062a\u06c6\u06a9</th><th>\u0626\u0627\u06af\u0627\u062f\u0627\u0631\u06cc</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="muted">\u0647\u06cc\u0686 \u0626\u0627\u06cc\u062a\u0645\u06ce\u06a9 \u0633\u062a\u06c6\u06a9\u06cc \u06a9\u06d5\u0645 \u0646\u06cc\u06cc\u06d5</td></tr>'}</tbody>
    </table>
  </div>`;
}

function recentSalesTable(n){
  return `
  <div class="tablewrap">
    <table>
      <thead><tr><th>\u06a9\u0627\u062a</th><th>\u062c\u06c6\u0631</th><th>\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc</th></tr></thead>
      <tbody>
        ${
          data.sales.slice(0,n).map(s => `
            <tr>
              <td>${new Date(s.date).toLocaleString()}</td>
              <td>${s.type || ""}</td>
              <td>${money(s.total)}</td>
            </tr>
          `).join("") || '<tr><td colspan="3" class="muted">\u0647\u06ce\u0634\u062a\u0627 \u0647\u06cc\u0686 \u0641\u0631\u06c6\u0634\u062a\u0646\u06ce\u06a9 \u0646\u06cc\u06cc\u06d5</td></tr>'
        }
      </tbody>
    </table>
  </div>`;
}

/* ORDERS */

function ordersHtml(){
  return `
  <div class="grid two">
    <div class="card">
      <h2>${state.role === "captain" ? "\u0626\u06c6\u0631\u062f\u06d5\u0631\u06cc \u06a9\u0627\u067e\u062a\u0646" : "\u0645\u06ce\u0632\u06d5\u06a9\u0627\u0646 / \u0626\u06c6\u0631\u062f\u06d5\u0631"}</h2>
      <div id="tablesGrid" class="tablegrid"></div>
    </div>

    <div class="card">
      <h2>\u0648\u0631\u062f\u06d5\u06a9\u0627\u0631\u06cc \u0626\u06c6\u0631\u062f\u06d5\u0631</h2>
      <div id="orderBox"></div>
    </div>
  </div>`;
}

function render\u0645\u06ce\u0632\u06d5\u06a9\u0627\u0646(){
  const box = byId("tablesGrid");
  if(!box) return;

  box.innerHTML = data.tables.map(t => {
    const o = order(t.id);
    const has = (o.items || []).length > 0;
    const cls = has ? (o.status === "ready" ? "ready" : "busy") : (t.status === "reserved" ? "reserved" : "");

    return `
    <div class="tablecard ${cls} ${state.selectedTable === t.id ? "active" : ""}">
      <h3>${t.name}</h3>
      <span class="badge ${has ? "green" : ""}">${has ? o.status : "\u0628\u06d5\u062a\u0627\u06b5"}</span>
      <div class="muted">\u0626\u0627\u06cc\u062a\u0645\u06d5\u06a9\u0627\u0646: ${(o.items || []).length}</div>
      <div class="muted">\u062f\u0627\u0634\u06a9\u0627\u0646\u062f\u0646: ${money(o.discount || 0)}</div>
      <b>${money(order\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o))}</b>

      <div class="actions">
        <button class="blue" onclick="selectTable('${t.id}')">\u06a9\u0631\u062f\u0646\u06d5\u0648\u06d5</button>
        ${canManage() && has ? `<button class="red" onclick="checkout('${t.id}')">\u0648\u06d5\u0633\u0644</button>` : ""}
        ${canManage() && !has ? `<button class="amber" onclick="reserveTable('${t.id}')">\u0695\u06cc\u0632\u06ce\u0631\u06a4</button>` : ""}
      </div>
    </div>`;
  }).join("");
}

function selectTable(id){
  state.selectedTable = id;
  render();
}

async function reserveTable(id){
  if(!canManage()){
    return alert("\u062a\u06d5\u0646\u0647\u0627 \u06a9\u0627\u0634\u06ce\u0631 \u062f\u06d5\u062a\u0648\u0627\u0646\u06ce\u062a \u0645\u06ce\u0632 \u0695\u06cc\u0632\u06ce\u0631\u06a4 \u0628\u06a9\u0627\u062a");
  }

  const t = tableById(id);
  await setDoc(
    docRef("tables", id),
    clean(Object.assign({}, t, { status: t.status === "reserved" ? "\u0628\u06d5\u062a\u0627\u06b5" : "reserved" })),
    { merge:true }
  );
}

async function saveOrder(o){
  o.updated = nowISO();
  await setDoc(docRef("orders", o.tableId), clean(o));
}

async function updateTable\u062f\u06c6\u062e(id,status){
  const t = tableById(id) || { id };
  await setDoc(docRef("tables", id), clean(Object.assign({}, t, { status })), { merge:true });
}

function set\u062c\u06c6\u0631(id,v){
  const o = order(id);
  o.type = v;
  saveOrder(o);
}

function set\u062f\u06c6\u062e(id,v){
  const o = order(id);
  o.status = v;
  saveOrder(o);
}

function set\u062f\u0627\u0634\u06a9\u0627\u0646\u062f\u0646(id,v){
  const o = order(id);
  o.discount = Math.max(0, Number(v || 0));
  saveOrder(o);
  updateOrder\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(id);
}

function setNote(id,v){
  const o = order(id);
  o.note = v;
  saveOrder(o);
}

function set\u06a9\u0695\u06cc\u0627\u0631Info(id,field,v){
  const o = order(id);
  o[field] = v;
  saveOrder(o);
}

function updateOrder\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(id){
  const o = order(id);

  const k = byId("orderKpi");
  if(k) k.textContent = money(order\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o));

  const line = byId("orderSummary");
  if(line){
    line.textContent =
      `\u06a9\u06c6\u06cc \u0644\u0627\u0648\u06d5\u06a9\u06cc: ${money(items\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o))} | \u062e\u0632\u0645\u06d5\u062a\u06af\u0648\u0632\u0627\u0631\u06cc: ${money(service\u0628\u0695(o))} | \u0628\u0627\u062c: ${money(tax\u0628\u0695(o))} | \u062f\u0627\u0634\u06a9\u0627\u0646\u062f\u0646: ${money(o.discount || 0)}`;
  }
}

function renderOrderBox(){
  const box = byId("orderBox");
  if(!box) return;

  if(!state.selectedTable){
    box.innerHTML = `<p class="muted">\u0633\u06d5\u0631\u06d5\u062a\u0627 \u0645\u06ce\u0632\u06ce\u06a9 \u0647\u06d5\u06b5\u0628\u0698\u06ce\u0631\u06d5.</p>`;
    return;
  }

  const t = tableById(state.selectedTable);
  const o = order(t.id);

  box.innerHTML = `
  <h3>${t.name}</h3>

  <div id="orderKpi" class="kpi">${money(order\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o))}</div>

  <p id="orderSummary" class="muted">
    \u06a9\u06c6\u06cc \u0644\u0627\u0648\u06d5\u06a9\u06cc: ${money(items\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o))} |
    \u062e\u0632\u0645\u06d5\u062a\u06af\u0648\u0632\u0627\u0631\u06cc: ${money(service\u0628\u0695(o))} |
    \u0628\u0627\u062c: ${money(tax\u0628\u0695(o))} |
    \u062f\u0627\u0634\u06a9\u0627\u0646\u062f\u0646: ${money(o.discount || 0)}
  </p>

  <div class="row">
    <div>
      <label>\u062c\u06c6\u0631\u06cc \u0626\u06c6\u0631\u062f\u06d5\u0631</label>
      <select onchange="set\u062c\u06c6\u0631('${t.id}',this.value)">
        <option ${o.type === 'dinein' ? 'selected' : ''} value="dinein">\u0644\u06d5\u0646\u0627\u0648 \u0647\u06c6\u06b5</option>
        <option ${o.type === 'takeaway' ? 'selected' : ''} value="takeaway">\u0633\u06d5\u0641\u06d5\u0631\u06cc</option>
        <option ${o.type === 'delivery' ? 'selected' : ''} value="delivery">\u06af\u06d5\u06cc\u0627\u0646\u062f\u0646</option>
      </select>
    </div>

    <div>
      <label>\u062f\u06c6\u062e</label>
      <select onchange="set\u062f\u06c6\u062e('${t.id}',this.value)">
        <option ${o.status === 'open' ? 'selected' : ''} value="open">\u06a9\u0631\u062f\u0646\u06d5\u0648\u06d5</option>
        <option ${o.status === 'kitchen' ? 'selected' : ''} value="kitchen">\u0686\u06ce\u0634\u062a\u062e\u0627\u0646\u06d5</option>
        <option ${o.status === 'ready' ? 'selected' : ''} value="ready">\u0626\u0627\u0645\u0627\u062f\u06d5\u06cc\u06d5</option>
      </select>
    </div>
  </div>

  <div class="row">
    <div>
      <label>\u06a9\u0695\u06cc\u0627\u0631</label>
      <input value="${o.customer\u0646\u0627\u0648 || ''}" oninput="set\u06a9\u0695\u06cc\u0627\u0631Info('${t.id}','customer\u0646\u0627\u0648',this.value)">
    </div>

    <div>
      <label>\u0645\u06c6\u0628\u0627\u06cc\u0644</label>
      <input value="${o.customer\u0645\u06c6\u0628\u0627\u06cc\u0644 || ''}" oninput="set\u06a9\u0695\u06cc\u0627\u0631Info('${t.id}','customer\u0645\u06c6\u0628\u0627\u06cc\u0644',this.value)">
    </div>
  </div>

  ${
    canManage()
    ? `<div class="paybox">
        <label>\u062f\u0627\u0634\u06a9\u0627\u0646\u062f\u0646</label>
        <input type="number" min="0" value="${o.discount || 0}" oninput="set\u062f\u0627\u0634\u06a9\u0627\u0646\u062f\u0646('${t.id}',this.value)">
      </div>`
    : ""
  }

  <label>\u062a\u06ce\u0628\u06cc\u0646\u06cc \u0626\u06c6\u0631\u062f\u06d5\u0631</label>
  <textarea class="order-note" oninput="setNote('${t.id}',this.value)">${o.note || ''}</textarea>

  <div class="categorybar">
    <button class="secondary" onclick="state.selectedCat='';renderMenuTo\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646()">\u0647\u06d5\u0645\u0648\u0648</button>
    ${
      [...new Set(data.menu.map(i => i.category || "Other"))]
      .map(c => `<button class="secondary" onclick="state.selectedCat='${c}';renderMenuTo\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646()">${c}</button>`)
      .join("")
    }
  </div>

  <input id="menuSearch" placeholder="\u06af\u06d5\u0695\u0627\u0646 \u0628\u06d5 \u0646\u0627\u0648 \u06cc\u0627\u0646 \u06a9\u06c6\u062f..." oninput="renderMenuTo\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646()">

  <div id="menuTo\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646" class="menugrid"></div>

  <h3>\u0626\u0627\u06cc\u062a\u0645\u06d5\u06a9\u0627\u0646</h3>

  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>\u0626\u0627\u06cc\u062a\u0645</th>
          <th>\u062f\u0627\u0646\u06d5</th>
          <th>\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        ${
          (o.items || []).map((i,idx) => `
            <tr>
              <td>${i.name}</td>
              <td>
                <input
                  style="width:70px"
                  type="number"
                  min="1"
                  value="${i.qty}"
                  onchange="set\u062f\u0627\u0646\u06d5('${t.id}',${idx},this.value)"
                >
              </td>
              <td>${money(i.qty * i.price)}</td>
              <td>
                <button class="red" onclick="remove\u0626\u0627\u06cc\u062a\u0645('${t.id}',${idx})">X</button>
              </td>
            </tr>
          `).join("") || '<tr><td colspan="4" class="muted">\u0647\u06ce\u0634\u062a\u0627 \u0647\u06cc\u0686 \u0626\u0627\u06cc\u062a\u0645\u06ce\u06a9 \u0646\u06cc\u06cc\u06d5</td></tr>'
        }
      </tbody>
    </table>
  </div>

  <div class="actions" style="margin-top:12px">
    <button class="purple" onclick="set\u062f\u06c6\u062e('${t.id}','kitchen')">\u0628\u0646\u06ce\u0631\u06d5 \u0686\u06ce\u0634\u062a\u062e\u0627\u0646\u06d5</button>
    ${
      canManage()
      ? `<button class="red" onclick="checkout('${t.id}')">\u0641\u0631\u06c6\u0634\u062a\u0646 \u0648 \u0686\u0627\u067e</button>
         <button class="secondary" onclick="clearOrder('${t.id}')">\u067e\u0627\u06a9\u06a9\u0631\u062f\u0646\u06d5\u0648\u06d5</button>`
      : ""
    }
  </div>`;

  renderMenuTo\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646();
}

function renderMenuTo\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646(){
  const box = byId("menuTo\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646");
  if(!box || !state.selectedTable) return;

  const q = (byId("menuSearch")?.value || "").toLowerCase();

  const items = data.menu.filter(i =>
    (!state.selectedCat || i.category === state.selectedCat) &&
    (
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q)
    )
  );

  box.innerHTML = items.map(i => `
    <button class="itembtn" onclick="add\u0626\u0627\u06cc\u062a\u0645('${state.selectedTable}','${i.id}')">
      <b>${i.name}</b>
      <span>${i.category}</span>
      <strong>${money(i.price)}</strong>
    </button>
  `).join("");
}

async function add\u0626\u0627\u06cc\u062a\u0645(tid,itemId){
  const p = data.menu.find(x => x.id === itemId);
  if(!p) return;

  if(Number(p.stock) <= 0){
    return alert("\u0626\u06d5\u0645 \u0626\u0627\u06cc\u062a\u0645\u06d5 \u0633\u062a\u06c6\u06a9\u06cc \u0646\u06d5\u0645\u0627\u0648\u06d5");
  }

  const o = order(tid);
  const it = (o.items || []).find(x => x.id === itemId);

  if(it){
    it.qty++;
  }else{
    o.items.push({
      id:p.id,
      name:p.name,
      price:Number(p.price),
      cost:Number(p.cost || 0),
      qty:1
    });
  }

  o.status = o.status || "open";

  await saveOrder(o);
  await updateTable\u062f\u06c6\u062e(tid,"busy");
}

async function set\u062f\u0627\u0646\u06d5(tid,idx,v){
  const o = order(tid);
  o.items[idx].qty = Math.max(1, Number(v || 1));
  await saveOrder(o);
}

async function remove\u0626\u0627\u06cc\u062a\u0645(tid,idx){
  const o = order(tid);
  o.items.splice(idx,1);
  await saveOrder(o);
}

async function clearOrder(tid){
  if(!confirm("\u062f\u06d5\u062a\u06d5\u0648\u06ce\u062a \u0626\u06d5\u0645 \u0626\u06c6\u0631\u062f\u06d5\u0631\u06d5 \u067e\u0627\u06a9 \u0628\u06a9\u06d5\u06cc\u062a\u06d5\u0648\u06d5\u061f")) return;

  await deleteDoc(docRef("orders",tid));
  await updateTable\u062f\u06c6\u062e(tid,"\u0628\u06d5\u062a\u0627\u06b5");
}

async function checkout(tid){
  if(!canManage()){
    return alert("\u062a\u06d5\u0646\u0647\u0627 \u06a9\u0627\u0634\u06ce\u0631 \u062f\u06d5\u062a\u0648\u0627\u0646\u06ce\u062a \u0641\u0631\u06c6\u0634\u062a\u0646 \u062a\u06d5\u0648\u0627\u0648 \u0628\u06a9\u0627\u062a");
  }

  const t = tableById(tid);
  const o = order(tid);

  if(!o.items.length){
    return alert("\u0626\u06c6\u0631\u062f\u06d5\u0631 \u0628\u06d5\u062a\u0627\u06b5\u06d5");
  }

  const sale = {
    id: Date.now().toString(),
    date: nowISO(),
    table: t.name,
    type: o.type,
    status: "paid",
    customer\u0646\u0627\u0648: o.customer\u0646\u0627\u0648 || "",
    customer\u0645\u06c6\u0628\u0627\u06cc\u0644: o.customer\u0645\u06c6\u0628\u0627\u06cc\u0644 || "",
    note: o.note || "",
    items: clean(o.items),
    subtotal: items\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o),
    service: service\u0628\u0695(o),
    tax: tax\u0628\u0695(o),
    discount: Number(o.discount || 0),
    total: order\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o),
    paid: order\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc(o),
    change: 0
  };

  const b = writeBatch(db);

  b.set(docRef("sales", sale.id), clean(sale));

  sale.items.forEach(it => {
    const p = data.menu.find(x => x.id === it.id);
    if(p){
      b.set(
        docRef("menu", it.id),
        clean(Object.assign({}, p, { stock: Number(p.stock || 0) - it.qty })),
        { merge:true }
      );
    }
  });

  if(sale.customer\u0646\u0627\u0648 || sale.customer\u0645\u06c6\u0628\u0627\u06cc\u0644){
    const cid = (sale.customer\u0645\u06c6\u0628\u0627\u06cc\u0644 || sale.customer\u0646\u0627\u0648 || sale.id).replace(/[^a-zA-Z0-9_-]/g,"_");

    b.set(
      docRef("customers", cid),
      {
        name: sale.customer\u0646\u0627\u0648 || "\u06a9\u0695\u06cc\u0627\u0631",
        phone: sale.customer\u0645\u06c6\u0628\u0627\u06cc\u0644 || "",
        visits: increment(1),
        total: increment(sale.total),
        updated: nowISO()
      },
      { merge:true }
    );
  }

  b.delete(docRef("orders", tid));
  b.set(docRef("tables", tid), clean(Object.assign({}, t, { status:"\u0628\u06d5\u062a\u0627\u06b5" })), { merge:true });

  await b.commit();

  print\u0648\u06d5\u0633\u0644(sale);
}

/* KITCHEN */

function kitchenHtml(){
  const open = Object.values(data.orders).filter(o => o.items && o.items.length && o.status !== "paid");

  return `
  <div class="card">
    <h2>\u0634\u0627\u0634\u06d5\u06cc \u0686\u06ce\u0634\u062a\u062e\u0627\u0646\u06d5</h2>

    <div class="grid two">
      ${
        open.map(o => {
          const t = tableById(o.tableId) || { name:o.tableId };

          return `
          <div class="card">
            <h3>${t.name}</h3>
            <span class="badge ${o.status === 'ready' ? 'green' : 'purple'}">${o.status}</span>
            <p class="muted">${o.note || ""}</p>

            <div class="tablewrap">
              <table>
                <tbody>
                  ${
                    o.items.map(i => `
                      <tr>
                        <td>${i.name}</td>
                        <td>${i.qty}</td>
                      </tr>
                    `).join("")
                  }
                </tbody>
              </table>
            </div>

            <div class="actions" style="margin-top:10px">
              <button class="purple" onclick="set\u062f\u06c6\u062e('${o.tableId}','kitchen')">\u0644\u06d5 \u0626\u0627\u0645\u0627\u062f\u06d5\u06a9\u0631\u062f\u0646\u062f\u0627\u06cc\u06d5</button>
              <button class="green" onclick="set\u062f\u06c6\u062e('${o.tableId}','ready')">\u0626\u0627\u0645\u0627\u062f\u06d5\u06cc\u06d5</button>
            </div>
          </div>`;
        }).join("") || '<p class="muted">\u0647\u06ce\u0634\u062a\u0627 \u0647\u06cc\u0686 \u0626\u06c6\u0631\u062f\u06d5\u0631\u06ce\u06a9 \u0646\u06cc\u06cc\u06d5</p>'
      }
    </div>
  </div>`;
}

/* RECEIPT */

function print\u0648\u06d5\u0633\u0644(sale){
  const lines = sale.items.map(i => `
    <tr>
      <td>${i.name}</td>
      <td>${i.qty}</td>
      <td>${money(i.qty * i.price)}</td>
    </tr>
  `).join("");

  const area = byId("printArea");

  area.innerHTML = `
  <div class="receipt">
    <div class="receipt-head">
      <div class="receipt-logo">POS</div>
      <h3>${data.user.restaurant\u0646\u0627\u0648}</h3>
      <p>${data.user.phone || ""}</p>
    </div>

    <p><b>\u0645\u06ce\u0632:</b> ${sale.table}</p>
    <p><b>\u062c\u06c6\u0631:</b> ${sale.type}</p>
    <p><b>\u0648\u06d5\u0633\u0644:</b> ${sale.id}</p>
    <p><b>\u0628\u06d5\u0631\u0648\u0627\u0631:</b> ${new Date(sale.date).toLocaleString()}</p>

    <hr>

    <table>
      <thead>
        <tr>
          <th>\u0626\u0627\u06cc\u062a\u0645</th>
          <th>\u062f\u0627\u0646\u06d5</th>
          <th>\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc</th>
        </tr>
      </thead>
      <tbody>${lines}</tbody>
    </table>

    <hr>

    <div class="receipt-total">
      <p>\u06a9\u06c6\u06cc \u0644\u0627\u0648\u06d5\u06a9\u06cc: ${money(sale.subtotal)}</p>
      <p>\u062e\u0632\u0645\u06d5\u062a\u06af\u0648\u0632\u0627\u0631\u06cc: ${money(sale.service)}</p>
      <p>\u0628\u0627\u062c: ${money(sale.tax)}</p>
      <p>\u062f\u0627\u0634\u06a9\u0627\u0646\u062f\u0646: ${money(sale.discount)}</p>
      <h3>\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc: ${money(sale.total)}</h3>
      <p>\u067e\u0627\u0631\u06d5\u06cc \u0648\u06d5\u0631\u06af\u06cc\u0631\u0627\u0648: ${money(sale.paid)}</p>
      <p>\u06af\u06d5\u0695\u0627\u0648\u06d5: ${money(sale.change)}</p>
    </div>

    <div class="receipt-footer">
      <p>${data.user.receiptNote}</p>
      <p>\u0633\u0648\u067e\u0627\u0633 POS</p>
    </div>
  </div>`;

  area.classList.remove("hidden");
  document.body.classList.add("printing-receipt");

  set\u06a9\u0627\u062aout(() => window.print(), 350);

  const cleanPrint = () => {
    document.body.classList.remove("printing-receipt");
    area.classList.add("hidden");
    area.innerHTML = "";
    state.selectedTable = null;
    render();
    window.removeEventListener("afterprint", cleanPrint);
  };

  window.addEventListener("afterprint", cleanPrint);

  set\u06a9\u0627\u062aout(() => {
    if(document.body.classList.contains("printing-receipt")){
      cleanPrint();
    }
  }, 60000);
}

/* MENU */

function menuHtml(){
  if(!canManage()){
    return `<div class="card"><h2>\u0695\u06ce\u06af\u06d5\u062a \u067e\u06ce\u0646\u06d5\u062f\u0631\u0627\u0648\u06d5</h2></div>`;
  }

  return `
  <div class="grid two">
    <div class="card">
      <h2>${state.editing\u0626\u0627\u06cc\u062a\u0645 ? "\u062f\u06d5\u0633\u062a\u06a9\u0627\u0631\u06cc \u0626\u0627\u06cc\u062a\u0645" : "\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646\u06cc \u0626\u0627\u06cc\u062a\u0645"}</h2>

      <label>\u06a9\u06c6\u062f</label>
      <input id="m\u06a9\u06c6\u062f">

      <label>\u0646\u0627\u0648</label>
      <input id="m\u0646\u0627\u0648">

      <label>\u062c\u06c6\u0631</label>
      <input id="m\u062c\u06c6\u0631" placeholder="\u062e\u0648\u0627\u0631\u062f\u0646 / \u062e\u0648\u0627\u0631\u062f\u0646\u06d5\u0648\u06d5 / \u0634\u06cc\u0631\u06cc\u0646\u06cc">

      <div class="row">
        <div>
          <label>\u0646\u0631\u062e\u06cc \u0641\u0631\u06c6\u0634\u062a\u0646</label>
          <input id="m\u0646\u0631\u062e" type="number">
        </div>

        <div>
          <label>\u0646\u0631\u062e\u06cc \u06a9\u0695\u06cc\u0646</label>
          <input id="m\u0646\u0631\u062e\u06cc \u06a9\u0695\u06cc\u0646" type="number">
        </div>
      </div>

      <div class="row">
        <div>
          <label>\u0633\u062a\u06c6\u06a9</label>
          <input id="m\u0633\u062a\u06c6\u06a9" type="number" value="20">
        </div>

        <div>
          <label>\u0626\u0627\u06af\u0627\u062f\u0627\u0631\u06cc \u0633\u062a\u06c6\u06a9\u06cc \u06a9\u06d5\u0645</label>
          <input id="mMin" type="number" value="5">
        </div>
      </div>

      <div class="actions" style="margin-top:12px">
        <button class="green" onclick="saveMenu\u0626\u0627\u06cc\u062a\u0645()">\u0647\u06d5\u06b5\u06af\u0631\u062a\u0646</button>
        <button class="secondary" onclick="state.editing\u0626\u0627\u06cc\u062a\u0645=null;render()">\u0646\u0648\u06ce</button>
      </div>
    </div>

    <div class="card">
      <h2>\u0645\u06cc\u0646\u06cc\u0648 / \u0633\u062a\u06c6\u06a9</h2>
      <input id="menuListSearch" placeholder="\u06af\u06d5\u0695\u0627\u0646..." oninput="renderMenuTable()">
      <div id="menuTable" style="margin-top:12px"></div>
    </div>
  </div>`;
}

function renderMenuTable(){
  const box = byId("menuTable");
  if(!box) return;

  const q = (byId("menuListSearch")?.value || "").toLowerCase();

  const rows = data.menu
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    )
    .map(p => `
      <tr>
        <td>${p.code}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${money(p.price)}</td>
        <td><span class="badge ${p.stock <= p.min\u0633\u062a\u06c6\u06a9 ? 'red' : ''}">${p.stock}</span></td>
        <td>
          <button class="blue" onclick="editMenu\u0626\u0627\u06cc\u062a\u0645('${p.id}')">\u062f\u06d5\u0633\u062a\u06a9\u0627\u0631\u06cc</button>
          <button class="red" onclick="deleteMenu\u0626\u0627\u06cc\u062a\u0645('${p.id}')">\u0633\u0695\u06cc\u0646\u06d5\u0648\u06d5</button>
        </td>
      </tr>
    `).join("");

  box.innerHTML = `
  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>\u06a9\u06c6\u062f</th>
          <th>\u0646\u0627\u0648</th>
          <th>\u062c\u06c6\u0631</th>
          <th>\u0646\u0631\u062e</th>
          <th>\u0633\u062a\u06c6\u06a9</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

async function saveMenu\u0626\u0627\u06cc\u062a\u0645(){
  const id = state.editing\u0626\u0627\u06cc\u062a\u0645 || (byId("m\u06a9\u06c6\u062f").value.trim() || crypto.randomUUID());

  const item = {
    id,
    code: byId("m\u06a9\u06c6\u062f").value.trim(),
    name: byId("m\u0646\u0627\u0648").value.trim(),
    category: byId("m\u062c\u06c6\u0631").value.trim() || "Other",
    price: Number(byId("m\u0646\u0631\u062e").value || 0),
    cost: Number(byId("m\u0646\u0631\u062e\u06cc \u06a9\u0695\u06cc\u0646").value || 0),
    stock: Number(byId("m\u0633\u062a\u06c6\u06a9").value || 0),
    min\u0633\u062a\u06c6\u06a9: Number(byId("mMin").value || 0),
    sort: Date.now()
  };

  if(!item.code || !item.name || !item.price){
    return alert("\u06a9\u06c6\u062f\u060c \u0646\u0627\u0648 \u0648 \u0646\u0631\u062e \u067e\u06ce\u0648\u06cc\u0633\u062a\u0646");
  }

  await setDoc(docRef("menu", id), clean(item), { merge:true });

  state.editing\u0626\u0627\u06cc\u062a\u0645 = null;
  render();
}

function editMenu\u0626\u0627\u06cc\u062a\u0645(id){
  state.editing\u0626\u0627\u06cc\u062a\u0645 = id;
  render();

  const p = data.menu.find(x => x.id === id);

  byId("m\u06a9\u06c6\u062f").value = p.code;
  byId("m\u0646\u0627\u0648").value = p.name;
  byId("m\u062c\u06c6\u0631").value = p.category || "";
  byId("m\u0646\u0631\u062e").value = p.price;
  byId("m\u0646\u0631\u062e\u06cc \u06a9\u0695\u06cc\u0646").value = p.cost;
  byId("m\u0633\u062a\u06c6\u06a9").value = p.stock;
  byId("mMin").value = p.min\u0633\u062a\u06c6\u06a9 || 0;
}

async function deleteMenu\u0626\u0627\u06cc\u062a\u0645(id){
  if(!confirm("\u0626\u06d5\u0645 \u0626\u0627\u06cc\u062a\u0645\u06d5 \u0628\u0633\u0695\u062f\u0631\u06ce\u062a\u06d5\u0648\u06d5\u061f")) return;
  await deleteDoc(docRef("menu", id));
}

/* CUSTOMERS */

function customersHtml(){
  return `
  <div class="card">
    <h2>\u06a9\u0695\u06cc\u0627\u0631\u0627\u0646</h2>

    <div class="tablewrap">
      <table>
        <thead>
          <tr>
            <th>\u0646\u0627\u0648</th>
            <th>\u0645\u06c6\u0628\u0627\u06cc\u0644</th>
            <th>\u0633\u06d5\u0631\u062f\u0627\u0646</th>
            <th>\u06a9\u06c6\u06cc \u06af\u0634\u062a\u06cc</th>
          </tr>
        </thead>

        <tbody>
          ${
            data.customers.map(c => `
              <tr>
                <td>${c.name}</td>
                <td>${c.phone}</td>
                <td>${c.visits || 0}</td>
                <td>${money(c.total || 0)}</td>
              </tr>
            `).join("") || '<tr><td colspan="4" class="muted">\u0647\u06ce\u0634\u062a\u0627 \u0647\u06cc\u0686 \u06a9\u0695\u06cc\u0627\u0631\u06ce\u06a9 \u0646\u06cc\u06cc\u06d5</td></tr>'
          }
        </tbody>
      </table>
    </div>
  </div>`;
}

/* EXPENSES */

function expensesHtml(){
  if(!canManage()){
    return `<div class="card"><h2>\u0695\u06ce\u06af\u06d5\u062a \u067e\u06ce\u0646\u06d5\u062f\u0631\u0627\u0648\u06d5</h2></div>`;
  }

  return `
  <div class="grid two">
    <div class="card">
      <h2>\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646\u06cc \u0645\u06d5\u0633\u0631\u0648\u0641</h2>

      <label>\u0646\u0627\u0648\u0646\u06cc\u0634\u0627\u0646</label>
      <input id="ex\u0646\u0627\u0648\u0646\u06cc\u0634\u0627\u0646">

      <label>\u0628\u0695</label>
      <input id="ex\u0628\u0695" type="number">

      <button class="green" style="margin-top:12px" onclick="addExpense()">\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646</button>
    </div>

    <div class="card">
      <h2>\u0645\u06d5\u0633\u0631\u0648\u0641\u0627\u062a</h2>
      <div id="expensesBox"></div>
    </div>
  </div>`;
}

async function addExpense(){
  const title = byId("ex\u0646\u0627\u0648\u0646\u06cc\u0634\u0627\u0646").value.trim();
  const amount = Number(byId("ex\u0628\u0695").value || 0);

  if(!title || !amount){
    return alert("\u0646\u0627\u0648\u0646\u06cc\u0634\u0627\u0646 \u0648 \u0628\u0695 \u067e\u06ce\u0648\u06cc\u0633\u062a\u0646");
  }

  const id = crypto.randomUUID();

  await setDoc(docRef("expenses", id), {
    id,
    title,
    amount,
    date: nowISO()
  });
}

function render\u0645\u06d5\u0633\u0631\u0648\u0641\u0627\u062a(){
  const box = byId("expensesBox");
  if(!box) return;

  box.innerHTML = `
  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>\u06a9\u0627\u062a</th>
          <th>\u0646\u0627\u0648\u0646\u06cc\u0634\u0627\u0646</th>
          <th>\u0628\u0695</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        ${
          data.expenses.slice(0,100).map(e => `
            <tr>
              <td>${new Date(e.date).toLocaleString()}</td>
              <td>${e.title}</td>
              <td>${money(e.amount)}</td>
              <td><button class="red" onclick="deleteExpense('${e.id}')">X</button></td>
            </tr>
          `).join("") || '<tr><td colspan="4" class="muted">\u0647\u06ce\u0634\u062a\u0627 \u0647\u06cc\u0686 \u0645\u06d5\u0633\u0631\u0648\u0641\u06ce\u06a9 \u0646\u06cc\u06cc\u06d5</td></tr>'
        }
      </tbody>
    </table>
  </div>`;
}

async function deleteExpense(id){
  await deleteDoc(docRef("expenses", id));
}

/* REPORTS */

function reportsHtml(){
  const d = data.sales.filter(s => String(s.date || "").slice(0,10) === today());
  const m = data.sales.filter(s => String(s.date || "").slice(0,7) === month());

  const expD = data.expenses
    .filter(e => String(e.date || "").slice(0,10) === today())
    .reduce((s,e) => s + Number(e.amount || 0), 0);

  const totalD = d.reduce((s,x) => s + Number(x.total || 0), 0);
  const totalM = m.reduce((s,x) => s + Number(x.total || 0), 0);
  const profitD = d.reduce((s,x) => s + profitOfSale(x), 0) - expD;
  const discD = d.reduce((s,x) => s + Number(x.discount || 0), 0);

  return `
  <div class="grid four">
    <div class="card"><div class="muted">\u0641\u0631\u06c6\u0634\u062a\u0646\u06cc \u0626\u06d5\u0645\u0695\u06c6</div><div class="kpi">${money(totalD)}</div></div>
    <div class="card"><div class="muted">\u0642\u0627\u0632\u0627\u0646\u062c\u06cc \u067e\u0627\u06a9</div><div class="kpi">${money(profitD)}</div></div>
    <div class="card"><div class="muted">\u062f\u0627\u0634\u06a9\u0627\u0646\u062f\u0646</div><div class="kpi">${money(discD)}</div></div>
    <div class="card"><div class="muted">\u0641\u0631\u06c6\u0634\u062a\u0646\u06cc \u0645\u0627\u0646\u06af</div><div class="kpi">${money(totalM)}</div></div>
  </div>

  <div class="card" style="margin-top:14px">
    <h2>\u062f\u0648\u0627\u06cc\u06cc\u0646 \u0648\u06d5\u0633\u0644\u06d5\u06a9\u0627\u0646</h2>
    ${recentSalesTable(100)}
  </div>`;
}

/* SETTINGS */

function settingsHtml(){
  if(!can\u0695\u06ce\u06a9\u062e\u0633\u062a\u0646()){
    return `<div class="card"><h2>\u0695\u06ce\u06af\u06d5\u062a \u067e\u06ce\u0646\u06d5\u062f\u0631\u0627\u0648\u06d5</h2></div>`;
  }

  return `
  <div class="grid two">
    <div class="card">
      <h2>\u0695\u06ce\u06a9\u062e\u0633\u062a\u0646</h2>

      <label>\u0646\u0627\u0648\u06cc \u0695\u06ce\u0633\u062a\u06c6\u0631\u0627\u0646\u062a</label>
      <input id="restaurant\u0646\u0627\u0648" value="${data.user.restaurant\u0646\u0627\u0648}">

      <label>\u0645\u06c6\u0628\u0627\u06cc\u0644</label>
      <input id="phone" value="${data.user.phone}">

      <div class="row">
        <div>
          <label>\u062e\u0632\u0645\u06d5\u062a\u06af\u0648\u0632\u0627\u0631\u06cc %</label>
          <input id="servicePercent" type="number" value="${data.user.servicePercent}">
        </div>

        <div>
          <label>\u0628\u0627\u062c %</label>
          <input id="taxPercent" type="number" value="${data.user.taxPercent}">
        </div>
      </div>

      <label>\u067e\u0627\u0633\u06c6\u0631\u062f\u06cc \u06a9\u0627\u067e\u062a\u0646</label>
      <input id="captain\u067e\u0627\u0633\u06c6\u0631\u062f" type="password" value="${data.user.captain\u067e\u0627\u0633\u06c6\u0631\u062f}">

      <label>\u067e\u0627\u0633\u06c6\u0631\u062f\u06cc \u0686\u06ce\u0634\u062a\u062e\u0627\u0646\u06d5</label>
      <input id="kitchen\u067e\u0627\u0633\u06c6\u0631\u062f" type="password" value="${data.user.kitchen\u067e\u0627\u0633\u06c6\u0631\u062f}">

      <label>\u062a\u06ce\u0628\u06cc\u0646\u06cc \u0648\u06d5\u0633\u0644</label>
      <input id="receiptNote" value="${data.user.receiptNote}">

      <label>\u067e\u0627\u0633\u06c6\u0631\u062f\u06cc \u0646\u0648\u06ce\u06cc \u06a9\u0627\u0634\u06ce\u0631</label>
      <input id="newPass" type="password" placeholder="\u0628\u06d5\u062a\u0627\u06b5\u06cc \u0628\u0647\u06ce\u06b5\u06d5 \u0626\u06d5\u06af\u06d5\u0631 \u0646\u0627\u06af\u06c6\u0695\u06cc\u062a">

      <button class="green" style="margin-top:12px" onclick="save\u0695\u06ce\u06a9\u062e\u0633\u062a\u0646()">\u0647\u06d5\u06b5\u06af\u0631\u062a\u0646</button>
    </div>

    <div class="card">
      <h2>\u0628\u0627\u06a9\u06d5\u067e</h2>

      <div class="actions">
        <button class="blue" onclick="export\u0628\u0627\u06a9\u06d5\u067e()">\u0647\u06d5\u06b5\u06af\u0631\u062a\u0646\u06cc \u0628\u0627\u06a9\u06d5\u067e</button>
      </div>

      <p class="muted">\u0628\u0627\u06a9\u06d5\u067e \u0628\u06d5 \u0634\u06ce\u0648\u06d5\u06cc \u0628\u06d5\u0631\u062f\u06d5\u0648\u0627\u0645 \u0628\u06a9\u06d5.</p>
    </div>
  </div>

  <div class="card" style="margin-top:14px">
    <h2>\u0645\u06ce\u0632\u06d5\u06a9\u0627\u0646</h2>

    <div class="row">
      <input id="newTable\u0646\u0627\u0648" placeholder="\u0645\u06ce\u0632\u06cc 7">
      <button class="green" onclick="addTable()">\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646</button>
    </div>

    <div class="tablewrap" style="margin-top:12px">
      <table>
        <thead>
          <tr>
            <th>\u0646\u0627\u0648</th>
            <th>\u062f\u06c6\u062e</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          ${
            data.tables.map(t => `
              <tr>
                <td>${t.name}</td>
                <td>${t.status}</td>
                <td><button class="red" onclick="deleteTable('${t.id}')">\u0633\u0695\u06cc\u0646\u06d5\u0648\u06d5</button></td>
              </tr>
            `).join("")
          }
        </tbody>
      </table>
    </div>
  </div>`;
}

async function save\u0695\u06ce\u06a9\u062e\u0633\u062a\u0646(){
  const u = Object.assign({}, data.user, {
    restaurant\u0646\u0627\u0648: byId("restaurant\u0646\u0627\u0648").value.trim() || "\u0633\u06cc\u0633\u062a\u06d5\u0645\u06cc \u0695\u06ce\u0633\u062a\u06c6\u0631\u0627\u0646\u062a",
    phone: byId("phone").value.trim(),
    servicePercent: Number(byId("servicePercent").value || 0),
    taxPercent: Number(byId("taxPercent").value || 0),
    captain\u067e\u0627\u0633\u06c6\u0631\u062f: byId("captain\u067e\u0627\u0633\u06c6\u0631\u062f").value.trim() || data.user.captain\u067e\u0627\u0633\u06c6\u0631\u062f || "1111",
    kitchen\u067e\u0627\u0633\u06c6\u0631\u062f: byId("kitchen\u067e\u0627\u0633\u06c6\u0631\u062f").value.trim() || data.user.kitchen\u067e\u0627\u0633\u06c6\u0631\u062f || "2222",
    receiptNote: byId("receiptNote").value.trim() || "\u0633\u0648\u067e\u0627\u0633 \u0628\u06c6 \u0633\u06d5\u0631\u062f\u0627\u0646\u062a\u0627\u0646"
  });

  const np = byId("newPass").value;
  if(np){
    u.password = np;
  }

  await setDoc(settingsRef(), clean(u), { merge:true });

  alert("\u0695\u06ce\u06a9\u062e\u0633\u062a\u0646\u06d5\u06a9\u0627\u0646 \u0647\u06d5\u06b5\u06af\u06cc\u0631\u0627\u0646");
}

async function addTable(){
  const name = byId("newTable\u0646\u0627\u0648").value.trim();

  if(!name){
    return alert("\u0646\u0627\u0648\u06cc \u0645\u06ce\u0632 \u0628\u0646\u0648\u0648\u0633\u06d5");
  }

  const id = crypto.randomUUID();

  await setDoc(docRef("tables", id), {
    id,
    name,
    status:"\u0628\u06d5\u062a\u0627\u06b5",
    sort:Date.now()
  });
}

async function deleteTable(id){
  if(order(id).items.length){
    return alert("\u0633\u06d5\u0631\u06d5\u062a\u0627 \u0626\u06c6\u0631\u062f\u06d5\u0631\u06cc \u0626\u06d5\u0645 \u0645\u06ce\u0632\u06d5 \u067e\u0627\u06a9 \u0628\u06a9\u06d5\u0648\u06d5");
  }

  await deleteDoc(docRef("tables", id));
  await deleteDoc(docRef("orders", id));
}

function export\u0628\u0627\u06a9\u06d5\u067e(){
  const blob = new Blob([JSON.stringify(data,null,2)], { type:"application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "restaurant-pos-cloud-backup.json";
  a.click();
}

/* GLOBAL FUNCTIONS */

Object.assign(window, {
  login,
  logout,
  go,
  selectTable,
  reserveTable,
  set\u062c\u06c6\u0631,
  set\u062f\u06c6\u062e,
  set\u062f\u0627\u0634\u06a9\u0627\u0646\u062f\u0646,
  setNote,
  set\u06a9\u0695\u06cc\u0627\u0631Info,
  renderMenuTo\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646,
  add\u0626\u0627\u06cc\u062a\u0645,
  set\u062f\u0627\u0646\u06d5,
  remove\u0626\u0627\u06cc\u062a\u0645,
  clearOrder,
  checkout,
  saveMenu\u0626\u0627\u06cc\u062a\u0645,
  editMenu\u0626\u0627\u06cc\u062a\u0645,
  deleteMenu\u0626\u0627\u06cc\u062a\u0645,
  addExpense,
  deleteExpense,
  save\u0695\u06ce\u06a9\u062e\u0633\u062a\u0646,
  addTable,
  deleteTable,
  export\u0628\u0627\u06a9\u06d5\u067e,
  state,
  byId
});

init();
