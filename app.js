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

let allProducts = [];

// --- 1. FUNGSI TAMPIL PRODUK ---
window.tampilProduk = async function(kategoriFilter = "Semua") {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  // Skeleton Loading
  produkDiv.innerHTML = Array(4).fill('<div class="skeleton skeleton-card"></div>').join('');

  if (allProducts.length === 0) {
    try {
      const data = await getDocs(collection(db, "produk"));
      allProducts = []; 
      data.forEach(docSnap => {
        allProducts.push({ id: docSnap.id, ...docSnap.data() });
      });
    } catch (error) {
      produkDiv.innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data.</p>`;
      return;
    }
  }

  // Langsung jalankan filter pencarian/kategori
  window.searchProduk(); 
};

// --- 2. FUNGSI SEARCH (REAL-TIME) ---
window.searchProduk = function() {
  const searchInput = document.getElementById("searchInput");
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  const activeBtn = document.querySelector('.btn-filter.active');
  let kategoriAktif = activeBtn ? activeBtn.innerText.trim() : "Semua";
  
  // Normalisasi Nama Kategori
  if(kategoriAktif === "MLBB") kategoriAktif = "Mobile Legends";
  if(kategoriAktif === "FF") kategoriAktif = "Free Fire";
  if(kategoriAktif === "PUBG") kategoriAktif = "PUBG Mobile";

  const filteredData = allProducts.filter(p => {
    const cocokKategori = (kategoriAktif === "Semua" || p.kategori === kategoriAktif);
    const namaProduk = (p.nama || "").toLowerCase();
    const deskripsiProduk = (p.deskripsi || "").toLowerCase();
    const cocokKeyword = namaProduk.includes(keyword) || deskripsiProduk.includes(keyword);
    return cocokKategori && cocokKeyword;
  });

  renderHTML(filteredData);
};

// --- 3. FUNGSI RENDER KE LAYAR ---
function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  const isAdmin = window.location.href.includes("admin.html");
  let html = "";

  data.forEach((p) => {
    const isSold = p.status === "Sold"; 
    const deskripsi = p.deskripsi || "Tidak ada detail spek.";
    const namaAman = p.nama.replace(/'/g, "\\'");
    const deskripsiAman = deskripsi.toString().replace(/'/g, "\\'").replace(/\n/g, " ");

    html += `
      <div class="card">
        <div class="card-img-container">
          <img src="${p.gambar}" alt="${p.nama}">
          <div class="badge">${p.kategori || 'Game'}</div>
          ${isSold ? `<div class="sold-overlay"><div class="sold-label">SOLD OUT</div></div>` : ''}
        </div>
        <div class="card-info">
          <h4>${p.nama}</h4>
          <p class="deskripsi-teks">${deskripsi}</p>
          <p class="harga">Rp${Number(p.harga).toLocaleString('id-ID')}</p>
          ${isAdmin 
            ? `<button style="background:red; margin-bottom:5px;" onclick="hapusProduk('${p.id}')">🗑️ Hapus</button>
               <button style="background:blue;" onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${deskripsiAman}','${p.kategori}','${p.status}')">✏️ Edit</button>` 
            : `<button ${isSold ? 'disabled' : `onclick="beliWhatsApp('${namaAman}', ${p.harga})"`}>
                ${isSold ? 'SUDAH TERJUAL' : 'BELI SEKARANG'}
               </button>`}
        </div>
      </div>`;
  });

  produkDiv.innerHTML = html || `<p style="text-align:center; width:100%; color:#94a3b8; padding:20px;">Produk tidak ditemukan.</p>`;
}

// --- 4. FUNGSI FILTER & ADMIN ---
window.filterGame = function(kategori) {
  const buttons = document.querySelectorAll('.btn-filter');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    const btnText = btn.innerText.trim();
    if (kategori === "Semua" && btnText === "Semua") btn.classList.add('active');
    if (kategori === "Mobile Legends" && btnText === "MLBB") btn.classList.add('active');
    if (kategori === "Free Fire" && btnText === "FF") btn.classList.add('active');
    if (kategori === "PUBG Mobile" && btnText === "PUBG") btn.classList.add('active');
    if (kategori === "Lainnya" && btnText === "Lainnya") btn.classList.add('active');
  });
  
  if(document.getElementById("searchInput")) document.getElementById("searchInput").value = "";
  window.searchProduk(); 
};

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

window.hapusProduk = async function(id) {
  if (confirm("Hapus data akun ini?")) {
    await deleteDoc(doc(db, "produk", id));
    location.reload();
  }
};

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
window.beliWhatsApp = (nama, harga) => {
  const hargaFormatted = Number(harga).toLocaleString('id-ID');
  const pesan = `Halo Admin 👋, saya mau beli akun ini:

📌 *Produk:* ${nama}
💰 *Harga:* Rp${hargaFormatted}

Apakah akun ini masih ready?`;

  window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
};

// JALANKAN AWAL
tampilProduk();
