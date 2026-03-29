import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { addDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d",
  storageBucket: "toko-online-8a68d.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// TAMPIL PRODUK
window.tampilProduk = async function(){
  const data = await getDocs(collection(db,"produk"));
  let html = "";

  data.forEach(doc=>{
    let p = doc.data();
    html += `
  <div class="card">
    <img src="${p.gambar}" style="width:100%; border-radius:10px;">
    <h4>${p.nama}</h4>
    <p>Rp${p.harga}</p>
    <button onclick="tambahKeCart('${p.nama}', ${p.harga})">
      Beli
    </button>
  </div>
`;
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
//tambah produk
window.tambahProduk = function(){
  let nama = document.getElementById("nama").value;
  let harga = document.getElementById("harga").value;

  if(!nama || !harga){
    alert("Isi dulu!");
    return;
  }

  addDoc(collection(db, "produk"), {
    nama: nama,
    harga: Number(harga)
  }).then(()=>{
    alert("Produk berhasil ditambah!");
  }).catch(err=>{
    alert("Error: " + err.message);
  });
}
// TAMPIL GAMBAR
let file = document.getElementById("gambar").files[0];
// SEMBUNYIIN CART
window.hideCart = function(){
  document.getElementById("cartPage").style.display = "none";
}
