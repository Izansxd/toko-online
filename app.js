import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- KONFIGURASI ---
const NOMOR_WA_ADMIN = "6282298627146"; 

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Variabel global untuk menampung data
let allProducts = [];

// --- 1. FUNGSI TAMPIL PRODUK ---
window.tampilProduk = async function(kategoriFilter = "Semua") {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  // Selalu ambil data terbaru jika allProducts masih kosong
  if (allProducts.length === 0) {
    const data = await getDocs(collection(db, "produk"));
    allProducts = []; 
    data.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });
  }

  let html = "";
  const isAdmin = window.location.href.includes("admin.html");

  // Filter data berdasarkan kategori
  const filteredData = kategoriFilter === "Semua" 
    ? allProducts 
    : allProducts.filter(p => p.kategori === kategoriFilter);

  filteredData.forEach((p) => {
    const isSold = p.status === "Sold"; 
    const deskripsi = p.deskripsi || "Tidak ada detail spek.";
    const kategori = p.kategori || "Game";

    html += `
      <div class="card">
        <div class="card-img-container">
          <img src="${p.gambar}" alt="${p.nama}">
          <div class="badge">${kategori}</div>
          ${isSold ? `<div class="sold-overlay"><div class="sold-label">SOLD OUT</div></div>` : ''}
        </div>
        <div class="card-info">
          <h4>${p.nama}</h4>
          <p class="deskripsi-teks">${deskripsi}</p>
          <p class="harga">Rp${Number(p.harga).toLocaleString('id-ID')}</p>
          
          ${isAdmin 
            ? `<button style="background:red; margin-bottom:5px;" onclick="hapusProduk('${p.id}')">🗑️ Hapus</button>
               <button style="background:blue;" onclick="editProduk('${p.id}','${p.nama}',${p.harga},'${p.gambar}','${deskripsi.replace(/'/g, "\\'")}','${kategori}','${p.status}')">✏️ Edit</button>` 
            : `<button ${isSold ? 'disabled' : `onclick="beliWhatsApp('${p.nama}')"`}>
                ${isSold ? 'SUDAH TERJUAL' : 'BELI SEKARANG'}
               </button>`}
        </div>
      </div>`;
  });

  produkDiv.innerHTML = html || `<p style="text-align:center; width:100%; color:#94a3b8; padding:20px;">Belum ada akun di kategori ini.</p>`;
};

// --- FUNGSI TRIGGER FILTER (PERBAIKAN UTAMA) ---
window.filterGame = function(kategori) {
  console.log("Filter diklik:", kategori); // Untuk ngecek di console

  // 1. Update warna tombol aktif
  const buttons = document.querySelectorAll('.btn-filter');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    
    // Ambil teks tombol dan bersihkan
    const btnText = btn.innerText.trim();
    
    // Logika pencocokan teks tombol dengan kategori database
    if (kategori === "Semua" && btnText === "Semua") btn.classList.add('active');
    if (kategori === "Mobile Legends" && btnText === "MLBB") btn.classList.add('active');
    if (kategori === "Free Fire" && btnText === "FF") btn.classList.add('active');
    if (kategori === "PUBG Mobile" && btnText === "PUBG") btn.classList.add('active');
    if (kategori === "Lainnya" && btnText === "Lainnya") btn.classList.add('active');
  });

  // 2. Jalankan tampilProduk dengan kategori yang dipilih
  window.tampilProduk(kategori);
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
    const dataObj = { nama, harga: Number(harga), gambar, deskripsi, kategori, status };
    if (editId) {
      await updateDoc(doc(db, "produk", editId), dataObj);
      alert("Data Berhasil Diupdate!");
    } else {
      await addDoc(collection(db, "produk"), dataObj);
      alert("Akun Berhasil Ditambahkan!");
    }
    location.reload();
  } catch (e) { alert("Gagal menyimpan: " + e.message); }
};

// --- 3. FUNGSI HAPUS ---
window.hapusProduk = async function(id) {
  if (confirm("Hapus data akun ini?")) {
    await deleteDoc(doc(db, "produk", id));
    location.reload();
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

// Jalankan saat pertama buka
tampilProduk();
