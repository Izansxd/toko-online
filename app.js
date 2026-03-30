import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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
let pesananSekarang = {}; 

// --- 1. FUNGSI TAMPIL PRODUK ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  produkDiv.innerHTML = Array(4).fill('<div class="skeleton skeleton-card"></div>').join('');

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

// --- 2. FUNGSI SEARCH & FILTER ---
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
    const deskripsiProduk = (p.deskripsi || "").toLowerCase();
    const cocokKeyword = namaProduk.includes(keyword) || deskripsiProduk.includes(keyword);
    return cocokKategori && cocokKeyword;
  });

  renderHTML(filteredData);
};

// --- 3. FUNGSI RENDER KE LAYAR (VERIFIED & GARANSI) ---
function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  const isAdmin = window.location.href.includes("admin.html");
  let html = "";

  data.forEach((p) => {
    const isSold = p.status === "Sold"; 
    const isPromo = p.isPromo === true || p.isPromo === "true"; 
    const deskripsi = p.deskripsi || "Spek lengkap cek admin.";
    const namaAman = p.nama.replace(/'/g, "\\'");
    
    const hargaFormat = Number(p.harga).toLocaleString('id-ID');
    
    let hargaLamaHTML = "";
    if (p.hargaLama && Number(p.hargaLama) > 0) {
      hargaLamaHTML = `<span class="harga-lama">Rp${Number(p.hargaLama).toLocaleString('id-ID')}</span>`;
    }

    if (isAdmin) {
      html += `
        <div class="card-admin">
          <img src="${p.gambar}" alt="${p.nama}">
          <div class="info-admin">
            <h4>${p.nama} ${isPromo ? '🔥' : ''}</h4>
            <p>Rp${hargaFormat}</p>
          </div>
          <div class="btn-group">
            <button class="btn-edit" onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${deskripsi}','${p.kategori}','${p.status}',${isPromo},'${p.hargaLama || ''}')">✏️ Edit</button>
            <button class="btn-hapus" onclick="hapusProduk('${p.id}')">🗑️ Hapus</button>
          </div>
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
            <div class="title-wrapper">
              <h4>${p.nama}</h4>
              <span class="verified-icon">🔵</span>
            </div>
            
            <div class="garansi-tag">🛡️ Garansi Anti-HB</div>

            <p class="deskripsi-teks">${deskripsi}</p>
            <div class="harga">
                ${hargaLamaHTML}
                <span class="harga-baru">Rp${hargaFormat}</span>
            </div>
            <button ${isSold ? 'disabled' : `onclick="beliWhatsApp('${namaAman}', ${p.harga})"`}>
                ${isSold ? 'SUDAH TERJUAL' : 'BELI SEKARANG'}
            </button>
          </div>
        </div>`;
    }
  });

  produkDiv.innerHTML = html || `<p style="text-align:center; width:100%; color:#94a3b8; padding:20px;">Produk tidak ditemukan.</p>`;
}

// --- 4. FUNGSI FILTER ---
window.filterGame = function(elemen, kategori) {
  const buttons = document.querySelectorAll('.btn-filter');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (elemen) elemen.classList.add('active');
  window.searchProduk(); 
};

// --- 5. FUNGSI STRUK & INVOICE ---
window.beliWhatsApp = (nama, harga) => {
  pesananSekarang = { nama, harga };
  const hargaFormat = Number(harga).toLocaleString('id-ID');
  
  const isiStruk = document.getElementById("isiStruk");
  if(isiStruk) {
      isiStruk.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size:12px;"><span>Produk:</span> <b>${nama}</b></div>
        <div style="display: flex; justify-content: space-between; font-size:12px;"><span>Harga:</span> <b>Rp${hargaFormat}</b></div>
        <div style="display: flex; justify-content: space-between; font-size:12px;"><span>Admin:</span> <b style="color:green">Rp0</b></div>
        <hr style="border: 0; border-top: 1px dashed #ccc; margin: 10px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 14px;"><span>Total:</span> <b>Rp${hargaFormat}</b></div>
      `;
      document.getElementById("modalStruk").style.display = "flex";
  }
};

window.kirimInvoiceWA = () => {
  const metode = document.getElementById("metodeBayar").value;
  const hargaFormat = Number(pesananSekarang.harga).toLocaleString('id-ID');
  const invoiceID = "FZ-" + Math.floor(1000 + Math.random() * 9000);

  const pesan = `*📄 PESANAN BARU - FAZA STORE*\n` +
                `--------------------------------------------\n` +
                `🆔 *ID:* ${invoiceID}\n` +
                `🎮 *Produk:* ${pesananSekarang.nama}\n` +
                `💰 *Total:* Rp${hargaFormat}\n` +
                `💳 *Metode:* ${metode}\n` +
                `--------------------------------------------\n` +
                `Halo Admin 👋, saya mau bayar akun ini via *${metode}*. Mohon prosesnya!`;

  window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
  window.tutupStruk();
};

window.tutupStruk = () => {
  document.getElementById("modalStruk").style.display = "none";
};

// --- 6. PENGUMUMAN & STATUS ---
window.ambilPengumuman = async function() {
  const marquee = document.getElementById("isiPengumuman");
  if (!marquee) return;
  try {
    const docSnap = await getDoc(doc(db, "pengaturan", "pengumuman"));
    if (docSnap.exists()) marquee.innerText = docSnap.data().isi;
  } catch (e) { console.error(e); }
};

window.toggleDrawer = function(show) {
  const drawer = document.getElementById('statusDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (show) {
    overlay.style.display = 'block';
    setTimeout(() => { overlay.classList.add('show'); drawer.classList.add('active'); }, 10);
  } else {
    drawer.classList.remove('active'); overlay.classList.remove('show');
    setTimeout(() => { overlay.style.display = 'none'; }, 400);
  }
};

window.cekStatusPesanan = async function() {
  const id = document.getElementById("inputCekStatus").value.trim().toUpperCase();
  const boxHasil = document.getElementById("hasilStatus");
  if (!id) return alert("Isi ID Invoice!");

  boxHasil.style.display = "block";
  boxHasil.innerHTML = "🔍 Melacak...";

  try {
    const docSnap = await getDoc(doc(db, "pesanan", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      boxHasil.innerHTML = `ID: <b>${id}</b><br>Status: <b style="color:#00d2ff">${data.status}</b>`;
    } else {
      boxHasil.innerHTML = "❌ ID Tidak Ditemukan";
    }
  } catch (e) { boxHasil.innerHTML = "Error!"; }
};

// --- 7. ADMIN PANEL LOGIC ---
window.submitProduk = async function() {
  const editId = document.getElementById("editId").value;
  const dataObj = {
    nama: document.getElementById("nama").value,
    harga: Number(document.getElementById("harga").value),
    hargaLama: Number(document.getElementById("hargaLama").value) || null,
    gambar: document.getElementById("gambar").value,
    deskripsi: document.getElementById("deskripsi").value,
    kategori: document.getElementById("kategori").value,
    status: document.getElementById("status").value,
    isPromo: document.getElementById("isPromo").checked
  };

  try {
    if (editId) await updateDoc(doc(db, "produk", editId), dataObj);
    else await addDoc(collection(db, "produk"), dataObj);
    alert("Berhasil!"); location.reload();
  } catch (e) { alert(e.message); }
};

window.hapusProduk = async function(id) {
  if (confirm("Hapus?")) { await deleteDoc(doc(db, "produk", id)); location.reload(); }
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

// --- 8. TESTIMONI ---
window.tampilTestimoni = async function() {
  const testiDiv = document.getElementById("list-testimoni");
  if (!testiDiv) return;
  try {
    const q = query(collection(db, "testimoni"), orderBy("tanggal", "desc"));
    const snap = await getDocs(q);
    let html = "";
    snap.forEach(d => {
      const t = d.data();
      html += `<div class="card-testi"><img src="${t.foto}"><p>${t.keterangan}</p></div>`;
    });
    testiDiv.innerHTML = html || "Belum ada testi.";
  } catch (e) {}
};

// Jalankan
tampilProduk();
tampilTestimoni();
ambilPengumuman();
