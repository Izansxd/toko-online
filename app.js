import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Variable Global untuk menyimpan data order sementara
window.currentOrder = null;

// Helper Notifikasi
const notify = (msg, color) => {
    if (window.showToast) window.showToast(msg, color);
    else console.log(msg);
};

// --- 2. LOGIC DASHBOARD & PRODUK ---
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

// --- 3. SISTEM PEMBELIAN (USER) ---
window.bukaStruk = function(nama, harga) {
    const modal = document.getElementById("modalStruk");
    const isiStruk = document.getElementById("isiStruk");
    if(!modal) return;

    window.currentOrder = { produk: nama, hargaAsli: harga, total: harga, voucher: "" };

    isiStruk.innerHTML = `
        <div class="struk-header">
            <h3>STRUK PEMBELIAN</h3>
            <p>Faza Store - Terpercaya</p>
        </div>
        <div class="struk-divider"></div>
        <div class="struk-item"><span>Produk:</span> <b>${nama}</b></div>
        <div class="struk-item"><span>Harga:</span> <b>Rp${harga.toLocaleString()}</b></div>
        <div class="struk-divider"></div>
        <label>NAMA PEMBELI</label>
        <input type="text" id="pembeliNama" placeholder="Nama Anda...">
        <label>WHATSAPP</label>
        <input type="number" id="pembeliWA" placeholder="08...">
        <label>EMAIL</label>
        <input type="email" id="pembeliEmail" placeholder="Email aktif...">
        <label>VOUCHER (Opsional)</label>
        <div style="display:flex; gap:5px;">
            <input type="text" id="inputVoucher" style="margin:0;">
            <button onclick="window.pakaiVoucher()" style="width:auto; padding:0 10px; background:#0f172a; color:white; border:none; border-radius:5px;">CEK</button>
        </div>
        <p id="pesanVoucher" style="font-size:10px; margin:5px 0;"></p>
        <div class="struk-total"><span>TOTAL:</span> <span id="displayTotal">Rp${harga.toLocaleString()}</span></div>
    `;
    modal.style.display = "flex";
};

window.pakaiVoucher = async function() {
    const kode = document.getElementById("inputVoucher").value.trim().toUpperCase();
    if(!kode) return;
    const vSnap = await getDoc(doc(db, "vouchers", kode));
    const pesan = document.getElementById("pesanVoucher");
    if(vSnap.exists() && vSnap.data().kuota > 0) {
        const potong = vSnap.data().potongan;
        window.currentOrder.total = window.currentOrder.hargaAsli - potong;
        window.currentOrder.voucher = kode;
        document.getElementById("displayTotal").innerText = "Rp" + window.currentOrder.total.toLocaleString();
        pesan.innerText = "Berhasil! Potongan Rp" + potong.toLocaleString();
        pesan.style.color = "green";
    } else {
        pesan.innerText = "Voucher tidak valid/habis.";
        pesan.style.color = "red";
    }
};

window.handleConfirmBayar = async function() {
    const nama = document.getElementById("pembeliNama").value;
    const wa = document.getElementById("pembeliWA").value;
    const email = document.getElementById("pembeliEmail").value;
    if(!nama || !wa || !email) return notify("Lengkapi data!", "#ef4444");

    try {
        const orderData = { ...window.currentOrder, pembeli: nama, whatsapp: wa, email: email, status: "Menunggu Pembayaran", tanggal: new Date() };
        const docRef = await addDoc(collection(db, "pesanan"), orderData);
        const invoice = docRef.id.substring(0, 5).toUpperCase();

        const msg = `Halo Admin Faza Store!%0ASaya ingin beli *${orderData.produk}*%0AID Order: *#${invoice}*%0ATotal: *Rp${orderData.total.toLocaleString()}*%0ANama: ${nama}`;
        window.open(`https://wa.me/6282298627146?text=${msg}`, '_blank');
        
        window.tutupStruk();
        notify("Order diproses! Silakan bayar via WA.", "#10b981");
    } catch (e) { notify("Gagal order.", "#ef4444"); }
};

// --- 4. [ADMIN] FUNGSI KELOLA ---
window.submitProduk = async function() {
  const editId = document.getElementById("editId").value;
  const dataObj = {
    nama: document.getElementById("nama").value,
    harga: Number(document.getElementById("harga").value),
    gambar: document.getElementById("gambar").value,
    deskripsi: document.getElementById("deskripsi").value,
    kategori: document.getElementById("kategori").value,
    status: "Ready", tanggal: new Date()
  };
  if(!dataObj.nama || !dataObj.harga) return notify("Lengkapi data!", "#ef4444");
  editId ? await updateDoc(doc(db, "produk", editId), dataObj) : await addDoc(collection(db, "produk"), dataObj);
  notify("Sukses!"); if(window.resetForm) window.resetForm();
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
};

window.hapusProduk = async (id) => { if(confirm("Hapus?")) await deleteDoc(doc(db, "produk", id)); };

window.updatePengumuman = async function() {
  const teks = document.getElementById("inputPengumuman").value;
  await setDoc(doc(db, "pengaturan", "toko"), { pengumuman: teks });
  notify("Updated!");
};

window.tambahVoucher = async function() {
  const kode = document.getElementById("vKode").value.trim().toUpperCase();
  const pot = Number(document.getElementById("vDiskon").value);
  const kuota = Number(document.getElementById("vKuota").value);
  await setDoc(doc(db, "vouchers", kode), { potongan: pot, kuota: kuota });
  notify("Voucher Tersimpan!");
};

window.muatVoucherAdmin = function() {
  const list = document.getElementById("listVoucherAdmin");
  if(!list) return;
  onSnapshot(collection(db, "vouchers"), (snap) => {
    let html = "";
    snap.forEach(d => { html += `<div><b>${d.id}</b> - Rp${d.data().potongan.toLocaleString()} <button onclick="window.hapusVoucher('${d.id}')">X</button></div>`; });
    list.innerHTML = html;
  });
};

window.hapusVoucher = async (id) => { await deleteDoc(doc(db, "vouchers", id)); };

window.tambahTesti = async function() {
  const img = document.getElementById("inputTesti").value;
  if(img) await addDoc(collection(db, "testimoni"), { gambar: img });
  document.getElementById("inputTesti").value = "";
};

window.muatTestimoniAdmin = function() {
  const list = document.getElementById("list-testimoni-admin");
  if(!list) return;
  onSnapshot(collection(db, "testimoni"), (snap) => {
    let html = "";
    snap.forEach(d => { html += `<div style="display:inline-block;"><img src="${d.data().gambar}" width="50"><button onclick="window.hapusTesti('${d.id}')">X</button></div>`; });
    list.innerHTML = html;
  });
};

window.hapusTesti = async (id) => { await deleteDoc(doc(db, "testimoni", id)); };

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
        <p><b>${p.pembeli}</b> - ${p.produk}</p>
        <p>WA: ${p.whatsapp} | Rp${Number(p.total).toLocaleString()}</p>
        ${!isSelesai ? `<button onclick="window.selesaikanPesanan('${d.id}')">SELESAIKAN</button>` : '✅ SELESAI'}
      </div>`;
    });
    list.innerHTML = html;
    if(document.getElementById("statCuan")) document.getElementById("statCuan").innerText = "Rp" + totalCuan.toLocaleString();
  });
};

window.selesaikanPesanan = async (id) => {
    await updateDoc(doc(db, "pesanan", id), { status: "🎉 Pesanan Selesai" });
    notify("Berhasil!");
};

// --- 5. SYSTEM UTILITY ---
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

window.muatTestimoniIndex = function() {
  const list = document.getElementById("list-testimoni");
  if(!list) return;
  onSnapshot(collection(db, "testimoni"), (snap) => {
    let html = "";
    snap.forEach(d => { html += `<img src="${d.data().gambar}" style="width:150px; height:150px; object-fit:cover; border-radius:15px; margin-right:10px;">`; });
    list.innerHTML = html || "<p>Belum ada testimoni.</p>";
  });
};

// --- 6. INISIALISASI ---
window.initApp = async function() {
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
