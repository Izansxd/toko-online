import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE ---
const NOMOR_WA_ADMIN = "6282298627146"; // Nomor WhatsApp Kamu
const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

let allProducts = [];
let currentMinHarga = 0;
let currentMaxHarga = 999999999;

// --- 2. FUNGSI TAMPIL PRODUK ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  try {
    const dataSnap = await getDocs(collection(db, "produk"));
    allProducts = []; 
    dataSnap.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Update Dashboard Statistik (Jika di halaman Admin)
    const statTotal = document.getElementById("statTotal");
    const statSold = document.getElementById("statSold");
    if (statTotal && statSold) {
      statTotal.innerText = allProducts.length;
      statSold.innerText = allProducts.filter(p => p.status === "Sold").length;
    }

    window.searchProduk(); 
  } catch (error) {
    console.error(error);
    produkDiv.innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data.</p>`;
  }
};

// --- 3. FUNGSI SEARCH & FILTER (KOMBINASI GAME + KEYWORD + HARGA) ---
window.searchProduk = function() {
  const searchInput = document.getElementById("searchInput");
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  // Ambil kategori dari tombol filter kategori yang sedang aktif
  const activeCatBtn = document.querySelector('.filter-container:nth-of-type(1) .btn-filter.active');
  let kategoriAktif = activeCatBtn ? activeCatBtn.innerText.trim() : "Semua";
  
  // Normalisasi nama kategori agar cocok dengan database
  if(kategoriAktif === "MLBB") kategoriAktif = "Mobile Legends";
  if(kategoriAktif === "FF") kategoriAktif = "Free Fire";
  if(kategoriAktif === "PUBG") kategoriAktif = "PUBG Mobile";

  const filteredData = allProducts.filter(p => {
    const hargaProduk = Number(p.harga) || 0;
    const cocokKategori = (kategoriAktif === "Semua" || p.kategori === kategoriAktif);
    const cocokKeyword = (p.nama || "").toLowerCase().includes(keyword);
    const cocokHarga = (hargaProduk >= currentMinHarga && hargaProduk <= currentMaxHarga);
    
    return cocokKategori && cocokKeyword && cocokHarga;
  });

  renderHTML(filteredData);
};

// --- 4. FILTER RENTANG HARGA ---
window.filterHarga = function(el, min, max) {
  // Hanya hapus class active dari baris filter harga
  const parent = el.parentElement;
  parent.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  
  currentMinHarga = min;
  currentMaxHarga = max;
  window.searchProduk(); // Jalankan penyaringan ulang
};

// --- 5. RENDER HTML KE LAYAR ---
function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  const isAdmin = window.location.href.includes("admin.html");
  let html = "";

  data.forEach((p) => {
    const isSold = p.status === "Sold"; 
    const isPromo = p.isPromo === true; 
    const hargaFormat = Number(p.harga).toLocaleString('id-ID');
    const namaAman = p.nama.replace(/'/g, "\\'");
    
    if (isAdmin) {
      html += `
        <div class="card-admin">
          <img src="${p.gambar}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
          <div style="flex:1">
            <h4 style="margin:0; font-size:13px;">${p.nama}</h4>
            <p style="margin:0; color:#10b981; font-weight:700; font-size:12px;">Rp${hargaFormat} [${p.status}]</p>
          </div>
          <button onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${p.deskripsi}','${p.kategori}','${p.status}',${isPromo},'${p.hargaLama || ''}')" style="background:#3a7bd5; border:none; padding:8px; border-radius:5px; color:white;">✏️</button>
          <button onclick="hapusProduk('${p.id}')" style="background:#ef4444; border:none; padding:8px; border-radius:5px; color:white;">🗑️</button>
        </div>`;
    } else {
      html += `
        <div class="card">
          <div class="card-img-container">
            <img src="${p.gambar}">
            <div class="badge">${p.kategori}</div>
            ${isPromo ? `<div class="badge-promo">⚡ FLASH SALE</div>` : ''}
            ${isSold ? `<div class="sold-overlay"><div class="sold-label">SOLD OUT</div></div>` : ''}
          </div>
          <div class="card-info">
            <div style="display:flex; align-items:center; gap:5px;">
              <h4 style="font-size:14px; margin:0;">${p.nama}</h4>
              <span style="color:#38bdf8; font-size:14px;">🔵</span>
            </div>
            <div class="garansi-tag">🛡️ Garansi Anti-HB</div>
            <div class="harga">
                ${p.hargaLama ? `<span class="harga-lama">Rp${Number(p.hargaLama).toLocaleString('id-ID')}</span>` : ''}
                <span class="harga-baru">Rp${hargaFormat}</span>
            </div>
            <button class="btn-beli" ${isSold ? 'disabled' : `onclick="beliWhatsApp('${namaAman}', ${p.harga})"`}>
                ${isSold ? 'TERJUAL' : 'BELI SEKARANG'}
            </button>
          </div>
        </div>`;
    }
  });

  produkDiv.innerHTML = html || `<p style="text-align:center; color:#94a3b8; padding:20px;">Produk tidak ditemukan.</p>`;
}

// --- 6. FUNGSI ADMIN ---
window.submitProduk = async function() {
  const editId = document.getElementById("editId").value;
  const dataObj = {
    nama: document.getElementById("nama").value,
    harga: Number(document.getElementById("harga").value),
    hargaLama: document.getElementById("hargaLama").value ? Number(document.getElementById("hargaLama").value) : null,
    gambar: document.getElementById("gambar").value,
    deskripsi: document.getElementById("deskripsi").value,
    kategori: document.getElementById("kategori").value,
    status: document.getElementById("status").value,
    isPromo: document.getElementById("isPromo").checked
  };

  try {
    if (editId) {
      await updateDoc(doc(db, "produk", editId), dataObj);
    } else {
      await addDoc(collection(db, "produk"), dataObj);
    }
    location.reload();
  } catch (e) { alert("Error: " + e.message); }
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori, status, isPromo, hargaLama) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("hargaLama").value = hargaLama || "";
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("status").value = status;
  document.getElementById("isPromo").checked = isPromo;
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

window.hapusProduk = async function(id) {
  if (confirm("Hapus produk?")) {
    await deleteDoc(doc(db, "produk", id));
    location.reload();
  }
};

// --- 7. UTILITY ---
window.filterGame = (el, kat) => {
  // Hanya hapus class active dari baris filter kategori
  const parent = el.parentElement;
  parent.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  window.searchProduk();
};

window.beliWhatsApp = (nama, harga) => {
  const invoiceID = "FZ-" + Math.floor(1000 + Math.random() * 9000);
  const pesan = `*INVOICE FAZA STORE*\nID: ${invoiceID}\nProduk: ${nama}\nTotal: Rp${Number(harga).toLocaleString('id-ID')}\n\nSaya mau beli akun ini, Min!`;
  window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
};

// Jalankan saat load
tampilProduk();
