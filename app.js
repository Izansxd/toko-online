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
let dataPesananSementera = {}; // Untuk simpan data saat klik beli

// --- 2. FUNGSI UTAMA (TAMPIL DATA) ---
window.tampilProduk = async function() {
  try {
    const dataSnap = await getDocs(collection(db, "produk"));
    allProducts = []; 
    dataSnap.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Muat Pengumuman ke Marquee (ID: isiPengumuman)
    const infoSnap = await getDoc(doc(db, "pengaturan", "toko"));
    if (infoSnap.exists()) {
      const marquee = document.getElementById("isiPengumuman");
      if(marquee) marquee.innerText = infoSnap.data().pengumuman;
    }

    // Statistik Admin
    const statTotal = document.getElementById("statTotal");
    const statSold = document.getElementById("statSold");
    if (statTotal && statSold) {
      statTotal.innerText = allProducts.length;
      statSold.innerText = allProducts.filter(p => p.status === "Sold").length;
    }

    window.searchProduk(); 
    muatTestimoni(); 
  } catch (error) { console.error(error); }
};

async function muatTestimoni() {
  const testiDiv = document.getElementById("list-testimoni");
  if (!testiDiv) return;
  try {
    const snap = await getDocs(collection(db, "testimoni"));
    let html = "";
    snap.forEach(d => {
      const data = d.data();
      const isAdmin = window.location.href.includes("admin.html");
      html += `
        <div class="card-testi">
          <img src="${data.gambar}" loading="lazy">
          ${isAdmin ? `<button onclick="hapusTesti('${d.id}')" style="background:red; color:white; border:none; padding:5px; border-radius:5px; width:100%; margin-top:5px;">HAPUS</button>` : ''}
        </div>`;
    });
    testiDiv.innerHTML = html || "<p style='font-size:12px; color:#94a3b8;'>Belum ada testimoni.</p>";
  } catch (e) { console.error(e); }
}

// --- 3. LOGIKA FILTER & SEARCH ---
window.searchProduk = function() {
  const keyword = document.getElementById("searchInput")?.value.toLowerCase().trim() || "";
  const activeCatBtn = document.querySelector('.filter-container .btn-filter.active');
  let kategoriAktif = activeCatBtn ? activeCatBtn.innerText.trim() : "Semua";
  
  if(kategoriAktif === "MLBB") kategoriAktif = "Mobile Legends";
  if(kategoriAktif === "FF") kategoriAktif = "Free Fire";
  if(kategoriAktif === "PUBG") kategoriAktif = "PUBG Mobile";

  const filteredData = allProducts.filter(p => {
    const harga = Number(p.harga) || 0;
    const cocokKategori = (kategoriAktif === "Semua" || p.kategori === kategoriAktif);
    const cocokKeyword = (p.nama || "").toLowerCase().includes(keyword);
    const cocokHarga = (harga >= currentMinHarga && harga <= currentMaxHarga);
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

// --- 4. RENDER HTML ---
function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;
  const isAdmin = window.location.href.includes("admin.html");
  let html = "";

  data.forEach((p) => {
    const isSold = p.status === "Sold"; 
    const hargaFormat = Number(p.harga).toLocaleString('id-ID');
    const namaAman = p.nama.replace(/'/g, "\\'");
    
    if (isAdmin) {
      html += `
        <div class="card-admin">
          <img src="${p.gambar}">
          <div style="flex:1"><h4 style="margin:0; font-size:13px;">${p.nama}</h4><p style="margin:0; color:#10b981; font-size:12px;">Rp${hargaFormat} [${p.status}]</p></div>
          <button onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${p.deskripsi}','${p.kategori}','${p.status}',${p.isPromo},'${p.hargaLama || ''}')">✏️</button>
          <button onclick="hapusProduk('${p.id}')">🗑️</button>
        </div>`;
    } else {
      html += `
        <div class="card">
          <div class="card-img-container">
            <img src="${p.gambar}">
            <div class="badge">${p.kategori}</div>
            ${p.isPromo ? `<div class="badge-promo">⚡ FLASH SALE</div>` : ''}
            ${isSold ? `<div class="sold-overlay"><div class="sold-label">SOLD OUT</div></div>` : ''}
          </div>
          <div class="card-info">
            <div style="display:flex; align-items:center; gap:5px;"><h4 style="font-size:13px;">${p.nama}</h4><span style="color:#38bdf8;">🔵</span></div>
            <div class="garansi-tag">🛡️ Garansi Anti-HB</div>
            <div class="harga">${p.hargaLama ? `<span class="harga-lama">Rp${Number(p.hargaLama).toLocaleString('id-ID')}</span>` : ''}<span class="harga-baru">Rp${hargaFormat}</span></div>
            <button class="btn-beli" ${isSold ? 'disabled' : `onclick="bukaStruk('${namaAman}', ${p.harga})"`}>${isSold ? 'TERJUAL' : 'BELI SEKARANG'}</button>
          </div>
        </div>`;
    }
  });
  produkDiv.innerHTML = html || `<p style="text-align:center; padding:20px;">Produk tidak ditemukan.</p>`;
}

// --- 5. SISTEM PEMBAYARAN (STRUK) ---
window.bukaStruk = function(nama, harga) {
  dataPesananSementera = { nama, harga, inv: "FZ-" + Math.floor(1000 + Math.random() * 9999) };
  document.getElementById("isiStruk").innerHTML = `
    <p><b>No. Invoice:</b> ${dataPesananSementera.inv}</p>
    <p><b>Produk:</b> ${nama}</p>
    <p><b>Total:</b> Rp${Number(harga).toLocaleString('id-ID')}</p>
  `;
  document.getElementById("modalStruk").style.display = "flex";
};

window.tutupStruk = () => document.getElementById("modalStruk").style.display = "none";

window.kirimInvoiceWA = async function() {
  const metode = document.getElementById("metodeBayar").value;
  const { nama, harga, inv } = dataPesananSementera;
  
  // Simpan pesanan ke Database agar bisa dicek statusnya nanti
  try {
    await setDoc(doc(db, "pesanan", inv), {
      produk: nama,
      total: harga,
      metode: metode,
      status: "⏳ Menunggu Pembayaran",
      tanggal: new Date()
    });
    
    const pesan = `*PESANAN BARU - FAZA STORE*\n\nID: ${inv}\nProduk: ${nama}\nTotal: Rp${Number(harga).toLocaleString('id-ID')}\nMetode: ${metode}\n\nSegera kirimkan detail pembayarannya ya Min!`;
    window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
    tutupStruk();
  } catch (e) { alert("Gagal membuat pesanan."); }
};

// --- 6. FITUR LACAK PESANAN ---
window.cekStatusPesanan = async function() {
  const idInput = document.getElementById("inputCekStatus").value.trim();
  const hasilDiv = document.getElementById("hasilStatus");
  if(!idInput) return alert("Masukkan ID Invoice!");

  try {
    const docSnap = await getDoc(doc(db, "pesanan", idInput));
    if (docSnap.exists()) {
      const data = docSnap.data();
      hasilDiv.style.display = "block";
      hasilDiv.innerHTML = `
        <p style="margin:5px 0; font-size:13px;"><b>ID:</b> ${idInput}</p>
        <p style="margin:5px 0; font-size:13px;"><b>Status:</b> <span style="color:#00d2ff; font-weight:700;">${data.status}</span></p>
      `;
    } else { alert("ID Invoice tidak ditemukan!"); }
  } catch (e) { alert("Terjadi kesalahan."); }
};

// --- 7. FITUR ADMIN (CRUD & PENGATURAN) ---
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
  if (confirm("Hapus akun?")) { await deleteDoc(doc(db, "produk", id)); location.reload(); }
};

window.updatePengumuman = async function() {
  const teks = document.getElementById("teksBaru").value;
  try {
    await setDoc(doc(db, "pengaturan", "toko"), { pengumuman: teks }, { merge: true });
    alert("Berhasil!");
  } catch (e) { alert(e.message); }
};

window.submitTestimoni = async function() {
  const url = document.getElementById("fotoTesti").value;
  try {
    await addDoc(collection(db, "testimoni"), { gambar: url, createdAt: new Date() });
    alert("Testimoni Berhasil!"); location.reload();
  } catch (e) { alert(e.message); }
};

window.updateStatusPesanan = async function() {
  const invId = document.getElementById("adminIdPesanan").value.trim();
  const status = document.getElementById("adminStatusUpdate").value;
  try {
    await setDoc(doc(db, "pesanan", invId), { status: status }, { merge: true });
    alert("Status Terupdate!");
  } catch (e) { alert("Gagal!"); }
};

window.hapusTesti = async function(id) {
    if(confirm("Hapus testimoni?")) { await deleteDoc(doc(db, "testimoni", id)); location.reload(); }
}

tampilProduk();
