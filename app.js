import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

// --- 2. FUNGSI TAMPIL DATA (PRODUK, TESTI, PENGUMUMAN) ---
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

    // Muat Pengumuman (Tampil di Marquee index.html)
    const infoSnap = await getDoc(doc(db, "pengaturan", "toko"));
    const marquee = document.getElementById("isiPengumuman");
    if (infoSnap.exists() && marquee) {
      marquee.innerText = infoSnap.data().pengumuman;
    }

    // Update Dashboard Statistik (Di Admin)
    const statTotal = document.getElementById("statTotal");
    const statSold = document.getElementById("statSold");
    if (statTotal && statSold) {
      statTotal.innerText = allProducts.length;
      statSold.innerText = allProducts.filter(p => p.status === "Sold").length;
    }

    window.searchProduk(); 
    muatTestimoni(); 
  } catch (error) {
    console.error("Gagal muat data:", error);
  }
};

async function muatTestimoni() {
  const testiDiv = document.getElementById("list-testimoni");
  if (!testiDiv) return;
  try {
    const snap = await getDocs(collection(db, "testimoni"));
    let html = "";
    snap.forEach(d => {
      const data = d.data();
      // Render berbeda untuk admin vs user
      const isAdmin = window.location.href.includes("admin.html");
      html += `
        <div class="card-testi" style="margin-bottom:10px; border:1px solid #334155; padding:10px; border-radius:10px;">
          <img src="${data.gambar}" style="width:100%; border-radius:8px;">
          <p style="font-size:12px; margin-top:5px;">${data.keterangan || ''}</p>
          ${isAdmin ? `<button onclick="hapusTesti('${d.id}')" style="background:red; color:white; border:none; padding:5px; border-radius:5px; width:100%; cursor:pointer;">HAPUS TESTI</button>` : ''}
        </div>`;
    });
    testiDiv.innerHTML = html || "<p style='color:#94a3b8; font-size:12px;'>Belum ada testimoni.</p>";
  } catch (e) { console.error(e); }
}

// --- 3. FUNGSI ADMIN (PENGUMUMAN, TESTI, STATUS PESANAN) ---

// Sesuai ID: teksBaru
window.updatePengumuman = async function() {
  const teks = document.getElementById("teksBaru").value;
  if(!teks) return alert("Isi teks pengumuman!");
  try {
    // Gunakan setDoc agar jika dokumen "toko" belum ada, dia otomatis dibuat
    await setDoc(doc(db, "pengaturan", "toko"), { pengumuman: teks }, { merge: true });
    alert("📢 Pengumuman Toko Berhasil Diupdate!");
  } catch (e) { alert("Error: " + e.message); }
};

// Sesuai ID: fotoTesti & ketTesti
window.submitTestimoni = async function() {
  const url = document.getElementById("fotoTesti").value;
  const ket = document.getElementById("ketTesti").value;
  if(!url) return alert("Isi Link Foto Bukti!");
  try {
    await addDoc(collection(db, "testimoni"), { 
      gambar: url, 
      keterangan: ket,
      createdAt: new Date() 
    });
    alert("✅ Testimoni Berhasil Disimpan!");
    location.reload();
  } catch (e) { alert(e.message); }
};

// Sesuai ID: adminIdPesanan & adminStatusUpdate
window.updateStatusPesanan = async function() {
  const invId = document.getElementById("adminIdPesanan").value.trim();
  const status = document.getElementById("adminStatusUpdate").value;
  if(!invId) return alert("Masukkan ID Invoice!");
  try {
    // Update ke koleksi 'pesanan'
    await setDoc(doc(db, "pesanan", invId), { status: status, lastUpdate: new Date() }, { merge: true });
    alert("✅ Status Pesanan " + invId + " Berhasil Diupdate!");
  } catch (e) { alert("Gagal update: " + e.message); }
};

window.hapusTesti = async function(id) {
    if(confirm("Hapus testimoni ini?")) {
        await deleteDoc(doc(db, "testimoni", id));
        location.reload();
    }
}

// --- 4. CEK STATUS (USER SIDE) ---
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
      hasilDiv.innerHTML = `
        <p style="margin:5px 0;">📌 <b>ID:</b> ${idInput}</p>
        <p style="margin:5px 0;">📦 <b>Status:</b> <span style="color:#00d2ff">${data.status}</span></p>
      `;
    } else { alert("ID Invoice tidak ditemukan!"); }
  } catch (e) { alert("Error mengecek status."); }
};

// --- 5. LOGIK SEARCH & FILTER HARGA ---
window.searchProduk = function() {
  const searchInput = document.getElementById("searchInput");
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const activeCatBtn = document.querySelector('.filter-container .btn-filter.active');
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

window.filterGame = (el, kat) => {
  el.parentElement.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  window.searchProduk();
};

// --- 6. RENDER KARTU PRODUK ---
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
          <img src="${p.gambar}">
          <div style="flex:1">
            <h4 style="margin:0; font-size:13px;">${p.nama}</h4>
            <p style="margin:0; color:#10b981; font-weight:700; font-size:12px;">Rp${hargaFormat} [${p.status}]</p>
          </div>
          <button onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${p.deskripsi}','${p.kategori}','${p.status}',${isPromo},'${p.hargaLama || ''}')" style="background:#3a7bd5; border:none; padding:8px; border-radius:5px; color:white; width:auto; margin:0;">✏️</button>
          <button onclick="hapusProduk('${p.id}')" style="background:#ef4444; border:none; padding:8px; border-radius:5px; color:white; width:auto; margin:0;">🗑️</button>
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

// --- 7. CRUD PRODUK ---
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
    alert("Berhasil!"); location.reload();
  } catch (e) { alert(e.message); }
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori, status, isPromo, hargaLama) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("displayHarga").value = new Intl.NumberFormat('id-ID').format(harga);
  document.getElementById("hargaLama").value = hargaLama || "";
  document.getElementById("displayHargaLama").value = hargaLama ? new Intl.NumberFormat('id-ID').format(hargaLama) : "";
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("status").value = status;
  document.getElementById("isPromo").checked = isPromo;
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

window.hapusProduk = async function(id) {
  if (confirm("Hapus akun ini dari daftar?")) { 
      await deleteDoc(doc(db, "produk", id)); 
      location.reload(); 
  }
};

window.beliWhatsApp = (nama, harga) => {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  const pesan = `*INVOICE FAZA STORE*\nID: ${inv}\nProduk: ${nama}\nTotal: Rp${Number(harga).toLocaleString('id-ID')}\n\nMin, saya mau bayar akun ini!`;
  window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
};

// Start
tampilProduk();
