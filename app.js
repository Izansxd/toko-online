import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// ================= TAMPIL PRODUK =================
window.tampilProduk = async function() {
  const data = await getDocs(collection(db, "produk"));
  const produkDiv = document.getElementById("produk");
  let html = "";
  const isAdmin = window.location.href.toLowerCase().includes("admin.html");

  data.forEach(docSnap => {
    const p = docSnap.data();
    html += `
      <div class="card">
        <img src="${p.gambar}" alt="${p.nama}">
        <h4>${p.nama}</h4>
        <p>Rp${p.harga.toLocaleString('id-ID')}</p>
        ${isAdmin 
          ? `<button class="hapus-btn" onclick="hapusProduk('${docSnap.id}')">🗑️ Hapus</button>
             <button style="background: blue; color:white; margin-top:5px;"
                     onclick="editProduk('${docSnap.id}','${p.nama}',${p.harga},'${p.gambar}')">✏️ Edit</button>` 
          : `<button onclick="tambahKeCart('${p.nama}', ${p.harga})">Beli</button>`}
      </div>
    `;
  });

  produkDiv.innerHTML = html;
}

// ================= TAMBAH / UPDATE PRODUK =================
window.submitProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const gambar = document.getElementById("gambar").value;
  const editId = document.getElementById("editId").value;

  if (!nama || !harga || !gambar) {
    alert("Isi semua field!");
    return;
  }

  if (editId) {
    // UPDATE produk
    await updateDoc(doc(db, "produk", editId), {
      nama,
      harga: Number(harga),
      gambar
    });
    alert("Produk berhasil diupdate!");
  } else {
    // TAMBAH produk baru
    await addDoc(collection(db, "produk"), {
      nama,
      harga: Number(harga),
      gambar
    });
    alert("Produk berhasil ditambah!");
  }

  // Reset form
  document.getElementById("nama").value = "";
  document.getElementById("harga").value = "";
  document.getElementById("gambar").value = "";
  document.getElementById("editId").value = "";

  tampilProduk(); // refresh daftar produk
}

// ================= HAPUS PRODUK =================
window.hapusProduk = async function(id) {
  if(!window.location.href.toLowerCase().includes("admin.html")){
    alert("Hanya admin yang bisa menghapus produk!");
    return;
  }

  if(confirm("Yakin mau hapus produk ini?")){
    await deleteDoc(doc(db, "produk", id));
    tampilProduk();
  }
}

// ================= EDIT PRODUK =================
window.editProduk = function(id, nama, harga, gambar) {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  document.getElementById("editId").value = id;
}

// ================= CART =================
window.tambahKeCart = function(nama, harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama, harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

window.showCart = function(){
  const cartPage = document.getElementById("cartPage");
  cartPage.style.display = "block";

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";

  if(cart.length === 0){
    html = "<p>Keranjang kosong</p>";
  } else {
    cart.forEach(p=>{
      html += `<p>${p.nama} - Rp${p.harga.toLocaleString('id-ID')}</p>`;
    });
  }

  document.getElementById("cart").innerHTML = html;
}

window.hideCart = function(){
  document.getElementById("cartPage").style.display = "none";
}    await addDoc(collection(db, "produk"), {
      nama,
      harga: Number(harga),
      gambar
    });
    alert("Produk berhasil ditambah!");
  }

  // Reset form
  document.getElementById("nama").value = "";
  document.getElementById("harga").value = "";
  document.getElementById("gambar").value = "";
  document.getElementById("editId").value = "";

  tampilProduk(); // refresh daftar produk
}

// ================= HAPUS PRODUK =================
window.hapusProduk = async function(id) {
  if(!window.location.href.toLowerCase().includes("admin.html")){
    alert("Hanya admin yang bisa menghapus produk!");
    return;
  }

  if(confirm("Yakin mau hapus produk ini?")){
    await deleteDoc(doc(db, "produk", id));
    tampilProduk();
  }
}

// ================= EDIT PRODUK =================
window.editProduk = function(id, nama, harga, gambar) {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  document.getElementById("editId").value = id;
}

// ================= CART =================
window.tambahKeCart = function(nama, harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama, harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

window.showCart = function(){
  const cartPage = document.getElementById("cartPage");
  cartPage.style.display = "block";

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";

  if(cart.length === 0){
    html = "<p>Keranjang kosong</p>";
  } else {
    cart.forEach(p=>{
      html += `<p>${p.nama} - Rp${p.harga.toLocaleString('id-ID')}</p>`;
    });
  }

  document.getElementById("cart").innerHTML = html;
}

window.hideCart = function(){
  document.getElementById("cartPage").style.display = "none";
}  produkDiv.innerHTML = html;
}

// ================= TAMBAH / UPDATE PRODUK =================
window.submitProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const gambar = document.getElementById("gambar").value;
  const editId = document.getElementById("editId")?.value;

  if (!nama || !harga || !gambar) {
    alert("Isi semua field!");
    return;
  }

  if (editId) {
    // UPDATE produk
    await updateDoc(doc(db, "produk", editId), {
      nama,
      harga: Number(harga),
      gambar
    });
    alert("Produk berhasil diupdate!");
  } else {
    // TAMBAH produk baru
    await addDoc(collection(db, "produk"), {
      nama,
      harga: Number(harga),
      gambar
    });
    alert("Produk berhasil ditambah!");
  }

  // Reset form
  document.getElementById("nama").value = "";
  document.getElementById("harga").value = "";
  document.getElementById("gambar").value = "";
  if(document.getElementById("editId")) document.getElementById("editId").value = "";

  tampilProduk(); // refresh produk
}

// ================= HAPUS PRODUK =================
window.hapusProduk = async function(id) {
  if(!window.location.href.toLowerCase().includes("admin.html")){
    alert("Hanya admin yang bisa menghapus produk!");
    return;
  }

  if(confirm("Yakin mau hapus produk ini?")){
    await deleteDoc(doc(db, "produk", id));
    tampilProduk();
  }
}

// ================= EDIT PRODUK =================
window.editProduk = function(id, nama, harga, gambar) {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  if(document.getElementById("editId")) document.getElementById("editId").value = id;
}

// ================= CART =================
window.tambahKeCart = function(nama, harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama, harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

window.showCart = function(){
  const cartPage = document.getElementById("cartPage");
  cartPage.style.display = "block";

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";

  if(cart.length === 0){
    html = "<p>Keranjang kosong</p>";
  } else {
    cart.forEach(p=>{
      html += `<p>${p.nama} - Rp${p.harga.toLocaleString('id-ID')}</p>`;
    });
  }

  document.getElementById("cart").innerHTML = html;
}

window.hideCart = function(){
  document.getElementById("cartPage").style.display = "none";
}// ================= TAMBAH PRODUK =================
window.tambahProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const gambar = document.getElementById("gambar").value;

  if(!nama || !harga || !gambar){
    alert("Isi semua field!");
    return;
  }

  await addDoc(collection(db, "produk"), {
    nama,
    harga: Number(harga),
    gambar
  });

  alert("Produk berhasil ditambah!");
  document.getElementById("nama").value = "";
  document.getElementById("harga").value = "";
  document.getElementById("gambar").value = "";

  tampilProduk(); // refresh produk
}

// ================= HAPUS PRODUK =================
window.hapusProduk = async function(id) {
  if(!window.location.href.toLowerCase().includes("admin.html")){
    alert("Hanya admin yang bisa menghapus produk!");
    return;
  }

  if(confirm("Yakin mau hapus produk ini?")){
    await deleteDoc(doc(db, "produk", id));
    tampilProduk();
  }
}

// ================= CART =================
window.tambahKeCart = function(nama, harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama, harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

window.showCart = function(){
  const cartPage = document.getElementById("cartPage");
  cartPage.style.display = "block";

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";

  if(cart.length === 0){
    html = "<p>Keranjang kosong</p>";
  } else {
    cart.forEach(p=>{
      html += `<p>${p.nama} - Rp${p.harga.toLocaleString('id-ID')}</p>`;
    });
  }

  document.getElementById("cart").innerHTML = html;
}

window.hideCart = function(){
  document.getElementById("cartPage").style.display = "none";
}
