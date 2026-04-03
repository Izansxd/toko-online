import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Helper Notifikasi
const notify = (msg, color) => {
    if (window.showToast) window.showToast(msg, color);
    else console.log(msg);
};

// --- 2. LOGIC DASHBOARD & PRODUK (USER & ADMIN) ---
window.tampilProduk = function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  onSnapshot(collection(db, "produk"), (snapshot) => {
    let allProducts = [];
    snapshot.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    const statTotal = document.getElementById("statTotal");
    if(statTotal) statTotal.innerText = allProducts.length;

    renderHTML(allProducts);
  });
};

function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  const isAdmin = window.location.href.includes("admin.html");
  let html = "";

  data.forEach((p) => {
    const isSold = p.status === "Sold" || p.status === "Sold Out";
    const hargaFormat = Number(p.harga).toLocaleString('id-ID');
    const namaAman = p.nama.replace(/'/g, "\\'");
    const deskAman = (p.deskripsi || "").replace(/'/g, "\\'").replace(/\n/g, "\\n");

    if (isAdmin) {
      html += `
        <div class="card-admin">
          <div class="card-admin-info">
            <img src="${p.gambar.split(',')[0]}">
            <div>
              <div style="font-size:12px; font-weight:600;">${p.nama}</div>
              <div style="color:#10b981; font-size:11px;">${isSold ? 'SOLD' : 'Rp'+hargaFormat}</div>
            </div>
          </div>
          <div class="admin-actions">
            <button class="btn-warning" onclick="window.editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${deskAman}','${p.kategori}')">✏️</button>
            <button class="btn-danger" onclick="window.hapusProduk('${p.id}')">🗑️</button>
          </div>
        </div>`;
    } else {
      html += `
        <div class="card">
          <div class="badge">${p.kategori}</div>
          <img src="${p.gambar.split(',')[0]}">
          <div class="card-info">
            <h4 style="font-size:13px; margin:0;">${p.nama}</h4>
            <span class="harga-baru">Rp${hargaFormat}</span>
            <button class="btn-beli" ${isSold ? 'disabled style="background:#475569;"' : `onclick="window.bukaStruk('${namaAman}', ${p.harga})"`}>
              ${isSold ? 'SOLD OUT' : 'BELI SEKARANG'}
            </button>
          </div>
        </div>`;
    }
  });
  produkDiv.innerHTML = html || "<p style='text-align:center; width:100%; font-size:12px; color:#64748b;'>Belum ada produk.</p>";
}

// --- 3. [ADMIN] FUNGSI ATUR PRODUK ---
window.submitProduk = async function() {
  const editId = document.getElementById("editId").value;
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const gambar = document.getElementById("gambar").value;
  const deskripsi = document.getElementById("deskripsi").value;
  const kategori = document.getElementById("kategori").value;

  if(!nama || !harga) return notify("Nama dan Harga wajib diisi! ⚠️", "#ef4444");

  const dataObj = {
    nama: nama, harga: Number(harga), gambar: gambar,
    deskripsi: deskripsi, kategori: kategori, status: "Ready", tanggal: new Date()
  };

  try {
    if (editId) {
      await updateDoc(doc(db, "produk", editId), dataObj);
      notify("Produk Berhasil Diupdate! ✅");
    } else {
      await addDoc(collection(db, "produk"), dataObj);
      notify("Produk Berhasil Ditambahkan! ✅");
    }
    if(window.resetForm) window.resetForm();
  } catch (e) { notify("Gagal: " + e.message, "#ef4444"); }
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("displayHarga").value = new Intl.NumberFormat('id-ID').format(harga);
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("editId").value = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  notify("Mode Edit Aktif ✏️", "#f1c40f");
};

window.hapusProduk = async (id) => {
  if(confirm("Hapus produk ini secara permanen?")) {
    await deleteDoc(doc(db, "produk", id));
    notify("Produk Telah Dihapus! 🗑️", "#ef4444");
  }
};

// --- 4. [ADMIN] FUNGSI TEXT RUNNING ---
window.updatePengumuman = async function() {
  const teks = document.getElementById("inputPengumuman").value;
  if(!teks) return notify("Tulis sesuatu untuk pengumuman!", "#ef4444");
  try {
    await setDoc(doc(db, "pengaturan", "toko"), { pengumuman: teks });
    notify("Running Text Diperbarui! 📢");
  } catch (e) { notify("Gagal update info.", "#ef4444"); }
};

// --- 5. [ADMIN] KELOLA VOUCHER ---
window.tambahVoucher = async function() {
  const kode = document.getElementById("vKode").value.trim().toUpperCase();
  const potongan = Number(document.getElementById("vDiskon").value);
  const kuota = Number(document.getElementById("vKuota").value);
  if(!kode || !potongan) return notify("Data voucher tidak lengkap! ⚠️", "#ef4444");
  await setDoc(doc(db, "vouchers", kode), { potongan, kuota });
  notify("Voucher Tersimpan! 🎟️");
  window.muatVoucherAdmin();
};

window.muatVoucherAdmin = function() {
  const list = document.getElementById("listVoucherAdmin");
  if(!list) return;
  onSnapshot(collection(db, "vouchers"), (snap) => {
    let html = "";
    snap.forEach(d => {
      html += `<div><span><b>${d.id}</b> (Rp${d.data().potongan.toLocaleString()})</span>
      <button onclick="window.hapusVoucher('${d.id}')" style="background:none; color:#ef4444; border:none; cursor:pointer;">HAPUS</button></div>`;
    });
    list.innerHTML = html;
  });
};

window.hapusVoucher = async (id) => { await deleteDoc(doc(db, "vouchers", id)); notify("Voucher Dihapus!", "#ef4444"); };

// --- 6. [ADMIN] TAMBAH TESTIMONI ---
window.tambahTesti = async function() {
  const img = document.getElementById("inputTesti").value;
  if(!img) return notify("Masukkan link gambar!", "#ef4444");
  await addDoc(collection(db, "testimoni"), { gambar: img });
  notify("Testimoni Disimpan! 📸");
};

window.muatTestimoniAdmin = function() {
  const list = document.getElementById("list-testimoni-admin");
  if(!list) return;
  onSnapshot(collection(db, "testimoni"), (snap) => {
    let html = "";
    snap.forEach(d => {
      html += `<div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
        <img src="${d.data().gambar}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">
        <button onclick="window.hapusTesti('${d.id}')" style="color:#ef4444; border:none; background:none; cursor:pointer;">Hapus</button>
      </div>`;
    });
    list.innerHTML = html;
  });
};

window.hapusTesti = async (id) => { await deleteDoc(doc(db, "testimoni", id)); notify("Testimoni Dihapus!", "#ef4444"); };

// --- 7. PESANAN & CUAN ---
window.muatPesananAdmin = function() {
  const list = document.getElementById("listPesananAdmin");
  if(!list) return;
  onSnapshot(query(collection(db, "pesanan"), orderBy("tanggal", "desc")), (snap) => {
    let html = ""; let totalCuan = 0;
    snap.forEach(d => {
      const p = d.data();
      const isSelesai = p.status === "🎉 Pesanan Selesai";
      if(isSelesai) totalCuan += Number(p.total);
      html += `<div class="order-item-admin ${isSelesai ? 'status-selesai' : ''}">
        <p><b>ID:</b> ${d.id} | <b>User:</b> ${p.pembeli}</p>
        <p><b>Produk:</b> ${p.produk} (Rp${Number(p.total).toLocaleString()})</p>
        ${!isSelesai ? `<button onclick="window.selesaikanPesanan('${d.id}')">SELESAIKAN</button>` : '✅ SELESAI'}
      </div>`;
    });
    list.innerHTML = html;
    if(document.getElementById("statCuan")) document.getElementById("statCuan").innerText = "Rp" + totalCuan.toLocaleString();
  });
};

// --- 8. SISTEM FILTER (KHUSUS INDEX) ---
window.jalankanFilter = function(kategori) {
  onSnapshot(collection(db, "produk"), (snapshot) => {
    let filtered = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (kategori === "Semua" || data.kategori === kategori) filtered.push({ id: docSnap.id, ...data });
    });
    renderHTML(filtered);
  });
};

// --- 9. MUAT TESTIMONI (KHUSUS INDEX) ---
window.muatTestimoniIndex = function() {
  const list = document.getElementById("list-testimoni");
  if(!list) return;
  onSnapshot(collection(db, "testimoni"), (snap) => {
    let html = "";
    snap.forEach(d => { html += `<img src="${d.data().gambar}" style="width:150px; height:150px; object-fit:cover; border-radius:15px; margin-right:10px; flex-shrink:0;">`; });
    list.innerHTML = html || "<p style='font-size:10px; color:#64748b;'>Belum ada testimoni.</p>";
  });
};

// --- 10. INISIALISASI APLIKASI (DETEKSI HALAMAN) ---
window.initApp = async function() {
  // Muat Running Text
  const pSnap = await getDoc(doc(db, "pengaturan", "toko"));
  const runningTextEl = document.getElementById("isiPengumuman");
  if(pSnap.exists() && runningTextEl) runningTextEl.innerText = pSnap.data().pengumuman;

  if (window.location.href.includes("admin.html")) {
    window.muatVoucherAdmin();
    window.muatTestimoniAdmin();
    window.muatPesananAdmin();
    window.tampilProduk();
  } else {
    window.tampilProduk(); 
    window.muatTestimoniIndex();
  }
};

window.initApp();
