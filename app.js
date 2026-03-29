import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// ==============================
// TAMPIL PRODUK HALAMAN TOKO
// ==============================
window.tampilProduk = async function(){
  const data = await getDocs(collection(db,"produk"));
  let html = "";
  data.forEach(d => {
    const p = d.data();
    html += `
      <div class="card">
        <img src="${p.gambar || 'https://via.placeholder.com/150'}" style="width:100%; border-radius:10px;">
        <h4>${p.nama}</h4>
        <p>Rp${p.harga}</p>
        <button onclick="tambahKeCart('${p.nama}', ${p.harga})">Beli</button>
      </div>
    `;
  });
  document.getElementById("produk").innerHTML = html;
}

// ==============================
// KERANJANG
// ==============================
window.tambahKeCart = function(nama,harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama,harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

window.showCart = function(){
  document.getElementById("cartPage").style.display = "block";
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";
  let total = 0;
  cart.forEach(p => {
    html += `<p>${p.nama} - Rp${p.harga}</p>`;
    total += p.harga;
  });
  document.getElementById("cart").innerHTML = html;
  document.getElementById("totalHarga").innerHTML = `Total: Rp${total}`;
}

window.hideCart = function(){ document.getElementById("cartPage").style.display = "none"; }

// ==============================
// ADMIN - TAMBAH PRODUK
// ==============================
window.tambahProduk = async function(){
  const nama = document.getElementById("nama").value;
  const harga = Number(document.getElementById("harga").value);
  const gambar = document.getElementById("gambar").value;
  if(!nama || !harga || !gambar){ alert("Isi semua!"); return; }

  await addDoc(collection(db,"produk"), { nama,harga,gambar });
  alert("Produk berhasil ditambah!");
  tampilProdukAdmin();
}

// ==============================
// ADMIN - HAPUS PRODUK
// ==============================
window.hapusProduk = async function(id){
  if(!confirm("Yakin mau hapus produk?")) return;
  await deleteDoc(doc(db,"produk",id));
  alert("Produk dihapus!");
  tampilProdukAdmin();
}

// ==============================
// ADMIN - TAMPIL PRODUK
// ==============================
window.tampilProdukAdmin = async function(){
  const data = await getDocs(collection(db,"produk"));
  let html = "";
  data.forEach(d => {
    const p = d.data();
    html += `
      <div class="card">
        <h4>${p.nama}</h4>
        <p>Rp${p.harga}</p>
        <button onclick="hapusProduk('${d.id}')">🗑️ Hapus</button>
      </div>
    `;
  });
  document.getElementById("produk").innerHTML = html;
}window.tampilProdukAdmin = async function() {
  const data = await getDocs(collection(db,"produk"));
  let html = "";
  data.forEach(d => {
    const p = d.data();
    html += `
      <div class="card">
        <h4>${p.nama}</h4>
        <p>Rp${p.harga}</p>
        <button onclick="hapusProduk('${d.id}')">🗑️ Hapus</button>
      </div>
    `;
  });
  document.getElementById("produk").innerHTML = html;
}
