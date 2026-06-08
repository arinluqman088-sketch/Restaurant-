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
    username: "admin",
    password: "1234",
    captainPassword: "1111",
    kitchenPassword: "2222",
    restaurantName: "Restaurant POS Cloud",
    phone: "0770 000 0000",
    servicePercent: 0,
    taxPercent: 0,
    receiptNote: "Thank you for visiting us"
  },

  tables: [
    {id:"T1", name:"Table 1", status:"free", sort:1},
    {id:"T2", name:"Table 2", status:"free", sort:2},
    {id:"T3", name:"Table 3", status:"free", sort:3},
    {id:"T4", name:"Table 4", status:"free", sort:4},
    {id:"T5", name:"Table 5", status:"free", sort:5},
    {id:"T6", name:"Table 6", status:"free", sort:6},
    {id:"TA", name:"Takeaway", status:"free", sort:7},
    {id:"DL", name:"Delivery", status:"free", sort:8}
  ],

  menu: [
    {id:"F001", code:"F001", name:"Burger", category:"Food", price:5000, cost:3000, stock:50, minStock:5, sort:1},
    {id:"F002", code:"F002", name:"Pizza", category:"Food", price:7000, cost:4200, stock:40, minStock:5, sort:2},
    {id:"F003", code:"F003", name:"Chicken", category:"Food", price:8000, cost:5000, stock:35, minStock:5, sort:3},
    {id:"D001", code:"D001", name:"Water", category:"Drinks", price:500, cost:250, stock:100, minStock:15, sort:4},
    {id:"D002", code:"D002", name:"Pepsi", category:"Drinks", price:1000, cost:650, stock:80, minStock:10, sort:5},
    {id:"S001", code:"S001", name:"Dessert", category:"Dessert", price:3500, cost:1800, stock:25, minStock:5, sort:6}
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
  selectedTable: null,
  editingItem: null,
  selectedCat: "",
  ready: false,
  error: ""
};

let unsubscribers = [];

function settingsRef(){
  return doc(db, ...PATH, "settings", "main");
}

function colRef(name){
  return collection(db, ...PATH, name);
}

function docRef(name,id){
  return doc(db, ...PATH, name, id);
}

function clean(obj){
  return JSON.parse(JSON.stringify(obj));
}

function byId(id){
  return document.getElementById(id);
}

function money(n){
  return Number(n || 0).toLocaleString() + " IQD";
}

function today(){
  return new Date().toISOString().slice(0,10);
}

function month(){
  return new Date().toISOString().slice(0,7);
}

function tableById(id){
  return data.tables.find(t => t.id === id);
}

function newOrder(tableId){
  return {
    tableId,
    items: [],
    discount: 0,
    type: "dinein",
    status: "open",
    note: "",
    customerName: "",
    customerPhone: "",
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
}

function order(id){
  return data.orders[id] || newOrder(id);
}

function itemsTotal(o){
  return (o.items || []).reduce((s,i) => s + i.qty * i.price, 0);
}

function serviceAmount(o){
  return Math.round(itemsTotal(o) * Number(data.user.servicePercent || 0) / 100);
}

function taxAmount(o){
  return Math.round((itemsTotal(o) + serviceAmount(o) - Number(o.discount || 0)) * Number(data.user.taxPercent || 0) / 100);
}

function orderTotal(o){
  return Math.max(0, itemsTotal(o) + serviceAmount(o) + taxAmount(o) - Number(o.discount || 0));
}

function profitOfSale(s){
  return (s.items || []).reduce((a,i) => a + (i.price - i