import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "..." };
const app = initializeApp(firebaseConfig);
const db = getFirestore();

// TAMBAH PRODUK
window.tambahProduk = async function(){
  let nama = document.getElementById("nama").value;
  let harga = Number(document.getElementById("harga").value);
  let gambar = document.getElementById("gambar").value;
  if(!nama || !harga || !gambar){ alert("Isi semua!"); return; }
  await addDoc(collection(db,"produk"), { nama, harga, gambar });
  alert("Produk berhasil ditambah!");
  tampilProdukAdmin();
}

// HAPUS PRODUK
window.hapusProduk = async function(id){
  if(!confirm("Yakin mau hapus produk?")) return;
  await deleteDoc(doc(db,"produk",id));
  alert("Produk dihapus!");
  tampilProdukAdmin();
}

// TAMPIL PRODUK ADMIN
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
}  const data = await getDocs(collection(db,"produk"));
  let html = "";
  data.forEach(d=>{
    let p = d.data();
    html += `
      <div class="card">
        <h4>${p.nama}</h4>
        <p>Rp${p.harga}</p>
        <button onclick="editProduk('${d.id}','${p.nama}',${p.harga},'${p.gambar}')">✏️ Edit</button>
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
  let harga = Number(document.getElementById("harga").value);
  let gambar = document.getElementById("gambar").value;
  if(!nama || !harga || !gambar){ alert("Isi semua!"); return; }

  await addDoc(collection(db, "produk"), { nama, harga, gambar });
  alert("Produk berhasil ditambah!");
  tampilProdukAdmin();
}

// ==============================
// EDIT PRODUK
// ==============================
window.editProduk = async function(id, nama, harga, gambar){
  let newNama = prompt("Nama Produk:", nama);
  if(!newNama) return;
  let newHarga = prompt("Harga:", harga);
  if(!newHarga) return;
  let newGambar = prompt("Link Gambar:", gambar);
  if(!newGambar) return;

  await updateDoc(doc(db,"produk",id), { nama: newNama, harga: Number(newHarga), gambar: newGambar });
  alert("Produk berhasil diubah!");
  tampilProdukAdmin();
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
  let html = ""; let total = 0;
  cart.forEach(p => { html += `<p>${p.nama} - Rp${p.harga}</p>`; total += p.harga; });
  document.getElementById("cart").innerHTML = html;
  document.getElementById("totalHarga").innerHTML = `Total: Rp${total}`;
}

window.hideCart = function(){ document.getElementById("cart// TAMPIL PRODUK ADMIN
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
        <button onclick="editProduk('${d.id}','${p.nama}',${p.harga},'${p.gambar}')">✏️ Edit</button>
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
  let harga = Number(document.getElementById("harga").value);
  let gambar = document.getElementById("gambar").value;

  if(!nama || !harga || !gambar){
    alert("Isi semua!");
    return;
  }

  await addDoc(collection(db, "produk"), { nama, harga, gambar });
  alert("Produk berhasil ditambah!");
  tampilProdukAdmin(); // refresh admin panel
}

// ==============================
// EDIT PRODUK
// ==============================
window.editProduk = async function(id, nama, harga, gambar){
  let newNama = prompt("Nama Produk:", nama);
  if(!newNama) return;
  let newHarga = prompt("Harga:", harga);
  if(!newHarga) return;
  let newGambar = prompt("Link Gambar:", gambar);
  if(!newGambar) return;

  await updateDoc(doc(db,"produk",id), {
    nama: newNama,
    harga: Number(newHarga),
    gambar: newGambar
  });

  alert("Produk berhasil diubah!");
  tampilProdukAdmin();
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
  let total = 0;

  cart.forEach(p=>{
    html += `<p>${p.nama} - Rp${p.harga}</p>`;
    total += p.harga;
  });

  document.getElementById("cart").innerHTML = html;
  document.getElementById("totalHarga").innerHTML = `<b>Total: Rp${total}</b>`;
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
}// ==============================
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
}
