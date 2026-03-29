import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// --- 1. TAMPIL PRODUK ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  try {
    const querySnapshot = await getDocs(collection(db, "produk"));
    let html = "";
    const isAdmin = window.location.href.includes("admin.html");

    querySnapshot.forEach((docSnap) => {
      const p = docSnap.data();
      html += `
        <div class="card">
          <img src="${p.gambar}" style="width:100%; height:120px; object-fit:cover; border-radius:8px;">
          <h4>${p.nama}</h4>
          <p>Rp${Number(p.harga).toLocaleString('id-ID')}</p>
          ${isAdmin 
            ? `<button style="background:red;" onclick="hapusProduk('${docSnap.id}')">🗑️ Hapus</button>
               <button style="background:blue; margin-top:5px;" onclick="editProduk('${docSnap.id}','${p.nama}',${p.harga},'${p.gambar}')">✏️ Edit</button>` 
            : `<button onclick="tambahKeCart('${p.nama}', ${p.harga})">Beli</button>`}
        </div>`;
    });
    produkDiv.innerHTML = html;
  } catch (e) {
    console.error("Error tampil produk: ", e);
  }
};

// --- 2. SUBMIT PRODUK (TAMBAH/UPDATE) ---
window.submitProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const gambar = document.getElementById("gambar").value;
  const editId = document.getElementById("editId").value;

  if (!nama || !harga || !gambar) return alert("Lengkapi semua data!");

  try {
    if (editId) {
      await updateDoc(doc(db, "produk", editId), { nama, harga: Number(harga), gambar });
      alert("Update Berhasil!");
    } else {
      await addDoc(collection(db, "produk"), { nama, harga: Number(harga), gambar });
      alert("Tambah Berhasil!");
    }
    location.reload(); 
  } catch (e) {
    alert("Gagal: " + e.message);
  }
};

// --- 3. HAPUS & EDIT ---
window.hapusProduk = async function(id) {
  if (confirm("Hapus produk ini?")) {
    await deleteDoc(doc(db, "produk", id));
    tampilProduk();
  }
};

window.editProduk = function(id, nama, harga, gambar) {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

// --- 4. KERANJANG (UNTUK INDEX.HTML) ---
window.tambahKeCart = function(nama, harga) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ nama, harga });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
};

window.showCart = function() {
  document.getElementById("cartPage").style.display = "block";
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = cart.length ? "" : "<p>Kosong</p>";
  cart.forEach(p => html += `<p>${p.nama} - Rp${p.harga.toLocaleString()}</p>`);
  document.getElementById("cart").innerHTML = html;
};

window.hideCart = () => document.getElementById("cartPage").style.display = "none";

// OTOMATIS JALANKAN TAMPIL PRODUK SAAT FILENYA DIMUAT
tampilProduk();
