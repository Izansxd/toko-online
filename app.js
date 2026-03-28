import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// TAMPIL PRODUK
window.tampilProduk = async function(){
  const data = await getDocs(collection(db,"produk"));
  let html = "";

  data.forEach(doc=>{
    let p = doc.data();
    html += `<p>${p.nama} - Rp${p.harga}
    <button onclick="tambahKeCart('${p.nama}', ${p.harga})">Beli</button></p>`;
  });

  document.getElementById("produk").innerHTML = html;
}

// CART
window.tambahKeCart = function(nama, harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama, harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

// TAMPIL CART
window.showCart = function(){
  document.getElementById("cartPage").style.display = "block";

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";

  cart.forEach(p=>{
    html += `<p>${p.nama} - Rp${p.harga}</p>`;
  });

  document.getElementById("cart").innerHTML = html;
}

// SEMBUNYIIN CART
window.hideCart = function(){
  document.getElementById("cartPage").style.display = "none";
}
