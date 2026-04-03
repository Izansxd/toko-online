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

  // Real-time listener untuk sinkronisasi otomatis
  onSnapshot(collection(db, "produk"), (snapshot) => {
    let allProducts = [];
    snapshot.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    // Update Statistik Admin jika elemennya ada
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
    
    // Pembersihan teks agar tidak error saat dipassing ke fungsi onclick
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
      // Tampilan untuk pembeli (index.html)
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
  const harga = document.getElementById("harga").value; // Nilai murni dari hidden input
  const gambar = document.getElementById("gambar").value;
  const deskripsi = document.getElementById("deskripsi").value;
  const kategori = document.getElementById("kategori").value;

  if(!nama || !harga) return notify("Nama dan Harga wajib diisi! ⚠️", "#ef4444");

  const dataObj = {
    nama: nama,
    harga: Number(harga),
    gambar: gambar,
    deskripsi: deskripsi,
    kategori: kategori,
    status: "Ready",
    tanggal: new Date()
  };

  try {
    if (editId) {
      await updateDoc(doc(db, "produk", editId), dataObj);
      notify("Produk Berhasil Diupdate! ✅");
    } else {
      await addDoc(collection(db, "produk"), dataObj);
      notify("Produk Berhasil Ditambahkan! ✅");
    }
    // Reset form via fungsi di admin.html
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
  try {
    await setDoc(doc(db, "vouchers", kode), { potongan, kuota });
    notify("Voucher '" + kode + "' Tersimpan! 🎟️");
    document.getElementById("vKode").value = "";
    document.getElementById("vDiskon").value = "";
    document.getElementById("vKuota").value = "";
    window.muatVoucherAdmin();
  } catch (e) { notify("Gagal simpan voucher.", "#ef4444"); }
};

window.muatVoucherAdmin = async function() {
  const list = document.getElementById("listVoucherAdmin");
  if(!list) return;
  onSnapshot(collection(db, "vouchers"), (snap) => {
    let html = "";
    snap.forEach(d => {
      html += `<div>
        <span style="font-size:12px;"><b>${d.id}</b> (Pot: Rp${d.data().potongan.toLocaleString()})</span>
        <button onclick="window.hapusVoucher('${d.id}')" style="background:none; color:#ef4444; border:none; padding:0; width:auto; cursor:pointer;">HAPUS</button>
      </div>`;
    });
    list.innerHTML = html;
  });
};

window.hapusVoucher = async (id) => {
  await deleteDoc(doc(db, "vouchers", id));
  notify("Voucher Dihapus! 🗑️", "#ef4444");
};

// --- 6. [ADMIN] TAMBAH TESTIMONI ---
window.tambahTesti = async function() {
  const img = document.getElementById("inputTesti").value;
  if(!img) return notify("Masukkan link gambar testimoni!", "#ef4444");
  try {
    await addDoc(collection(db, "testimoni"), { gambar: img });
    notify("Testimoni Berhasil Disimpan! 📸");
    document.getElementById("inputTesti").value = "";
    window.muatTestimoniAdmin();
  } catch (e) { notify("Gagal simpan testimoni.", "#ef4444"); }
};

window.muatTestimoniAdmin = function() {
  const list = document.getElementById("list-testimoni-admin");
  if(!list) return;
  onSnapshot(collection(db, "testimoni"), (snap) => {
    let html = "";
    snap.forEach(d => {
      html += `<div style="display:flex; align-items:center; gap:10px; background:#0f172a; padding:10px; border-radius:10px; border:1px solid #334155;">
        <img src="${d.data().gambar}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">
        <span style="font-size:10px; flex:1; overflow:hidden;">${d.data().gambar.substring(0,30)}...</span>
        <button onclick="window.hapusTesti('${d.id}')" style="background:none; color:#ef4444; border:none; width:auto; cursor:pointer;">Hapus</button>
      </div>`;
    });
    list.innerHTML = html;
  });
};

window.hapusTesti = async (id) => {
  await deleteDoc(doc(db, "testimoni", id));
  notify("Testimoni Dihapus!", "#ef4444");
};

// --- 7. PESANAN & CUAN ---
window.muatPesananAdmin = function() {
  const list = document.getElementById("listPesananAdmin");
  if(!list) return;
  onSnapshot(query(collection(db, "pesanan"), orderBy("tanggal", "desc")), (snap) => {
    let html = "";
    let totalCuan = 0;
    snap.forEach(d => {
      const p = d.data();
      const isSelesai = p.status === "🎉 Pesanan Selesai";
      if(isSelesai) totalCuan += Number(p.total);
      
      html += `
        <div class="order-item-admin ${isSelesai ? 'status-selesai' : ''}">
          <p><b>ID:</b> ${d.id} | <b>User:</b> ${p.pembeli}</p>
          <p><b>Produk:</b> ${p.produk} (Rp${Number(p.total).toLocaleString()})</p>
          <p><b>WA:</b> <a href="https://wa.me/${p.whatsapp}" class="wa-tag" target="_blank">Chat WA</a></p>
          ${!isSelesai ? `
            <textarea id="dataAkun_${d.id}" placeholder="Email:Pass Akun..."></textarea>
            <button class="btn-success" onclick="window.kirimDataEmail('${d.id}','${p.email}','${p.produk}','${p.pembeli}')">📧 KIRIM & SOLD</button>
          ` : `<p style="color:#10b981; font-weight:bold; margin-top:5px;">✅ PESANAN SELESAI</p>`}
        </div>`;
    });
    list.innerHTML = html || "<p style='text-align:center;'>Belum ada pesanan.</p>";
    if(document.getElementById("statCuan")) document.getElementById("statCuan").innerText = "Rp" + totalCuan.toLocaleString('id-ID');
  });
};

// --- INISIALISASI ---
window.initAdminPanel = async function() {
  if(!window.location.href.includes("admin.html")) return;
  
  // Load data awal running text
  const pSnap = await getDoc(doc(db, "pengaturan", "toko"));
  if(pSnap.exists()) document.getElementById("inputPengumuman").value = pSnap.data().pengumuman;

  window.muatVoucherAdmin();
  window.muatTestimoniAdmin();
  window.muatPesananAdmin();
  window.tampilProduk();
};

window.initAdminPanel();
