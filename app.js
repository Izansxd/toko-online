import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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
let currentMinHarga = 0;
let currentMaxHarga = 999999999;

// --- 2. FUNGSI TAMPIL PRODUK & TESTIMONI ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  try {
    // Muat Produk
    const dataSnap = await getDocs(collection(db, "produk"));
    allProducts = []; 
    dataSnap.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Muat Pengumuman (Tampil di Marquee)
    const infoSnap = await getDoc(doc(db, "pengaturan", "toko"));
    if (infoSnap.exists()) {
      document.getElementById("isiPengumuman").innerText = infoSnap.data().pengumuman;
    }

    // Update Dashboard Statistik (Jika di Admin)
    const statTotal = document.getElementById("statTotal");
    const statSold = document.getElementById("statSold");
    if (statTotal && statSold) {
      statTotal.innerText = allProducts.length;
      statSold.innerText = allProducts.filter(p => p.status === "Sold").length;
    }

    window.searchProduk(); 
    muatTestimoni(); // Panggil fungsi testimoni
  } catch (error) {
    console.error(error);
  }
};

async function muatTestimoni() {
  const testiDiv = document.getElementById("list-testimoni");
  if (!testiDiv) return;
  try {
    const snap = await getDocs(collection(db, "testimoni"));
    let html = "";
    snap.forEach(d => {
      html += `<div class="card-testi"><img src="${d.data().gambar}" loading="lazy"></div>`;
    });
    testiDiv.innerHTML = html || "<p style='color:#94a3b8; font-size:12px;'>Belum ada testimoni.</p>";
  } catch (e) { console.error("Gagal muat testi:", e); }
}

// --- 3. FUNGSI SEARCH & FILTER ---
window.searchProduk = function() {
  const searchInput = document.getElementById("searchInput");
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const activeCatBtn = document.querySelector('.filter-container:nth-of-type(1) .btn-filter.active');
  let kategoriAktif = activeCatBtn ? activeCatBtn.innerText.trim() : "Semua";
  
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

window.filterHarga = function(el, min, max) {
  el.parentElement.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentMinHarga = min;
  currentMaxHarga = max;
  window.searchProduk();
};

// --- 4. RENDER HTML ---
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
        <div class="card-admin" style="display:flex; align-items:center; gap:10px; background:var(--card-bg); padding:10px; border-radius:12px; margin-bottom:10px; border:1px solid var(--input-border);">
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
            <div style="display:flex; align-items:center; gap:5px;"><h4 style="font-size:14px; margin:0;">${p.nama}</h4><span style="color:#38bdf8;">🔵</span></div>
            <div class="garansi-tag">🛡️ Garansi Anti-HB</div>
            <div class="harga">${p.hargaLama ? `<span class="harga-lama">Rp${Number(p.hargaLama).toLocaleString('id-ID')}</span>` : ''}<span class="harga-baru">Rp${hargaFormat}</span></div>
            <button class="btn-beli" ${isSold ? 'disabled' : `onclick="beliWhatsApp('${namaAman}', ${p.harga})"`}>${isSold ? 'TERJUAL' : 'BELI SEKARANG'}</button>
          </div>
        </div>`;
    }
  });
  produkDiv.innerHTML = html || `<p style="text-align:center; color:#94a3b8; padding:20px;">Produk tidak ditemukan.</p>`;
}

// --- 5. FITUR ADMIN (PENGUMUMAN, TESTI, STATUS) ---
window.updatePengumuman = async function() {
  const teks = document.getElementById("inputPengumuman").value;
  try {
    await updateDoc(doc(db, "pengaturan", "toko"), { pengumuman: teks });
    alert("Pengumuman diperbarui!");
  } catch (e) { alert("Error: " + e.message); }
};

window.tambahTestimoni = async function() {
  const url = document.getElementById("inputTestiGambar").value;
  if(!url) return alert("Isi URL Gambar!");
  try {
    await addDoc(collection(db, "testimoni"), { gambar: url, createdAt: new Date() });
    alert("Testimoni Berhasil!"); location.reload();
  } catch (e) { alert(e.message); }
};

window.updateStatusPesanan = async function() {
  const invId = document.getElementById("inputInvId").value;
  const status = document.getElementById("selectStatus").value;
  try {
    await updateDoc(doc(db, "pesanan", invId), { status: status });
    alert("Status Diperbarui!");
  } catch (e) { alert("ID Invoice Salah/Tidak Ada!"); }
};

// --- 6. CEK STATUS (USER SIDE) ---
window.cekStatusPesanan = async function() {
  const idInput = document.getElementById("inputCekStatus").value.trim();
  const hasilDiv = document.getElementById("hasilStatus");
  if(!idInput) return;
  try {
    const docRef = doc(db, "pesanan", idInput);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      hasilDiv.style.display = "block";
      hasilDiv.innerHTML = `<p>📌 <b>Invoice:</b> ${idInput}</p><p>📦 <b>Status:</b> <span style="color:var(--primary)">${data.status}</span></p>`;
    } else { alert("ID Invoice tidak ditemukan!"); }
  } catch (e) { alert("Error saat mengecek!"); }
};

// --- 7. FUNGSI DASAR ADMIN (CRUD PRODUK) ---
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
    if (editId) { await updateDoc(doc(db, "produk", editId), dataObj); } 
    else { await addDoc(collection(db, "produk"), dataObj); }
    location.reload();
  } catch (e) { alert(e.message); }
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
  if (confirm("Hapus produk?")) { await deleteDoc(doc(db, "produk", id)); location.reload(); }
};

window.filterGame = (el, kat) => {
  el.parentElement.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  window.searchProduk();
};

window.beliWhatsApp = (nama, harga) => {
  const invoiceID = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  const pesan = `*INVOICE FAZA STORE*\nID: ${invoiceID}\nProduk: ${nama}\nTotal: Rp${Number(harga).toLocaleString('id-ID')}\n\nSaya mau beli akun ini!`;
  window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
};

tampilProduk();
