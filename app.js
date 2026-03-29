import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// --- TAMPIL PRODUK ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  const data = await getDocs(collection(db, "produk"));
  let html = "";
  const isAdmin = window.location.href.includes("admin.html");

  data.forEach((docSnap) => {
    const p = docSnap.data();
    // Menambahkan fallback jika deskripsi kosong agar tidak muncul "undefined"
    const deskripsiSingkat = p.deskripsi || "Tidak ada deskripsi.";

    html += `
      <div class="card">
        <img src="${p.gambar}" alt="${p.nama}">
        <h4>${p.nama}</h4>
        <p style="font-size: 13px; color: #666; margin: 5px 0;">${deskripsiSingkat}</p>
        <p style="color: #27ae60; font-weight: bold;">Rp${Number(p.harga).toLocaleString('id-ID')}</p>
        ${isAdmin 
          ? `<button style="background:red; margin-bottom:5px;" onclick="hapusProduk('${docSnap.id}')">🗑️ Hapus</button>
             <button style="background:blue;" onclick="editProduk('${docSnap.id}','${p.nama}',${p.harga},'${p.gambar}', '${deskripsiSingkat.replace(/'/g, "\\'")}')">✏️ Edit</button>` 
          : `<button onclick="beliWhatsApp('${p.nama}')">Beli Sekarang</button>`}
      </div>`;
  });
  produkDiv.innerHTML = html;
};

// --- FUNGSI ADMIN (TAMBAH/UPDATE/HAPUS) ---
window.submitProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const gambar = document.getElementById("gambar").value;
  const deskripsi = document.getElementById("deskripsi").value; // Tambahan field deskripsi
  const editId = document.getElementById("editId").value;

  if (!nama || !harga || !gambar) return alert("Isi semua field utama!");

  try {
    const dataObj = { 
      nama, 
      harga: Number(harga), 
      gambar,
      deskripsi: deskripsi // Menyimpan deskripsi ke Firebase
    };

    if (editId) {
      await updateDoc(doc(db, "produk", editId), dataObj);
      alert("Berhasil diupdate!");
    } else {
      await addDoc(collection(db, "produk"), dataObj);
      alert("Berhasil ditambah!");
    }
    location.reload();
  } catch (e) { alert("Error: " + e.message); }
};

window.hapusProduk = async function(id) {
  if (confirm("Hapus produk?")) {
    await deleteDoc(doc(db, "produk", id));
    tampilProduk();
  }
};

window.editProduk = (id, nama, harga, gambar, deskripsi) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi; // Mengisi textarea deskripsi saat edit
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

// --- ALTERNATIF BELI (WHATSAPP) ---
window.beliWhatsApp = function(namaProduk) {
  const pesan = `Halo, saya mau beli produk: ${namaProduk}`;
  const linkWA = `https://wa.me/628123456789?text=${encodeURIComponent(pesan)}`; // Ganti nomor WA kamu
  window.open(linkWA, "_blank");
};

// Jalankan saat load
tampilProduk();
