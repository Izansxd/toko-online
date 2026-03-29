import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ====== KONFIGURASI FIREBASE ======
const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// ==============================
// TAMPIL PRODUK UNTUK TOKO
// ==============================
window.tampilProduk = async function(){
  const data = await getDocs(collection(db,"produk"));
  let html = "";

  data.forEach(d=>{
    let p = d.data();
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
// TAMPIL PRODUK UNTUK ADMIN
// ==============================
window.tampilProdukAdmin = async function(){
  const data = await getDocs(collection(db,"produk"));
  let html = "";

  data.forEach(d=>{
    let p = d.data();
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

// ==============================
// TAMBAH PRODUK
// ==============================
window.tambahProduk = async function(){
  let nama = document.getElementById("nama").value;
  let harga = document.getElementById("harga").value;
  let gambar = document.getElementById("gambar").value;

  if(!nama || !harga || !gambar){
    alert("Isi semua!");
    return;
  }

  await addDoc(collection(db, "produk"), {
    nama: nama,
    harga: Number(harga),
    gambar: gambar
  });

  alert("Produk berhasil ditambah!");
  tampilProdukAdmin(); // refresh admin panel
}

// ==============================
// CART
// ==============================
window.tambahKeCart = function(nama, harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama, harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

window.showCart = function(){
  document.getElementById("cartPage").style.display = "block";

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";

  cart.forEach(p=>{
    html += `<p>${p.nama} - Rp${p.harga}</p>`;
  });

  document.getElementById("cart").innerHTML = html;
}

window.hideCart = function(){
  document.getElementById("cartPage").style.display = "none";
}

// ==============================
// HAPUS PRODUK (ADMIN)
// ==============================
window.hapusProduk = async function(id){
  let yakin = confirm("Yakin mau hapus produk?");
  if(!yakin) return;

  await deleteDoc(doc(db, "produk", id));

  alert("Produk dihapus!");
  tampilProdukAdmin(); // refresh admin panel
}}
// TAMBAH PRODUK (PAKAI LINK GAMBAR)
window.tambahProduk = async function(){
  let nama = document.getElementById("nama").value;
  let harga = document.getElementById("harga").value;
  let gambar = document.getElementById("gambar").value;

  if(!nama || !harga || !gambar){
    alert("Isi semua!");
    return;
  }

  await addDoc(collection(db, "produk"), {
    nama: nama,
    harga: Number(harga),
    gambar: gambar
  });

  alert("Produk berhasil ditambah!");
}

// CART
window.tambahKeCart = function(nama, harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama, harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

// CART TAMPIL
window.showCart = function(){
  document.getElementById("cartPage").style.display = "block";

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";

  cart.forEach(p=>{
    html += `<p>${p.nama} - Rp${p.harga}</p>`;
  });

  document.getElementById("cart").innerHTML = html;
}
// HAPUS PRODUK
window.hapusProduk = async function(id){
  let yakin = confirm("Yakin mau hapus produk?");
  if(!yakin) return;

  await deleteDoc(doc(db, "produk", id));

  alert("Produk dihapus!");
  tampilProduk();
}
// SEMBUNYIIN CART
window.hideCart = function(){
  document.getElementById("cartPage").style.display = "none";
}
