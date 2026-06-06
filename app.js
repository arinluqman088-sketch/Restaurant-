const LS = "RESTAURANT_POS_ULTRA_V10";

const defaultData = {
  user: {
    username:"admin",
    password:"1234",
    restaurantName:"Restaurant POS Ultra",
    phone:"0770 000 0000",
    servicePercent:0,
    taxPercent:0,
    receiptNote:"“ خواردنێکی خۆش، ساتێکی تایبەت “"
  },
  tables: [
    {id:"T1", name:"مێزی 1", status:"free"},
    {id:"T2", name:"مێزی 2", status:"free"},
    {id:"T3", name:"مێزی 3", status:"free"},
    {id:"T4", name:"مێزی 4", status:"free"},
    {id:"T5", name:"مێزی 5", status:"free"},
    {id:"T6", name:"مێزی 6", status:"free"},
    {id:"TA", name:"Takeaway", status:"free"},
    {id:"DL", name:"Delivery", status:"free"}
  ],
  menu: [
    {id:crypto.randomUUID(), code:"F001", name:"Burger", category:"خواردن", price:5000, cost:3000, stock:50, minStock:5},
    {id:crypto.randomUUID(), code:"F002", name:"Pizza", category:"خواردن", price:7000, cost:4200, stock:40, minStock:5},
    {id:crypto.randomUUID(), code:"F003", name:"Chicken", category:"خواردن", price:8000, cost:5000, stock:35, minStock:5},
    {id:crypto.randomUUID(), code:"D001", name:"Water", category:"خواردنەوە", price:500, cost:250, stock:100, minStock:15},
    {id:crypto.randomUUID(), code:"D002", name:"Pepsi", category:"خواردنەوە", price:1000, cost:650, stock:80, minStock:10},
    {id:crypto.randomUUID(), code:"S001", name:"Dessert", category:"شیرینی", price:3500, cost:1800, stock:25, minStock:5}
  ],
  orders:{},
  sales:[],
  expenses:[],
  customers:[]
};

let data = loadData();
let state = { page:"dashboard", logged:false, selectedTable:null, editingItem:null, selectedCat:"" };

function loadData(){
  const raw = localStorage.getItem(LS);
  if(!raw){ localStorage.setItem(LS, JSON.stringify(defaultData)); return structuredClone(defaultData); }
  try{
    const p = JSON.parse(raw);
    p.orders = p.orders || {};
    p.sales = p.sales || [];
    p.expenses = p.expenses || [];
    p.customers = p.customers || [];
    p.tables = p.tables || structuredClone(defaultData.tables);
    p.menu = p.menu || structuredClone(defaultData.menu);
    p.user = Object.assign(structuredClone(defaultData.user), p.user || {});
    p.tables.forEach(t=>{ if(!t.status) t.status="free"; });
    return p;
  }catch{ return structuredClone(defaultData); }
}
function save(){ localStorage.setItem(LS, JSON.stringify(data)); }
function byId(id){ return document.getElementById(id); }
function money(n){ return Number(n||0).toLocaleString()+" IQD"; }
function today(){ return new Date().toISOString().slice(0,10); }
function month(){ return new Date().toISOString().slice(0,7); }
function tableById(id){ return data.tables.find(t=>t.id===id); }
function order(id){ data.orders[id]=data.orders[id] || newOrder(id); return data.orders[id]; }
function newOrder(tableId){ return {tableId, items:[], discount:0, type:"dinein", status:"open", note:"", customerName:"", customerPhone:"", created:new Date().toISOString()}; }
function itemsTotal(o){ return (o.items||[]).reduce((s,i)=>s+i.qty*i.price,0); }
function serviceAmount(o){ return Math.round(itemsTotal(o)*Number(data.user.servicePercent||0)/100); }
function taxAmount(o){ return Math.round((itemsTotal(o)+serviceAmount(o)-Number(o.discount||0))*Number(data.user.taxPercent||0)/100); }
function orderTotal(o){ return Math.max(0, itemsTotal(o)+serviceAmount(o)+taxAmount(o)-Number(o.discount||0)); }
function profitOfSale(s){ return (s.items||[]).reduce((a,i)=>a+(i.price-i.cost)*i.qty,0)+Number(s.service||0)+Number(s.tax||0)-Number(s.discount||0); }

function render(){
  const app=byId("app");
  if(!state.logged){
    app.innerHTML=`
    <div class="login card">
      <div class="logo">🍽️</div>
      <h2>چوونەژوورەوە</h2>
      <p class="muted">سیستەمی پیشکەوتووی ڕێستۆرانت</p>
      <div class="slogan">Dashboard، مێز، Kitchen، Delivery، Customer، Expense و ڕاپۆرتی قازانج</div>
      <label>Username</label><input id="loginUser" value="admin">
      <label>Password</label><input id="loginPass" type="password" value="1234">
      <button onclick="login()" style="margin-top:12px">Login</button>
    </div>`;
    return;
  }
  app.innerHTML=`
  <div class="app">
    <div class="topbar">
      <div class="brand">🍽️ ${data.user.restaurantName}</div>
      <div class="actions"><span class="badge">${new Date().toLocaleDateString()}</span><button class="secondary" onclick="logout()">Logout</button></div>
    </div>
    <div class="layout">
      <div class="sidebar">
        ${nav("dashboard","🏠 Dashboard")}
        ${nav("orders","🪑 مێز و Order")}
        ${nav("kitchen","👨‍🍳 Kitchen")}
        ${nav("menu","🍔 منیو / ستۆک")}
        ${nav("customers","👥 کڕیاران")}
        ${nav("expenses","💸 مەسروف")}
        ${nav("reports","📊 ڕاپۆرت")}
        ${nav("settings","⚙️ ڕێکخستن")}
      </div>
      <div class="content">${pageHtml()}</div>
    </div>
  </div>
  <div id="printArea" class="hidden"></div>`;
  afterRender();
}
function nav(p,t){ return `<button class="navbtn ${state.page===p?'active':''}" onclick="go('${p}')">${t}</button>`; }
function go(p){ state.page=p; render(); }
function login(){ const u=byId("loginUser").value.trim(), p=byId("loginPass").value; if(u===data.user.username && p===data.user.password){state.logged=true;render();} else alert("Username یان Password هەڵەیە"); }
function logout(){ state.logged=false; render(); }
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
  const d=data.sales.filter(s=>s.date.slice(0,10)===today());
  const m=data.sales.filter(s=>s.date.slice(0,7)===month());
  const expToday=data.expenses.filter(e=>e.date.slice(0,10)===today()).reduce((s,e)=>s+Number(e.amount||0),0);
  const total=d.reduce((s,x)=>s+x.total,0);
  const profit=d.reduce((s,x)=>s+profitOfSale(x),0)-expToday;
  const openOrders=Object.values(data.orders).filter(o=>(o.items||[]).length).length;
  return `
  <div class="grid four">
    <div class="card glass"><div class="muted">داهاتی ئەمڕۆ</div><div class="kpi">${money(total)}</div></div>
    <div class="card glass"><div class="muted">قازانجی پاک</div><div class="kpi">${money(profit)}</div></div>
    <div class="card glass"><div class="muted">Order کراوە</div><div class="kpi">${openOrders}</div></div>
    <div class="card glass"><div class="muted">فرۆشتنی مانگ</div><div class="kpi">${money(m.reduce((s,x)=>s+x.total,0))}</div></div>
  </div>
  <div class="grid two" style="margin-top:14px">
    <div class="card"><h2>کاڵای کەم</h2>${lowStockTable()}</div>
    <div class="card"><h2>دوایین وەسل</h2>${recentSalesTable(8)}</div>
  </div>`;
}
function lowStockTable(){
  const rows=data.menu.filter(i=>Number(i.stock)<=Number(i.minStock)).map(i=>`<tr><td>${i.name}</td><td>${i.stock}</td><td>${i.minStock}</td></tr>`).join("");
  return `<div class="tablewrap"><table><thead><tr><th>ناو</th><th>ستۆک</th><th>ئاگاداری</th></tr></thead><tbody>${rows||'<tr><td colspan="3" class="muted">هیچ کاڵایەک کەم نییە</td></tr>'}</tbody></table></div>`;
}
function recentSalesTable(n){
  return `<div class="tablewrap"><table><thead><tr><th>کات</th><th>جۆر</th><th>کۆ</th></tr></thead><tbody>${data.sales.slice(0,n).map(s=>`<tr><td>${new Date(s.date).toLocaleString()}</td><td>${s.type}</td><td>${money(s.total)}</td></tr>`).join("")||'<tr><td colspan="3" class="muted">هیچ فرۆشتنێک نییە</td></tr>'}</tbody></table></div>`;
}

/* ORDERS */
function ordersHtml(){
  return `<div class="grid two"><div class="card"><h2>مێزەکان / Takeaway / Delivery</h2><div id="tablesGrid" class="tablegrid"></div></div><div class="card"><h2>وردەکاری Order</h2><div id="orderBox"></div></div></div>`;
}
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
      <div class="actions"><button class="blue" onclick="selectTable('${t.id}')">کردنەوە</button>${has?`<button class="red" onclick="checkout('${t.id}')">وەسل</button>`:`<button class="amber" onclick="reserveTable('${t.id}')">Reserve</button>`}</div>
    </div>`;
  }).join("");
}
function selectTable(id){ state.selectedTable=id; render(); }
function reserveTable(id){ const t=tableById(id); t.status=t.status==="reserved"?"free":"reserved"; save(); render(); }
function setType(id,v){ order(id).type=v; save(); renderTables(); }
function setStatus(id,v){ order(id).status=v; save(); render(); }
function setDiscount(id,v){ order(id).discount=Math.max(0,Number(v||0)); save(); updateOrderTotal(id); renderTables(); }
function setNote(id,v){ order(id).note=v; save(); }
function setCustomerInfo(id,field,v){ order(id)[field]=v; save(); }
function updateOrderTotal(id){
  const o=order(id);
  const k=byId("orderKpi"); if(k) k.textContent=money(orderTotal(o));
  const line=byId("orderSummary"); if(line) line.textContent=`Subtotal: ${money(itemsTotal(o))} | Service: ${money(serviceAmount(o))} | Tax: ${money(taxAmount(o))} | Discount: ${money(o.discount||0)}`;
}
function renderOrderBox(){
  const box=byId("orderBox"); if(!box) return;
  if(!state.selectedTable){ box.innerHTML=`<p class="muted">مێزێک هەڵبژێرە.</p>`; return; }
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
  <div class="paybox"><label>داشکاندن / Discount</label><input type="number" min="0" value="${o.discount||0}" oninput="setDiscount('${t.id}',this.value)"></div>
  <label>تێبینی Order</label><textarea class="order-note" oninput="setNote('${t.id}',this.value)">${o.note||''}</textarea>
  <div class="categorybar"><button class="secondary" onclick="state.selectedCat='';renderMenuToAdd()">هەموو</button>${[...new Set(data.menu.map(i=>i.category||'Other'))].map(c=>`<button class="secondary" onclick="state.selectedCat='${c}';renderMenuToAdd()">${c}</button>`).join("")}</div>
  <input id="menuSearch" placeholder="گەڕان بە ناو یان کۆد..." oninput="renderMenuToAdd()"><div id="menuToAdd" class="menugrid"></div>
  <h3>Items</h3><div class="tablewrap"><table><thead><tr><th>ئایتم</th><th>دانە</th><th>نرخ</th><th></th></tr></thead><tbody>${o.items.map((i,idx)=>`<tr><td>${i.name}</td><td><input style="width:70px" type="number" min="1" value="${i.qty}" onchange="setQty('${t.id}',${idx},this.value)"></td><td>${money(i.qty*i.price)}</td><td><button class="red" onclick="removeItem('${t.id}',${idx})">X</button></td></tr>`).join("")||'<tr><td colspan="4" class="muted">بەتاڵە</td></tr>'}</tbody></table></div>
  <div class="actions" style="margin-top:12px"><button class="purple" onclick="setStatus('${t.id}','kitchen')">بنێرە Kitchen</button><button class="red" onclick="checkout('${t.id}')">فرۆشتن و چاپ</button><button class="secondary" onclick="clearOrder('${t.id}')">پاککردنەوە</button></div>`;
  renderMenuToAdd();
}
function renderMenuToAdd(){
  const box=byId("menuToAdd"); if(!box||!state.selectedTable) return;
  const q=(byId("menuSearch")?.value||"").toLowerCase();
  const items=data.menu.filter(i=>(!state.selectedCat||i.category===state.selectedCat)&&(i.name.toLowerCase().includes(q)||i.code.toLowerCase().includes(q)));
  box.innerHTML=items.map(i=>`<button class="itembtn" onclick="addItem('${state.selectedTable}','${i.id}')"><b>${i.name}</b><span>${i.category}</span><strong>${money(i.price)}</strong></button>`).join("");
}
function addItem(tid,itemId){
  const p=data.menu.find(x=>x.id===itemId); if(!p) return;
  if(Number(p.stock)<=0) return alert("ئەم کاڵایە نەماوە");
  const o=order(tid); const it=o.items.find(x=>x.id===itemId);
  if(it) it.qty++; else o.items.push({id:p.id,name:p.name,price:Number(p.price),cost:Number(p.cost||0),qty:1});
  tableById(tid).status="busy"; save(); render();
}
function setQty(tid,idx,v){ order(tid).items[idx].qty=Math.max(1,Number(v||1)); save(); render(); }
function removeItem(tid,idx){ order(tid).items.splice(idx,1); save(); render(); }
function clearOrder(tid){ if(!confirm("Order پاک بکرێتەوە؟")) return; data.orders[tid]=newOrder(tid); tableById(tid).status="free"; save(); render(); }
function checkout(tid){
  const t=tableById(tid), o=order(tid); if(!o.items.length) return alert("Order بەتاڵە");
  const sale={id:Date.now().toString(),date:new Date().toISOString(),table:t.name,type:o.type,status:"paid",customerName:o.customerName,customerPhone:o.customerPhone,note:o.note,items:structuredClone(o.items),subtotal:itemsTotal(o),service:serviceAmount(o),tax:taxAmount(o),discount:Number(o.discount||0),total:orderTotal(o),paid:orderTotal(o),change:0};
  sale.items.forEach(it=>{const p=data.menu.find(x=>x.id===it.id); if(p) p.stock=Number(p.stock||0)-it.qty;});
  if(sale.customerName||sale.customerPhone){ const ex=data.customers.find(c=>c.phone&&c.phone===sale.customerPhone); if(!ex) data.customers.unshift({id:crypto.randomUUID(),name:sale.customerName||"Customer",phone:sale.customerPhone||"",visits:1,total:sale.total}); else {ex.visits=Number(ex.visits||0)+1; ex.total=Number(ex.total||0)+sale.total;} }
  data.sales.unshift(sale); data.orders[tid]=newOrder(tid); t.status="free"; save(); printReceipt(sale);
}

/* KITCHEN */
function kitchenHtml(){
  const open=Object.values(data.orders).filter(o=>o.items&&o.items.length&&o.status!=="paid");
  return `<div class="card"><h2>Kitchen Display</h2><div class="grid two">${open.map(o=>{const t=tableById(o.tableId)||{name:o.tableId};return `<div class="card"><h3>${t.name}</h3><span class="badge ${o.status==='ready'?'green':'purple'}">${o.status}</span><p class="muted">${o.note||""}</p><div class="tablewrap"><table><tbody>${o.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td></tr>`).join("")}</tbody></table></div><div class="actions" style="margin-top:10px"><button class="purple" onclick="setStatus('${o.tableId}','kitchen')">Cooking</button><button class="green" onclick="setStatus('${o.tableId}','ready')">Ready</button></div></div>`}).join("")||'<p class="muted">هیچ Order ـێک نییە</p>'}</div></div>`;
}

/* RECEIPT */
function printReceipt(sale){
  const lines=sale.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>${money(i.qty*i.price)}</td></tr>`).join("");
  const area=byId("printArea");
  area.innerHTML=`<div class="receipt"><div class="receipt-head"><div class="receipt-logo">🍽️</div><h3>${data.user.restaurantName}</h3><p>${data.user.phone||""}</p></div>
  <p><b>Table:</b> ${sale.table}</p><p><b>Type:</b> ${sale.type}</p><p><b>Receipt:</b> ${sale.id}</p><p><b>Date:</b> ${new Date(sale.date).toLocaleString()}</p><hr>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>${lines}</tbody></table><hr>
  <div class="receipt-total"><p>Subtotal: ${money(sale.subtotal)}</p><p>Service: ${money(sale.service)}</p><p>Tax: ${money(sale.tax)}</p><p>Discount: ${money(sale.discount)}</p><h3>Total: ${money(sale.total)}</h3><p>Paid: ${money(sale.paid)}</p><p>Change: ${money(sale.change)}</p></div>
  <div class="receipt-footer"><p>${data.user.receiptNote}</p><p>Thank you 🍽️</p></div></div>`;
  area.classList.remove("hidden"); document.body.classList.add("printing-receipt");
  setTimeout(()=>window.print(),350);
  const clean=()=>{document.body.classList.remove("printing-receipt");area.classList.add("hidden");area.innerHTML="";state.selectedTable=null;render();window.removeEventListener("afterprint",clean);};
  window.addEventListener("afterprint",clean); setTimeout(()=>{if(document.body.classList.contains("printing-receipt")) clean();},60000);
}

/* MENU */
function menuHtml(){return `<div class="grid two"><div class="card"><h2>${state.editingItem?'دەستکاری':'زیادکردنی'} ئایتم</h2><label>کۆد</label><input id="mCode"><label>ناو</label><input id="mName"><label>جۆر</label><input id="mCategory" placeholder="خواردن / خواردنەوە / شیرینی"><div class="row"><div><label>نرخی فرۆشتن</label><input id="mPrice" type="number"></div><div><label>نرخی کڕین</label><input id="mCost" type="number"></div></div><div class="row"><div><label>ستۆک</label><input id="mStock" type="number" value="20"></div><div><label>ئاگاداری ستۆک</label><input id="mMin" type="number" value="5"></div></div><div class="actions" style="margin-top:12px"><button class="green" onclick="saveMenuItem()">هەڵگرتن</button><button class="secondary" onclick="state.editingItem=null;render()">نوێ</button></div></div><div class="card"><h2>منیو و ستۆک</h2><input id="menuListSearch" placeholder="گەڕان..." oninput="renderMenuTable()"><div id="menuTable" style="margin-top:12px"></div></div></div>`;}
function renderMenuTable(){
  const box=byId("menuTable"); if(!box) return; const q=(byId("menuListSearch")?.value||"").toLowerCase();
  const rows=data.menu.filter(p=>p.name.toLowerCase().includes(q)||p.code.toLowerCase().includes(q)).map(p=>`<tr><td>${p.code}</td><td>${p.name}</td><td>${p.category}</td><td>${money(p.price)}</td><td><span class="badge ${p.stock<=p.minStock?'red':''}">${p.stock}</span></td><td><button class="blue" onclick="editMenuItem('${p.id}')">Edit</button><button class="red" onclick="deleteMenuItem('${p.id}')">Delete</button></td></tr>`).join("");
  box.innerHTML=`<div class="tablewrap"><table><thead><tr><th>Code</th><th>ناو</th><th>جۆر</th><th>نرخ</th><th>ستۆک</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function saveMenuItem(){
  const item={id:state.editingItem||crypto.randomUUID(),code:byId("mCode").value.trim(),name:byId("mName").value.trim(),category:byId("mCategory").value.trim()||"Other",price:Number(byId("mPrice").value||0),cost:Number(byId("mCost").value||0),stock:Number(byId("mStock").value||0),minStock:Number(byId("mMin").value||0)};
  if(!item.code||!item.name||!item.price) return alert("کۆد، ناو و نرخ پێویستن");
  const exists=data.menu.find(x=>x.code===item.code&&x.id!==item.id); if(exists) return alert("ئەم کۆدە پێشتر هەیە");
  const idx=data.menu.findIndex(x=>x.id===item.id); if(idx>=0)data.menu[idx]=item; else data.menu.unshift(item);
  state.editingItem=null; save(); render();
}
function editMenuItem(id){state.editingItem=id;render();const p=data.menu.find(x=>x.id===id);byId("mCode").value=p.code;byId("mName").value=p.name;byId("mCategory").value=p.category||"";byId("mPrice").value=p.price;byId("mCost").value=p.cost;byId("mStock").value=p.stock;byId("mMin").value=p.minStock||0;}
function deleteMenuItem(id){if(!confirm("ئایتم بسڕدرێتەوە؟"))return;data.menu=data.menu.filter(x=>x.id!==id);save();render();}

/* CUSTOMERS */
function customersHtml(){return `<div class="card"><h2>کڕیاران</h2><div class="tablewrap"><table><thead><tr><th>ناو</th><th>مۆبایل</th><th>جار</th><th>کۆی کڕین</th></tr></thead><tbody>${data.customers.map(c=>`<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.visits||0}</td><td>${money(c.total||0)}</td></tr>`).join("")||'<tr><td colspan="4" class="muted">هیچ کڕیارێک نییە</td></tr>'}</tbody></table></div></div>`;}

/* EXPENSES */
function expensesHtml(){return `<div class="grid two"><div class="card"><h2>زیادکردنی مەسروف</h2><label>ناونیشان</label><input id="exTitle"><label>بڕ</label><input id="exAmount" type="number"><button class="green" style="margin-top:12px" onclick="addExpense()">زیادکردن</button></div><div class="card"><h2>مەسروفەکان</h2><div id="expensesBox"></div></div></div>`;}
function addExpense(){const title=byId("exTitle").value.trim(), amount=Number(byId("exAmount").value||0); if(!title||!amount)return alert("ناونیشان و بڕ بنووسە"); data.expenses.unshift({id:crypto.randomUUID(),title,amount,date:new Date().toISOString()}); save(); render();}
function renderExpenses(){const box=byId("expensesBox"); if(!box)return; box.innerHTML=`<div class="tablewrap"><table><thead><tr><th>کات</th><th>ناو</th><th>بڕ</th><th></th></tr></thead><tbody>${data.expenses.slice(0,100).map(e=>`<tr><td>${new Date(e.date).toLocaleString()}</td><td>${e.title}</td><td>${money(e.amount)}</td><td><button class="red" onclick="deleteExpense('${e.id}')">X</button></td></tr>`).join("")}</tbody></table></div>`;}
function deleteExpense(id){data.expenses=data.expenses.filter(e=>e.id!==id);save();render();}

/* REPORTS */
function reportsHtml(){
  const d=data.sales.filter(s=>s.date.slice(0,10)===today()), m=data.sales.filter(s=>s.date.slice(0,7)===month());
  const expD=data.expenses.filter(e=>e.date.slice(0,10)===today()).reduce((s,e)=>s+Number(e.amount||0),0);
  const totalD=d.reduce((s,x)=>s+x.total,0), totalM=m.reduce((s,x)=>s+x.total,0), profitD=d.reduce((s,x)=>s+profitOfSale(x),0)-expD;
  const discD=d.reduce((s,x)=>s+Number(x.discount||0),0);
  return `<div class="grid four"><div class="card"><div class="muted">داهاتی ئەمڕۆ</div><div class="kpi">${money(totalD)}</div></div><div class="card"><div class="muted">قازانجی پاک</div><div class="kpi">${money(profitD)}</div></div><div class="card"><div class="muted">داشکاندن</div><div class="kpi">${money(discD)}</div></div><div class="card"><div class="muted">مانگ</div><div class="kpi">${money(totalM)}</div></div></div><div class="card" style="margin-top:14px"><h2>دوایین وەسلەکان</h2>${recentSalesTable(100)}</div>`;
}

/* SETTINGS */
function settingsHtml(){return `<div class="grid two"><div class="card"><h2>ڕێکخستن</h2><label>ناوی ڕێستۆرانت</label><input id="restaurantName" value="${data.user.restaurantName}"><label>مۆبایل</label><input id="phone" value="${data.user.phone}"><div class="row"><div><label>Service %</label><input id="servicePercent" type="number" value="${data.user.servicePercent}"></div><div><label>Tax %</label><input id="taxPercent" type="number" value="${data.user.taxPercent}"></div></div><label>وتەی وەسل</label><input id="receiptNote" value="${data.user.receiptNote}"><label>Password نوێ</label><input id="newPass"><button class="green" style="margin-top:12px" onclick="saveSettings()">هەڵگرتن</button></div><div class="card"><h2>Backup</h2><div class="actions"><button class="blue" onclick="exportBackup()">Export</button><button class="amber" onclick="byId('importFile').click()">Import</button><input id="importFile" class="hidden" type="file" accept=".json" onchange="importBackup(event)"></div><p class="muted">Backup هەفتانە بکە.</p><button class="red" onclick="resetAll()">Reset</button></div></div><div class="card" style="margin-top:14px"><h2>مێزەکان</h2><div class="row"><input id="newTableName" placeholder="مێزی 7"><button class="green" onclick="addTable()">زیادکردن</button></div><div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>ناو</th><th>حاڵەت</th><th></th></tr></thead><tbody>${data.tables.map(t=>`<tr><td>${t.name}</td><td>${t.status}</td><td><button class="red" onclick="deleteTable('${t.id}')">Delete</button></td></tr>`).join("")}</tbody></table></div></div>`;}
function saveSettings(){data.user.restaurantName=byId("restaurantName").value.trim()||"Restaurant POS Ultra";data.user.phone=byId("phone").value.trim();data.user.servicePercent=Number(byId("servicePercent").value||0);data.user.taxPercent=Number(byId("taxPercent").value||0);data.user.receiptNote=byId("receiptNote").value.trim();const np=byId("newPass").value;if(np)data.user.password=np;save();render();}
function addTable(){const name=byId("newTableName").value.trim(); if(!name)return alert("ناوی مێز بنووسە"); data.tables.push({id:crypto.randomUUID(),name,status:"free"}); save(); render();}
function deleteTable(id){if(order(id).items.length)return alert("سەرەتا Order ـەکە پاک بکە"); data.tables=data.tables.filter(t=>t.id!==id); delete data.orders[id]; save(); render();}
function exportBackup(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="restaurant-pos-ultra-backup.json";a.click();}
function importBackup(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);save();alert("Backup گەڕایەوە");render();}catch{alert("فایل هەڵەیە");}};r.readAsText(f);}
function resetAll(){if(confirm("دڵنیایت هەموو داتا بسڕدرێتەوە؟")){localStorage.removeItem(LS);data=loadData();state.selectedTable=null;render();}}

if("serviceWorker" in navigator){navigator.serviceWorker.register("./service-worker.js");}
render();
