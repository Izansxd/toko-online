import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE ---
const NOMOR_WA_ADMIN = "6282298627146"; 
const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

let allProducts = [];
let pesananSekarang = {}; 

// --- 2. FUNGSI TAMPIL PRODUK (USER & ADMIN) ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  produkDiv.innerHTML = Array(4).fill('<div class="skeleton-card" style="height:200px; background:#1e293b; border-radius:15px; margin:10px;"></div>').join('');

  try {
    const data = await getDocs(collection(db, "produk"));
    allProducts = []; 
    data.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });
    window.searchProduk(); 
  } catch (error) {
    produkDiv.innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data.</p>`;
  }
};

// --- 3. FUNGSI SEARCH & FILTER ---
window.searchProduk = function() {
  const searchInput = document.getElementById("searchInput");
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  const activeBtn = document.querySelector('.btn-filter.active');
  let kategoriAktif = activeBtn ? activeBtn.innerText.trim() : "Semua";
  
  if(kategoriAktif === "MLBB") kategoriAktif = "Mobile Legends";
  if(kategoriAktif === "FF") kategoriAktif = "Free Fire";
  if(kategoriAktif === "PUBG") kategoriAktif = "PUBG Mobile";

  const filteredData = allProducts.filter(p => {
    const cocokKategori = (kategoriAktif === "Semua" || p.kategori === kategoriAktif);
    const namaProduk = (p.nama || "").toLowerCase();
    const cocokKeyword = namaProduk.includes(keyword);
    return cocokKategori && cocokKeyword;
  });

  renderHTML(filteredData);
};

// --- 4. RENDER HTML (DENGAN VERIFIED, GARANSI, & FLASH SALE) ---
function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  const isAdmin = window.location.href.includes("admin.html");
  let html = "";

  data.forEach((p) => {
    const isSold = p.status === "Sold"; 
    const isPromo = p.isPromo === true || p.isPromo === "true"; 
    const deskripsi = p.deskripsi || "Spek lengkap hubungi admin.";
    const namaAman = p.nama.replace(/'/g, "\\'");
    const hargaFormat = Number(p.harga).toLocaleString('id-ID');
    
    let hargaLamaHTML = "";
    if (p.hargaLama && Number(p.hargaLama) > 0) {
      hargaLamaHTML = `<span class="harga-lama">Rp${Number(p.hargaLama).toLocaleString('id-ID')}</span>`;
    }

    if (isAdmin) {
      html += `
        <div class="card-admin" style="background:#1e293b; padding:10px; border-radius:12px; margin-bottom:10px; display:flex; gap:10px; align-items:center;">
          <img src="${p.gambar}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
          <div style="flex:1">
            <h4 style="margin:0; font-size:14px;">${p.nama} ${isPromo ? '⚡' : ''}</h4>
            <p style="margin:0; color:#10b981; font-weight:700;">Rp${hargaFormat}</p>
          </div>
          <button onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${deskripsi}','${p.kategori}','${p.status}',${isPromo},'${p.hargaLama || ''}')" style="background:#3a7bd5; border:none; padding:8px; border-radius:5px; color:white;">✏️</button>
          <button onclick="hapusProduk('${p.id}')" style="background:#ef4444; border:none; padding:8px; border-radius:5px; color:white;">🗑️</button>
        </div>`;
    } else {
      html += `
        <div class="card">
          <div class="card-img-container">
            <img src="${p.gambar}" alt="${p.nama}">
            <div class="badge">${p.kategori || 'Game'}</div>
            ${isPromo ? `<div class="badge-promo">⚡ FLASH SALE</div>` : ''}
            ${isSold ? `<div class="sold-overlay"><div class="sold-label">SOLD OUT</div></div>` : ''}
          </div>
          <div class="card-info">
            <div class="title-wrapper" style="display:flex; align-items:center; gap:5px;">
              <h4 style="font-size:14px; margin:0;">${p.nama}</h4>
              <span style="color:#38bdf8; font-size:14px;">🔵</span>
            </div>
            <div class="garansi-tag" style="font-size:9px; color:#10b981; background:rgba(16,185,129,0.1); display:inline-block; padding:2px 5px; border-radius:4px; margin:5px 0;">🛡️ Garansi Anti-HB</div>
            <div class="harga" style="margin-top:5px;">
                ${hargaLamaHTML}
                <span class="harga-baru" style="display:block; font-size:16px; font-weight:700; color:#10b981;">Rp${hargaFormat}</span>
            </div>
            <button style="width:100%; margin-top:10px; padding:10px; border-radius:8px; border:none; background:linear-gradient(90deg, #3a7bd5, #00d2ff); color:white; font-weight:700;" ${isSold ? 'disabled' : `onclick="beliWhatsApp('${namaAman}', ${p.harga})"`}>
                ${isSold ? 'TERJUAL' : 'BELI SEKARANG'}
            </button>
          </div>
        </div>`;
    }
  });

  produkDiv.innerHTML = html || `<p style="text-align:center; width:100%; color:#94a3b8; padding:20px;">Produk tidak ditemukan.</p>`;
}

// --- 5. FUNGSI ADMIN (INPUT HARGA TITIK & SUBMIT) ---
window.submitProduk = async function() {
  const editId = document.getElementById("editId").value;
  const hargaMurni = document.getElementById("harga").value;
  const hargaLamaMurni = document.getElementById("hargaLama").value;

  const dataObj = {
    nama: document.getElementById("nama").value,
    harga: Number(hargaMurni),
    hargaLama: hargaLamaMurni ? Number(hargaLamaMurni) : null,
    gambar: document.getElementById("gambar").value,
    deskripsi: document.getElementById("deskripsi").value,
    kategori: document.getElementById("kategori").value,
    status: document.getElementById("status").value,
    isPromo: document.getElementById("isPromo").checked
  };

  if (!dataObj.nama || !dataObj.harga) return alert("Isi Nama & Harga!");

  try {
    if (editId) {
      await updateDoc(doc(db, "produk", editId), dataObj);
      alert("Berhasil Diupdate!");
    } else {
      await addDoc(collection(db, "produk"), dataObj);
      alert("Berhasil Ditambahkan!");
    }
    location.reload();
  } catch (e) { alert("Gagal: " + e.message); }
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori, status, isPromo, hargaLama) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("hargaLama").value = hargaLama || "";
  document.getElementById("displayHarga").value = new Intl.NumberFormat('id-ID').format(harga);
  document.getElementById("displayHargaLama").value = hargaLama ? new Intl.NumberFormat('id-ID').format(hargaLama) : "";
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("status").value = status;
  document.getElementById("isPromo").checked = (isPromo === true || isPromo === "true");
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

window.hapusProduk = async function(id) {
  if (confirm("Hapus akun ini?")) {
    await deleteDoc(doc(db, "produk", id));
    location.reload();
  }
};

// --- 6. FUNGSI WA & INVOICE ---
window.beliWhatsApp = (nama, harga) => {
  pesananSekarang = { nama, harga };
  const hargaFormat = Number(harga).toLocaleString('id-ID');
  const isiStruk = document.getElementById("isiStruk");
  if(isiStruk) {
      isiStruk.innerHTML = `
        <div style="display:flex; justify-content:space-between"><span>Akun:</span> <b>${nama}</b></div>
        <div style="display:flex; justify-content:space-between"><span>Harga:</span> <b>Rp${hargaFormat}</b></div>
        <hr style="border:1px dashed #ccc; margin:10px 0">
        <div style="display:flex; justify-content:space-between"><span>Total:</span> <b style="color:#10b981">Rp${hargaFormat}</b></div>
      `;
      document.getElementById("modalStruk").style.display = "flex";
  }
};

window.kirimInvoiceWA = () => {
  const metode = document.getElementById("metodeBayar").value;
  const invoiceID = "FZ-" + Math.floor(1000 + Math.random() * 9000);
  const pesan = `*INVOICE FAZA STORE*\nID: ${invoiceID}\nProduk: ${pesananSekarang.nama}\nTotal: Rp${Number(pesananSekarang.harga).toLocaleString('id-ID')}\nMetode: ${metode}\n\nSaya mau bayar, min!`;
  window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
};

// --- 7. UTILITY (TUTUP MODAL, DRAWER, DLL) ---
window.tutupStruk = () => document.getElementById("modalStruk").style.display = "none";
window.filterGame = (el, kat) => {
  document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  window.searchProduk();
};

// Inisialisasi
tampilProduk();
