import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Tambah Produk
window.tambahProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = Number(document.getElementById("harga").value);
  const gambar = document.getElementById("gambar").value;

  if(!nama || !harga || !gambar){
    alert("Isi semua!");
    return;
  }

  await addDoc(collection(db, "produk"), { nama, harga, gambar });
  alert("Produk berhasil ditambah!");
  tampilProdukAdmin();
}

// Hapus Produk
window.hapusProduk = async function(id) {
  if(!confirm("Yakin mau hapus produk?")) return;
  await deleteDoc(doc(db,"produk",id));
  alert("Produk dihapus!");
  tampilProdukAdmin();
}

// Tampil Produk Admin
window.tampilProdukAdmin = async function() {
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
