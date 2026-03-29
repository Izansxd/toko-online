import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- KONFIGURASI ---
const NOMOR_WA_ADMIN = "6282298627146"; // Nomor kamu sudah saya pasang di sini

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// --- 1. FUNGSI TAMPIL PRODUK ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  const data = await getDocs(collection(db, "produk"));
  let html = "";
  const isAdmin = window.location.href.includes("admin.html");

  data.forEach((docSnap) => {
    const p = docSnap.data();
    const isSold = p.status === "Sold"; 
    const deskripsi = p.deskripsi || "Tidak ada detail spek.";
    const kategori = p.kategori || "Game";

    html += `
      <div class="card">
        <div class="card-img-container">
          <img src="${p.gambar}" alt="${p.nama}">
          <div class="badge">${kategori}</div>
          ${isSold ? `
            <div class="sold-overlay">
              <div class="sold-label">SOLD OUT</div>
            </div>` : ''}
        </div>
        <div class="card-info">
          <h4>${p.nama}</h4>
          <p class="deskripsi-teks">${deskripsi}</p>
          <p class="harga">Rp${Number(p.harga).toLocaleString('id-ID')}</p>
          
          ${isAdmin 
            ? `<button style="background:red; margin-bottom:5px;" onclick="hapusProduk('${docSnap.id}')">🗑️ Hapus</button>
               <button style="background:blue;" onclick="editProduk('${docSnap.id}','${p.nama}',${p.harga},'${p.gambar}','${deskripsi.replace(/'/g, "\\'")}','${kategori}','${p.status}')">✏️ Edit</button>` 
            : `<button ${isSold ? 'disabled' : `onclick="beliWhatsApp('${p.nama}')"`}>
                ${isSold ? 'SUDAH TERJUAL' : 'BELI SEKARANG'}
               </button>`}
        </div>
      </div>`;
  });
  produkDiv.innerHTML = html;
};

// --- 2. FUNGSI SIMPAN/UPDATE PRODUK ---
window.submitProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const gambar = document.getElementById("gambar").value;
  const deskripsi = document.getElementById("deskripsi").value;
  const kategori = document.getElementById("kategori").value; 
  const status = document.getElementById("status").value;     
  const editId = document.getElementById("editId").value;

  if (!nama || !harga || !gambar) return alert("Wajib isi Nama, Harga, dan Gambar!");

  try {
    const dataObj = { 
      nama, 
      harga: Number(harga), 
      gambar, 
      deskripsi, 
      kategori, 
      status 
    };

    if (editId) {
      await updateDoc(doc(db, "produk", editId), dataObj);
      alert("Data Akun Berhasil Diupdate!");
    } else {
      await addDoc(collection(db, "produk"), dataObj);
      alert("Akun Baru Berhasil Ditambahkan!");
    }
    location.reload();
  } catch (e) { 
    alert("Gagal menyimpan: " + e.message); 
  }
};

// --- 3. FUNGSI HAPUS ---
window.hapusProduk = async function(id) {
  if (confirm("Hapus data akun ini dari database?")) {
    await deleteDoc(doc(db, "produk", id));
    tampilProduk();
  }
};

// --- 4. FUNGSI EDIT ---
window.editProduk = (id, nama, harga, gambar, deskripsi, kategori, status) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori || "Mobile Legends";
  document.getElementById("status").value = status || "Ready";
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

// --- 5. FUNGSI WHATSAPP ---
window.beliWhatsApp = (nama) => {
  const pesan = `Halo Admin, saya tertarik untuk membeli akun: ${nama}. Apakah masih tersedia?`;
  window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
};

// Jalankan otomatis saat web dibuka
tampilProduk();
