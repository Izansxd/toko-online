import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 1. Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// --- FUNGSI KERANJANG (Ditempel ke window agar bisa dipanggil onclick) ---

window.showCart = function() {
  console.log("Membuka keranjang...");
  const cartPage = document.getElementById("cartPage");
  if (cartPage) {
    cartPage.style.display = "block";
    renderCartItems(); // Fungsi pembantu untuk isi list
  }
};

window.hideCart = function() {
  const cartPage = document.getElementById("cartPage");
  if (cartPage) cartPage.style.display = "none";
};

window.tambahKeCart = function(nama, harga) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ nama, harga });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(nama + " masuk keranjang!");
};

// Fungsi pembantu untuk menggambar isi keranjang
function renderCartItems() {
  const cartDiv = document.getElementById("cart");
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";

  if (cart.length === 0) {
    html = "<p>Keranjang kosong</p>";
  } else {
    cart.forEach((p) => {
      html += `<p>${p.nama} - Rp${Number(p.harga).toLocaleString('id-ID')}</p>`;
    });
  }
  cartDiv.innerHTML = html;
}

// --- FUNGSI TAMPIL PRODUK ---

window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  const data = await getDocs(collection(db, "produk"));
  let html = "";
  
  data.forEach((docSnap) => {
    const p = docSnap.data();
    html += `
      <div class="card">
        <img src="${p.gambar}" style="width:100%; height:120px; object-fit:cover;">
        <h4>${p.nama}</h4>
        <p>Rp${Number(p.harga).toLocaleString('id-ID')}</p>
        <button onclick="tambahKeCart('${p.nama}', ${p.harga})">Beli</button>
      </div>`;
  });
  produkDiv.innerHTML = html;
};

// --- EKSEKUSI SAAT START ---
tampilProduk();
