import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore, doc, collection, setDoc, getDoc, getDocs, deleteDoc,
  onSnapshot, query, orderBy, writeBatch, increment
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  "apiKey": "AIzaSyAleyu9rnAvsrjAOVgaMO94anX6kBMK9iU",
  "authDomain": "restaurant-41f16.firebaseapp.com",
  "projectId": "restaurant-41f16",
  "storageBucket": "restaurant-41f16.firebasestorage.app",
  "messagingSenderId": "95826782677",
  "appId": "1:95826782677:web:f32e3e2d4388c4a1f3355c",
  "measurementId": "G-DZXNZ3HM05"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

const RESTAURANT_ID = "main";
const PATH = ["restaurants", RESTAURANT_ID];

const DEFAULT = {
  user: {
    username:"admin",
    password:"1234",
    captainPassword:"1111",
    kitchenPassword:"2222",
    restaurantName:"Restaurant POS Cloud",
    phone:"0770 000 0000",
    servicePercent:0,
    taxPercent:0,
    receiptNote:"â Ø®ÙØ§Ø±Ø¯ÙÛÚ©Û Ø®ÛØ´Ø Ø³Ø§ØªÛÚ©Û ØªØ§ÛØ¨ÛØª â"
  },
  tables: [
    {id:"T1", name:"ÙÛØ²Û 1", status:"free", sort:1},
    {id:"T2", name:"ÙÛØ²Û 2", status:"free", sort:2},
    {id:"T3", name:"ÙÛØ²Û 3", status:"free", sort:3},
    {id:"T4", name:"ÙÛØ²Û 4", status:"free", sort:4},
    {id:"T5", name:"ÙÛØ²Û 5", status:"free", sort:5},
    {id:"T6", name:"ÙÛØ²Û 6", status:"free", sort:6},
    {id:"TA", name:"Takeaway", status:"free", sort:7},
    {id:"DL", name:"Delivery", status:"free", sort:8}
  ],
  menu: [
    {id:"F001", code:"F001", name:"Burger", category:"Ø®ÙØ§Ø±Ø¯Ù", price:5000, cost:3000, stock:50, minStock:5, sort:1},
    {id:"F002", code:"F002", name:"Pizza", category:"Ø®ÙØ§Ø±Ø¯Ù", price:7000, cost:4200, stock:40, minStock:5, sort:2},
    {id:"F003", code:"F003", name:"Chicken", category:"Ø®ÙØ§Ø±Ø¯Ù", price:8000, cost:5000, stock:35, minStock:5, sort:3},
    {id:"D001", code:"D001", name:"Water", category:"Ø®ÙØ§Ø±Ø¯ÙÛÙÛ", price:500, cost:250, stock:100, minStock:15, sort:4},
    {id:"D002", code:"D002", name:"Pepsi", category:"Ø®ÙØ§Ø±Ø¯ÙÛÙÛ", price:1000, cost:650, stock:80, minStock:10, sort:5},
    {id:"S001", code:"S001", name:"Dessert", category:"Ø´ÛØ±ÛÙÛ", price:3500, cost:1800, stock:25, minStock:5, sort:6}
  ]
};

let data = { user: DEFAULT.user, tables: [], menu: [], orders: {}, sales: [], expenses: [], customers: [] };
let state = { page:"dashboard", logged:false, role:"", selectedTable:null, editingItem:null, selectedCat:"", ready:false, error:"" };
let unsubscribers = [];

function settingsRef(){ return doc(db, ...PATH, "settings", "main"); }
function colRef(name){ return collection(db, ...PATH, name); }
function docRef(name,id){ return doc(db, ...PATH, name, id); }
function clean(obj){ return JSON.parse(JSON.stringify(obj)); }

function byId(id){ return document.getElementById(id); }
function money(n){ return Number(n||0).toLocaleString()+" IQD"; }
function today(){ return new Date().toISOString().slice(0,10); }
function month(){ return new Date().toISOString().slice(0,7); }
function tableById(id){ return data.tables.find(t=>t.id===id); }
function newOrder(tableId){ return {tableId,items:[],discount:0,type:"dinein",status:"open",note:"",customerName:"",customerPhone:"",created:new Date().toISOString(),updated:new Date().toISOString()}; }
function order(id){ return data.orders[id] || newOrder(id); }
function itemsTotal(o){ return (o.items||[]).reduce((s,i)=>s+i.qty*i.price,0); }
function serviceAmount(o){ return Math.round(itemsTotal(o)*Number(data.user.servicePercent||0)/100); }
function taxAmount(o){ return Math.round((itemsTotal(o)+serviceAmount(o)-Number(o.discount||0))*Number(data.user.taxPercent||0)/100); }
function orderTotal(o){ return Math.max(0, itemsTotal(o)+serviceAmount(o)+taxAmount(o)-Number(o.discount||0)); }
function profitOfSale(s){ return (s.items||[]).reduce((a,i)=>a+(i.price-i.cost)*i.qty,0)+Number(s.service||0)+Number(s.tax||0)-Number(s.discount||0); }
function canManage(){ return state.role==="cashier" || state.role==="admin"; }
function canSettings(){ return state.role==="admin"; }
function nowISO(){ return new Date().toISOString(); }

async function ensureInitialData(){
  const s = await getDoc(settingsRef());
  if(!s.exists()) await setDoc(settingsRef(), clean(DEFAULT.user));
  const tablesSnap = await getDocs(colRef("tables"));
  if(tablesSnap.empty){
    const b = writeBatch(db);
    DEFAULT.tables.forEach(t=>b.set(docRef("tables",t.id), clean(t)));
    await b.commit();
  }
  const menuSnap = await getDocs(colRef("menu"));
  if(menuSnap.empty){
    const b = writeBatch(db);
    DEFAULT.menu.forEach(i=>b.set(docRef("menu",i.id), clean(i)));
    await b.commit();
  }
}

function startListeners(){
  unsubscribers.forEach(u=>u());
  unsubscribers = [];

  unsubscribers.push(onSnapshot(settingsRef(), snap=>{
    data.user = Object.assign({}, DEFAULT.user, snap.data() || {});
    state.ready = true;
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("tables"), orderBy("sort","asc")), snap=>{
    data.tables = snap.docs.map(d=>Object.assign({id:d.id}, d.data()));
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("menu"), orderBy("sort","asc")), snap=>{
    data.menu = snap.docs.map(d=>Object.assign({id:d.id}, d.data()));
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(colRef("orders"), snap=>{
    const obj={};
    snap.docs.forEach(d=>{ obj[d.id] = Object.assign({tableId:d.id}, d.data()); });
    data.orders=obj;
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("sales"), orderBy("date","desc")), snap=>{
    data.sales = snap.docs.map(d=>Object.assign({id:d.id}, d.data()));
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("expenses"), orderBy("date","desc")), snap=>{
    data.expenses = snap.docs.map(d=>Object.assign({id:d.id}, d.data()));
    render();
  }, handleError));

  unsubscribers.push(onSnapshot(query(colRef("customers"), orderBy("updated","desc")), snap=>{
    data.customers = snap.docs.map(d=>Object.assign({id:d.id}, d.data()));
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

function renderLoading(){ byId("app").innerHTML = `<div class="loading">Loading Cloud POS...</div>`; }

function render(){
  const app=byId("app");
  if(state.error){
    app.innerHTML = `<div class="app"><div class="card" style="margin:40px auto;max-width:760px"><h2>Ú©ÛØ´ÛÛ Firebase</h2><div class="errorbox">${state.error}</div><p class="muted">Ø²ÛØ±Ø¬Ø§Ø± ÙØ§ØªÛ Firestore Database ÛØ§Ù Rules ÙÛØ´ØªØ§ Ø¯Ø§ÙÛÙØ±Ø§ÙÛ.</p></div></div>`;
    return;
  }
  if(!state.ready){ renderLoading(); return; }
  if(!state.logged){
    app.innerHTML=`
    <div class="login card">
      <div class="logo">ð½ï¸</div>
      <h2>ÚÙÙÙÛÚÙÙØ±ÛÙÛ</h2>
      <p class="muted">Restaurant POS Cloud Sync</p>
      <div class="slogan">Ú©Ø§Ù¾ØªÙØ Ú©Ø§Ø´ÛØ± Ù Kitchen ÙÛÙØ§Ù Order Ø¨Û realtime Ø¯ÛØ¨ÛÙÙ</div>
      <label>Username</label><input id="loginUser" value="admin">
      <label>Password</label><input id="loginPass" type="password" value="1234">
      <label>Role</label>
      <select id="loginRole">
        <option value="admin">Admin / Cashier</option>
        <option value="cashier">Cashier</option>
        <option value="captain">Captain iPad</option>
        <option value="kitchen">Kitchen Screen</option>
      </select>
      <button onclick="login()" style="margin-top:12px">Login</button>
      <p class="muted small">Captain password: 1111 | Kitchen password: 2222</p>
    </div>`;
    return;
  }

  const navs = state.role==="captain"
    ? `${nav("orders","ð Captain Orders")}`
    : state.role==="kitchen"
      ? `${nav("kitchen","ð¨âð³ Kitchen")}`
      : `${nav("dashboard","ð  Dashboard")}${nav("orders","ðª ÙÛØ² Ù Order")}${nav("kitchen","ð¨âð³ Kitchen")}${nav("menu","ð ÙÙÛÙ / Ø³ØªÛÚ©")}${nav("customers","ð¥ Ú©ÚÛØ§Ø±Ø§Ù")}${nav("expenses","ð¸ ÙÛØ³Ø±ÙÙ")}${nav("reports","ð ÚØ§Ù¾ÛØ±Øª")}${nav("settings","âï¸ ÚÛÚ©Ø®Ø³ØªÙ")}`;

  app.innerHTML=`
  <div class="app">
    <div class="topbar">
      <div class="brand">ð½ï¸ ${data.user.restaurantName} <span class="badge blue">${state.role}</span></div>
      <div class="actions"><span class="badge">${new Date().toLocaleDateString()}</span><button class="secondary" onclick="logout()">Logout</button></div>
    </div>
    <div class="layout">
      <div class="sidebar">${navs}</div>
      <div class="content">${pageHtml()}</div>
    </div>
  </div>
  <div id="printArea" class="hidden"></div>`;
  afterRender();
}

function nav(p,t){ return `<button class="navbtn ${state.page===p?'active':''}" onclick="go('${p}')">${t}</button>`; }
function go(p){ state.page=p; render(); }
function login(){
  const u=byId("loginUser").value.trim();
  const p=byId("loginPass").value;
  const role=byId("loginRole").value;

  if(role==="captain" && p===String(data.user.captainPassword||"1111")){
    state.logged=true; state.role="captain"; state.page="orders"; render(); return;
  }
  if(role==="kitchen" && p===String(data.user.kitchenPassword||"2222")){
    state.logged=true; state.role="kitchen"; state.page="kitchen"; render(); return;
  }
  if((role==="admin"||role==="cashier") && u===data.user.username && p===data.user.password){
    state.logged=true; state.role=role; state.page="dashboard"; render(); return;
  }
  alert("Username ÛØ§Ù Password ÙÛÚµÛÛÛ");
}
function logout(){ state.logged=false; state.role=""; state.selectedTable=null; render(); }

function pageHtml(){
  if(state.page==="dashboard") return dashboardHtml();
  if(state.page==="orders") return ordersHtml();
  if(state.page==="kitchen") return kitchenHtml();
  if(state.page==="menu") return menuHtml();
  if(state.page==="customers") return customersHtml();
  if(state.page==="expenses") return expensesHtml();
  if(state.page==="reports") return reportsHtml();
  return settingsHtml();
}
function afterRender(){
  if(state.page==="orders"){ renderTables(); renderOrderBox(); }
  if(state.page==="menu") renderMenuTable();
  if(state.page==="expenses") renderExpenses();
}

/* DASHBOARD */
function dashboardHtml(){
  const d=data.sales.filter(s=>String(s.date||"").slice(0,10)===today());
  const m=data.sales.filter(s=>String(s.date||"").slice(0,7)===month());
  const expToday=data.expenses.filter(e=>String(e.date||"").slice(0,10)===today()).reduce((s,e)=>s+Number(e.amount||0),0);
  const total=d.reduce((s,x)=>s+Number(x.total||0),0);
  const profit=d.reduce((s,x)=>s+profitOfSale(x),0)-expToday;
  const openOrders=Object.values(data.orders).filter(o=>(o.items||[]).length).length;
  return `
  <div class="grid four">
    <div class="card glass"><div class="muted">Ø¯Ø§ÙØ§ØªÛ Ø¦ÛÙÚÛ</div><div class="kpi">${money(total)}</div></div>
    <div class="card glass"><div class="muted">ÙØ§Ø²Ø§ÙØ¬Û Ù¾Ø§Ú©</div><div class="kpi">${money(profit)}</div></div>
    <div class="card glass"><div class="muted">Order Ú©Ø±Ø§ÙÛ</div><div class="kpi">${openOrders}</div></div>
    <div class="card glass"><div class="muted">ÙØ±ÛØ´ØªÙÛ ÙØ§ÙÚ¯</div><div class="kpi">${money(m.reduce((s,x)=>s+Number(x.total||0),0))}</div></div>
  </div>
  <div class="grid two" style="margin-top:14px">
    <div class="card"><h2>Ú©Ø§ÚµØ§Û Ú©ÛÙ</h2>${lowStockTable()}</div>
    <div class="card"><h2>Ø¯ÙØ§ÛÛÙ ÙÛØ³Ù</h2>${recentSalesTable(8)}</div>
  </div>`;
}
function lowStockTable(){
  const rows=data.menu.filter(i=>Number(i.stock)<=Number(i.minStock)).map(i=>`<tr><td>${i.name}</td><td>${i.stock}</td><td>${i.minStock}</td></tr>`).join("");
  return `<div class="tablewrap"><table><thead><tr><th>ÙØ§Ù</th><th>Ø³ØªÛÚ©</th><th>Ø¦Ø§Ú¯Ø§Ø¯Ø§Ø±Û</th></tr></thead><tbody>${rows||'<tr><td colspan="3" class="muted">ÙÛÚ Ú©Ø§ÚµØ§ÛÛÚ© Ú©ÛÙ ÙÛÛÛ</td></tr>'}</tbody></table></div>`;
}
function recentSalesTable(n){
  return `<div class="tablewrap"><table><thead><tr><th>Ú©Ø§Øª</th><th>Ø¬ÛØ±</th><th>Ú©Û</th></tr></thead><tbody>${data.sales.slice(0,n).map(s=>`<tr><td>${new Date(s.date).toLocaleString()}</td><td>${s.type}</td><td>${money(s.total)}</td></tr>`).join("")||'<tr><td colspan="3" class="muted">ÙÛÚ ÙØ±ÛØ´ØªÙÛÚ© ÙÛÛÛ</td></tr>'}</tbody></table></div>`;
}

/* ORDERS */
function ordersHtml(){ return `<div class="grid two"><div class="card"><h2>${state.role==="captain"?"Captain Order":"ÙÛØ²ÛÚ©Ø§Ù / Orders"}</h2><div id="tablesGrid" class="tablegrid"></div></div><div class="card"><h2>ÙØ±Ø¯ÛÚ©Ø§Ø±Û Order</h2><div id="orderBox"></div></div></div>`; }
function renderTables(){
  const box=byId("tablesGrid"); if(!box) return;
  box.innerHTML=data.tables.map(t=>{
    const o=order(t.id);
    const has=(o.items||[]).length>0;
    const cls=has?(o.status==="ready"?"ready":"busy"):(t.status==="reserved"?"reserved":"");
    return `<div class="tablecard ${cls} ${state.selectedTable===t.id?'active':''}">
      <h3>${t.name}</h3>
      <span class="badge ${has?'green':''}">${has?o.status:"free"}</span>
      <div class="muted">Items: ${(o.items||[]).length}</div>
      <div class="muted">Discount: ${money(o.discount||0)}</div>
      <b>${money(orderTotal(o))}</b>
      <div class="actions">
        <button class="blue" onclick="selectTable('${t.id}')">Ú©Ø±Ø¯ÙÛÙÛ</button>
        ${canManage() && has ? `<button class="red" onclick="checkout('${t.id}')">ÙÛØ³Ù</button>` : ""}
        ${canManage() && !has ? `<button class="amber" onclick="reserveTable('${t.id}')">Reserve</button>` : ""}
      </div>
    </div>`;
  }).join("");
}
function selectTable(id){ state.selectedTable=id; render(); }
async function reserveTable(id){
  if(!canManage()) return alert("Ø¦ÛÙÛ ØªÛÙÙØ§ Ø¨Û Ú©Ø§Ø´ÛØ±Û");
  const t=tableById(id);
  await setDoc(docRef("tables",id), clean(Object.assign({},t,{status:t.status==="reserved"?"free":"reserved"})), {merge:true});
}
async function saveOrder(o){ o.updated=nowISO(); await setDoc(docRef("orders",o.tableId), clean(o)); }
async function updateTableStatus(id,status){ const t=tableById(id)||{id}; await setDoc(docRef("tables",id), clean(Object.assign({},t,{status})), {merge:true}); }
function setType(id,v){ const o=order(id); o.type=v; saveOrder(o); }
function setStatus(id,v){ const o=order(id); o.status=v; saveOrder(o); }
function setDiscount(id,v){ const o=order(id); o.discount=Math.max(0,Number(v||0)); saveOrder(o); updateOrderTotal(id); }
function setNote(id,v){ const o=order(id); o.note=v; saveOrder(o); }
function setCustomerInfo(id,field,v){ const o=order(id); o[field]=v; saveOrder(o); }
function updateOrderTotal(id){
  const o=order(id);
  const k=byId("orderKpi"); if(k) k.textContent=money(orderTotal(o));
  const line=byId("orderSummary"); if(line) line.textContent=`Subtotal: ${money(itemsTotal(o))} | Service: ${money(serviceAmount(o))} | Tax: ${money(taxAmount(o))} | Discount: ${money(o.discount||0)}`;
}
function renderOrderBox(){
  const box=byId("orderBox"); if(!box) return;
  if(!state.selectedTable){ box.innerHTML=`<p class="muted">ÙÛØ²ÛÚ© ÙÛÚµØ¨ÚÛØ±Û.</p>`; return; }
  const t=tableById(state.selectedTable), o=order(t.id);
  box.innerHTML=`
  <h3>${t.name}</h3><div id="orderKpi" class="kpi">${money(orderTotal(o))}</div>
  <p id="orderSummary" class="muted">Subtotal: ${money(itemsTotal(o))} | Service: ${money(serviceAmount(o))} | Tax: ${money(taxAmount(o))} | Discount: ${money(o.discount||0)}</p>
  <div class="row">
    <div><label>Order Type</label><select onchange="setType('${t.id}',this.value)"><option ${o.type==='dinein'?'selected':''} value="dinein">Dine-in</option><option ${o.type==='takeaway'?'selected':''} value="takeaway">Takeaway</option><option ${o.type==='delivery'?'selected':''} value="delivery">Delivery</option></select></div>
    <div><label>Status</label><select onchange="setStatus('${t.id}',this.value)"><option ${o.status==='open'?'selected':''} value="open">Open</option><option ${o.status==='kitchen'?'selected':''} value="kitchen">Kitchen</option><option ${o.status==='ready'?'selected':''} value="ready">Ready</option></select></div>
  </div>
  <div class="row">
    <div><label>Customer</label><input value="${o.customerName||''}" oninput="setCustomerInfo('${t.id}','customerName',this.value)"></div>
    <div><label>Phone</label><input value="${o.customerPhone||''}" oninput="setCustomerInfo('${t.id}','customerPhone',this.value)"></div>
  </div>
  ${canManage()?`<div class="paybox"><label>Ø¯Ø§Ø´Ú©Ø§ÙØ¯Ù / Discount</label><input type="number" min="0" value="${o.discount||0}" oninput="setDiscount('${t.id}',this.value)"></div>`:""}
  <label>ØªÛØ¨ÛÙÛ Order</label><textarea class="order-note" oninput="setNote('${t.id}',this.value)">${o.note||''}</textarea>
  <div class="categorybar"><button class="secondary" onclick="state.selectedCat='';renderMenuToAdd()">ÙÛÙÙÙ</button>${[...new Set(data.menu.map(i=>i.category||'Other'))].map(c=>`<button class="secondary" onclick="state.selectedCat='${c}';renderMenuToAdd()">${c}</button>`).join("")}</div>
  <input id="menuSearch" placeholder="Ú¯ÛÚØ§Ù Ø¨Û ÙØ§Ù ÛØ§Ù Ú©ÛØ¯..." oninput="renderMenuToAdd()"><div id="menuToAdd" class="menugrid"></div>
  <h3>Items</h3><div class="tablewrap"><table><thead><tr><th>Ø¦Ø§ÛØªÙ</th><th>Ø¯Ø§ÙÛ</th><th>ÙØ±Ø®</th><th></th></tr></thead><tbody>${(o.items||[]).map((i,idx)=>`<tr><td>${i.name}</td><td><input style="width:70px" type="number" min="1" value="${i.qty}" onchange="setQty('${t.id}',${idx},this.value)"></td><td>${money(i.qty*i.price)}</td><td><button class="red" onclick="removeItem('${t.id}',${idx})">X</button></td></tr>`).join("")||'<tr><td colspan="4" class="muted">Ø¨ÛØªØ§ÚµÛ</td></tr>'}</tbody></table></div>
  <div class="actions" style="margin-top:12px">
    <button class="purple" onclick="setStatus('${t.id}','kitchen')">Ø¨ÙÛØ±Û Kitchen</button>
    ${canManage()?`<button class="red" onclick="checkout('${t.id}')">ÙØ±ÛØ´ØªÙ Ù ÚØ§Ù¾</button><button class="secondary" onclick="clearOrder('${t.id}')">Ù¾Ø§Ú©Ú©Ø±Ø¯ÙÛÙÛ</button>`:""}
  </div>`;
  renderMenuToAdd();
}
function renderMenuToAdd(){
  const box=byId("menuToAdd"); if(!box||!state.selectedTable) return;
  const q=(byId("menuSearch")?.value||"").toLowerCase();
  const items=data.menu.filter(i=>(!state.selectedCat||i.category===state.selectedCat)&&(i.name.toLowerCase().includes(q)||i.code.toLowerCase().includes(q)));
  box.innerHTML=items.map(i=>`<button class="itembtn" onclick="addItem('${state.selectedTable}','${i.id}')"><b>${i.name}</b><span>${i.category}</span><strong>${money(i.price)}</strong></button>`).join("");
}
async function addItem(tid,itemId){
  const p=data.menu.find(x=>x.id===itemId); if(!p) return;
  if(Number(p.stock)<=0) return alert("Ø¦ÛÙ Ú©Ø§ÚµØ§ÛÛ ÙÛÙØ§ÙÛ");
  const o=order(tid); const it=(o.items||[]).find(x=>x.id===itemId);
  if(it) it.qty++; else o.items.push({id:p.id,name:p.name,price:Number(p.price),cost:Number(p.cost||0),qty:1});
  o.status = o.status || "open";
  await saveOrder(o);
  await updateTableStatus(tid,"busy");
}
async function setQty(tid,idx,v){ const o=order(tid); o.items[idx].qty=Math.max(1,Number(v||1)); await saveOrder(o); }
async function removeItem(tid,idx){ const o=order(tid); o.items.splice(idx,1); await saveOrder(o); }
async function clearOrder(tid){
  if(!confirm("Order Ù¾Ø§Ú© Ø¨Ú©Ø±ÛØªÛÙÛØ")) return;
  await deleteDoc(docRef("orders",tid));
  await updateTableStatus(tid,"free");
}
async function checkout(tid){
  if(!canManage()) return alert("ØªÛÙÙØ§ Ú©Ø§Ø´ÛØ± Ø¯ÛØªÙØ§ÙÛØª ÙÛØ³Ù Ø¨Ú©Ø§Øª");
  const t=tableById(tid), o=order(tid); if(!o.items.length) return alert("Order Ø¨ÛØªØ§ÚµÛ");
  const sale={id:Date.now().toString(),date:nowISO(),table:t.name,type:o.type,status:"paid",customerName:o.customerName||"",customerPhone:o.customerPhone||"",note:o.note||"",items:clean(o.items),subtotal:itemsTotal(o),service:serviceAmount(o),tax:taxAmount(o),discount:Number(o.discount||0),total:orderTotal(o),paid:orderTotal(o),change:0};
  const b=writeBatch(db);
  b.set(docRef("sales",sale.id), clean(sale));
  sale.items.forEach(it=>{
    const p=data.menu.find(x=>x.id===it.id);
    if(p) b.set(docRef("menu",it.id), clean(Object.assign({},p,{stock:Number(p.stock||0)-it.qty})), {merge:true});
  });
  if(sale.customerName || sale.customerPhone){
    const cid=(sale.customerPhone||sale.customerName||sale.id).replace(/[^a-zA-Z0-9_-]/g,"_");
    b.set(docRef("customers",cid), {name:sale.customerName||"Customer", phone:sale.customerPhone||"", visits:increment(1), total:increment(sale.total), updated:nowISO()}, {merge:true});
  }
  b.delete(docRef("orders",tid));
  b.set(docRef("tables",tid), clean(Object.assign({},t,{status:"free"})), {merge:true});
  await b.commit();
  printReceipt(sale);
}

/* KITCHEN */
function kitchenHtml(){
  const open=Object.values(data.orders).filter(o=>o.items&&o.items.length&&o.status!=="paid");
  return `<div class="card"><h2>Kitchen Display</h2><div class="grid two">${open.map(o=>{const t=tableById(o.tableId)||{name:o.tableId};return `<div class="card"><h3>${t.name}</h3><span class="badge ${o.status==='ready'?'green':'purple'}">${o.status}</span><p class="muted">${o.note||""}</p><div class="tablewrap"><table><tbody>${o.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td></tr>`).join("")}</tbody></table></div><div class="actions" style="margin-top:10px"><button class="purple" onclick="setStatus('${o.tableId}','kitchen')">Cooking</button><button class="green" onclick="setStatus('${o.tableId}','ready')">Ready</button></div></div>`}).join("")||'<p class="muted">ÙÛÚ Order ÙÛÚ© ÙÛÛÛ</p>'}</div></div>`;
}

/* RECEIPT */
function printReceipt(sale){
  const lines=sale.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>${money(i.qty*i.price)}</td></tr>`).join("");
  const area=byId("printArea");
  area.innerHTML=`<div class="receipt"><div class="receipt-head"><div class="receipt-logo">ð½ï¸</div><h3>${data.user.restaurantName}</h3><p>${data.user.phone||""}</p></div>
  <p><b>Table:</b> ${sale.table}</p><p><b>Type:</b> ${sale.type}</p><p><b>Receipt:</b> ${sale.id}</p><p><b>Date:</b> ${new Date(sale.date).toLocaleString()}</p><hr>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>${lines}</tbody></table><hr>
  <div class="receipt-total"><p>Subtotal: ${money(sale.subtotal)}</p><p>Service: ${money(sale.service)}</p><p>Tax: ${money(sale.tax)}</p><p>Discount: ${money(sale.discount)}</p><h3>Total: ${money(sale.total)}</h3><p>Paid: ${money(sale.paid)}</p><p>Change: ${money(sale.change)}</p></div>
  <div class="receipt-footer"><p>${data.user.receiptNote}</p><p>Thank you ð½ï¸</p></div></div>`;
  area.classList.remove("hidden"); document.body.classList.add("printing-receipt");
  setTimeout(()=>window.print(),350);
  const clean=()=>{document.body.classList.remove("printing-receipt");area.classList.add("hidden");area.innerHTML="";state.selectedTable=null;render();window.removeEventListener("afterprint",clean);};
  window.addEventListener("afterprint",clean); setTimeout(()=>{if(document.body.classList.contains("printing-receipt")) clean();},60000);
}

/* MENU */
function menuHtml(){
  if(!canManage()) return `<div class="card"><h2>Access denied</h2></div>`;
  return `<div class="grid two"><div class="card"><h2>${state.editingItem?'Ø¯ÛØ³ØªÚ©Ø§Ø±Û':'Ø²ÛØ§Ø¯Ú©Ø±Ø¯ÙÛ'} Ø¦Ø§ÛØªÙ</h2><label>Ú©ÛØ¯</label><input id="mCode"><label>ÙØ§Ù</label><input id="mName"><label>Ø¬ÛØ±</label><input id="mCategory" placeholder="Ø®ÙØ§Ø±Ø¯Ù / Ø®ÙØ§Ø±Ø¯ÙÛÙÛ / Ø´ÛØ±ÛÙÛ"><div class="row"><div><label>ÙØ±Ø®Û ÙØ±ÛØ´ØªÙ</label><input id="mPrice" type="number"></div><div><label>ÙØ±Ø®Û Ú©ÚÛÙ</label><input id="mCost" type="number"></div></div><div class="row"><div><label>Ø³ØªÛÚ©</label><input id="mStock" type="number" value="20"></div><div><label>Ø¦Ø§Ú¯Ø§Ø¯Ø§Ø±Û Ø³ØªÛÚ©</label><input id="mMin" type="number" value="5"></div></div><div class="actions" style="margin-top:12px"><button class="green" onclick="saveMenuItem()">ÙÛÚµÚ¯Ø±ØªÙ</button><button class="secondary" onclick="state.editingItem=null;render()">ÙÙÛ</button></div></div><div class="card"><h2>ÙÙÛÙ Ù Ø³ØªÛÚ©</h2><input id="menuListSearch" placeholder="Ú¯ÛÚØ§Ù..." oninput="renderMenuTable()"><div id="menuTable" style="margin-top:12px"></div></div></div>`;
}
function renderMenuTable(){
  const box=byId("menuTable"); if(!box) return; const q=(byId("menuListSearch")?.value||"").toLowerCase();
  const rows=data.menu.filter(p=>p.name.toLowerCase().includes(q)||p.code.toLowerCase().includes(q)).map(p=>`<tr><td>${p.code}</td><td>${p.name}</td><td>${p.category}</td><td>${money(p.price)}</td><td><span class="badge ${p.stock<=p.minStock?'red':''}">${p.stock}</span></td><td><button class="blue" onclick="editMenuItem('${p.id}')">Edit</button><button class="red" onclick="deleteMenuItem('${p.id}')">Delete</button></td></tr>`).join("");
  box.innerHTML=`<div class="tablewrap"><table><thead><tr><th>Code</th><th>ÙØ§Ù</th><th>Ø¬ÛØ±</th><th>ÙØ±Ø®</th><th>Ø³ØªÛÚ©</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
async function saveMenuItem(){
  const id=state.editingItem || (byId("mCode").value.trim() || crypto.randomUUID());
  const item={id,code:byId("mCode").value.trim(),name:byId("mName").value.trim(),category:byId("mCategory").value.trim()||"Other",price:Number(byId("mPrice").value||0),cost:Number(byId("mCost").value||0),stock:Number(byId("mStock").value||0),minStock:Number(byId("mMin").value||0),sort:Date.now()};
  if(!item.code||!item.name||!item.price) return alert("Ú©ÛØ¯Ø ÙØ§Ù Ù ÙØ±Ø® Ù¾ÛÙÛØ³ØªÙ");
  await setDoc(docRef("menu",id), clean(item), {merge:true});
  state.editingItem=null; render();
}
function editMenuItem(id){state.editingItem=id;render();const p=data.menu.find(x=>x.id===id);byId("mCode").value=p.code;byId("mName").value=p.name;byId("mCategory").value=p.category||"";byId("mPrice").value=p.price;byId("mCost").value=p.cost;byId("mStock").value=p.stock;byId("mMin").value=p.minStock||0;}
async function deleteMenuItem(id){if(!confirm("Ø¦Ø§ÛØªÙ Ø¨Ø³ÚØ¯Ø±ÛØªÛÙÛØ"))return; await deleteDoc(docRef("menu",id));}

/* CUSTOMERS */
function customersHtml(){return `<div class="card"><h2>Ú©ÚÛØ§Ø±Ø§Ù</h2><div class="tablewrap"><table><thead><tr><th>ÙØ§Ù</th><th>ÙÛØ¨Ø§ÛÙ</th><th>Ø¬Ø§Ø±</th><th>Ú©ÛÛ Ú©ÚÛÙ</th></tr></thead><tbody>${data.customers.map(c=>`<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.visits||0}</td><td>${money(c.total||0)}</td></tr>`).join("")||'<tr><td colspan="4" class="muted">ÙÛÚ Ú©ÚÛØ§Ø±ÛÚ© ÙÛÛÛ</td></tr>'}</tbody></table></div></div>`;}

/* EXPENSES */
function expensesHtml(){
  if(!canManage()) return `<div class="card"><h2>Access denied</h2></div>`;
  return `<div class="grid two"><div class="card"><h2>Ø²ÛØ§Ø¯Ú©Ø±Ø¯ÙÛ ÙÛØ³Ø±ÙÙ</h2><label>ÙØ§ÙÙÛØ´Ø§Ù</label><input id="exTitle"><label>Ø¨Ú</label><input id="exAmount" type="number"><button class="green" style="margin-top:12px" onclick="addExpense()">Ø²ÛØ§Ø¯Ú©Ø±Ø¯Ù</button></div><div class="card"><h2>ÙÛØ³Ø±ÙÙÛÚ©Ø§Ù</h2><div id="expensesBox"></div></div></div>`;
}
async function addExpense(){
  const title=byId("exTitle").value.trim(), amount=Number(byId("exAmount").value||0); if(!title||!amount)return alert("ÙØ§ÙÙÛØ´Ø§Ù Ù Ø¨Ú Ø¨ÙÙÙØ³Û");
  const id=crypto.randomUUID();
  await setDoc(docRef("expenses",id), {id,title,amount,date:nowISO()});
}
function renderExpenses(){const box=byId("expensesBox"); if(!box)return; box.innerHTML=`<div class="tablewrap"><table><thead><tr><th>Ú©Ø§Øª</th><th>ÙØ§Ù</th><th>Ø¨Ú</th><th></th></tr></thead><tbody>${data.expenses.slice(0,100).map(e=>`<tr><td>${new Date(e.date).toLocaleString()}</td><td>${e.title}</td><td>${money(e.amount)}</td><td><button class="red" onclick="deleteExpense('${e.id}')">X</button></td></tr>`).join("")}</tbody></table></div>`;}
async function deleteExpense(id){ await deleteDoc(docRef("expenses",id)); }

/* REPORTS */
function reportsHtml(){
  const d=data.sales.filter(s=>String(s.date||"").slice(0,10)===today()), m=data.sales.filter(s=>String(s.date||"").slice(0,7)===month());
  const expD=data.expenses.filter(e=>String(e.date||"").slice(0,10)===today()).reduce((s,e)=>s+Number(e.amount||0),0);
  const totalD=d.reduce((s,x)=>s+Number(x.total||0),0), totalM=m.reduce((s,x)=>s+Number(x.total||0),0), profitD=d.reduce((s,x)=>s+profitOfSale(x),0)-expD;
  const discD=d.reduce((s,x)=>s+Number(x.discount||0),0);
  return `<div class="grid four"><div class="card"><div class="muted">Ø¯Ø§ÙØ§ØªÛ Ø¦ÛÙÚÛ</div><div class="kpi">${money(totalD)}</div></div><div class="card"><div class="muted">ÙØ§Ø²Ø§ÙØ¬Û Ù¾Ø§Ú©</div><div class="kpi">${money(profitD)}</div></div><div class="card"><div class="muted">Ø¯Ø§Ø´Ú©Ø§ÙØ¯Ù</div><div class="kpi">${money(discD)}</div></div><div class="card"><div class="muted">ÙØ§ÙÚ¯</div><div class="kpi">${money(totalM)}</div></div></div><div class="card" style="margin-top:14px"><h2>Ø¯ÙØ§ÛÛÙ ÙÛØ³ÙÛÚ©Ø§Ù</h2>${recentSalesTable(100)}</div>`;
}

/* SETTINGS */
function settingsHtml(){
  if(!canSettings()) return `<div class="card"><h2>Access denied</h2></div>`;
  return `<div class="grid two"><div class="card"><h2>ÚÛÚ©Ø®Ø³ØªÙ</h2><label>ÙØ§ÙÛ ÚÛØ³ØªÛØ±Ø§ÙØª</label><input id="restaurantName" value="${data.user.restaurantName}"><label>ÙÛØ¨Ø§ÛÙ</label><input id="phone" value="${data.user.phone}"><div class="row"><div><label>Service %</label><input id="servicePercent" type="number" value="${data.user.servicePercent}"></div><div><label>Tax %</label><input id="taxPercent" type="number" value="${data.user.taxPercent}"></div></div><label>Captain Password</label><input id="captainPassword" value="${data.user.captainPassword}"><label>Kitchen Password</label><input id="kitchenPassword" value="${data.user.kitchenPassword}"><label>ÙØªÛÛ ÙÛØ³Ù</label><input id="receiptNote" value="${data.user.receiptNote}"><label>Password ÙÙÛÛ Ú©Ø§Ø´ÛØ±</label><input id="newPass"><button class="green" style="margin-top:12px" onclick="saveSettings()">ÙÛÚµÚ¯Ø±ØªÙ</button></div><div class="card"><h2>Backup</h2><div class="actions"><button class="blue" onclick="exportBackup()">Export</button><button class="amber" onclick="byId('importFile').click()">Import</button><input id="importFile" class="hidden" type="file" accept=".json" onchange="importBackup(event)"></div><p class="muted">Backup ÙÛÙØªØ§ÙÛ Ø¨Ú©Û.</p></div></div><div class="card" style="margin-top:14px"><h2>ÙÛØ²ÛÚ©Ø§Ù</h2><div class="row"><input id="newTableName" placeholder="ÙÛØ²Û 7"><button class="green" onclick="addTable()">Ø²ÛØ§Ø¯Ú©Ø±Ø¯Ù</button></div><div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>ÙØ§Ù</th><th>Ø­Ø§ÚµÛØª</th><th></th></tr></thead><tbody>${data.tables.map(t=>`<tr><td>${t.name}</td><td>${t.status}</td><td><button class="red" onclick="deleteTable('${t.id}')">Delete</button></td></tr>`).join("")}</tbody></table></div></div>`;
}
async function saveSettings(){
  const u=Object.assign({},data.user,{
    restaurantName:byId("restaurantName").value.trim()||"Restaurant POS Cloud",
    phone:byId("phone").value.trim(),
    servicePercent:Number(byId("servicePercent").value||0),
    taxPercent:Number(byId("taxPercent").value||0),
    captainPassword:byId("captainPassword").value.trim()||"1111",
    kitchenPassword:byId("kitchenPassword").value.trim()||"2222",
    receiptNote:byId("receiptNote").value.trim()
  });
  const np=byId("newPass").value; if(np) u.password=np;
  await setDoc(settingsRef(), clean(u), {merge:true});
}
async function addTable(){
  const name=byId("newTableName").value.trim(); if(!name)return alert("ÙØ§ÙÛ ÙÛØ² Ø¨ÙÙÙØ³Û");
  const id=crypto.randomUUID();
  await setDoc(docRef("tables",id), {id,name,status:"free",sort:Date.now()});
}
async function deleteTable(id){
  if(order(id).items.length)return alert("Ø³ÛØ±ÛØªØ§ Order ÙÛÚ©Û Ù¾Ø§Ú© Ø¨Ú©Û");
  await deleteDoc(docRef("tables",id));
  await deleteDoc(docRef("orders",id));
}
function exportBackup(){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="restaurant-pos-cloud-backup.json";a.click();
}
function importBackup(e){ alert("Import ÙÛ ÙÛØ´Ø§ÙÛ Cloud Ø¯ÙØ§ØªØ± Ø²ÛØ§Ø¯ Ø¯ÛÚ©Ø±ÛØª. Export Ú©Ø§Ø± Ø¯ÛÚ©Ø§Øª."); }

Object.assign(window, {
  login,logout,go,selectTable,reserveTable,setType,setStatus,setDiscount,setNote,setCustomerInfo,renderMenuToAdd,addItem,setQty,removeItem,clearOrder,checkout,
  saveMenuItem,editMenuItem,deleteMenuItem,addExpense,deleteExpense,saveSettings,addTable,deleteTable,exportBackup,importBackup,
  state, byId
});

init();
