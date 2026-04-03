import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE & SETTINGS ---
const NOMOR_WA_ADMIN = "6282298627146"; 
const NO_DANA = "082298627146"; 
const URL_QRIS = "https://link-foto-qris-kamu.com/qris.jpg"; 

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

let allProducts = [];
let dataPesananSementera = {}; 

// Helper Notifikasi
const notify = (msg, color) => {
    if (window.showToast) window.showToast(msg, color);
    else console.log(msg);
};

// --- 2. FUNGSI UTAMA LOAD DATA ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  try {
    // Real-time listener untuk produk
    onSnapshot(collection(db, "produk"), (snapshot) => {
      allProducts = [];
      snapshot.forEach(docSnap => {
        allProducts.push({ id: docSnap.id, ...docSnap.data() });
      });
      renderHTML(allProducts);
      
      // Update Statistik jika di halaman Admin
      if(document.getElementById("statTotal")) document.getElementById("statTotal").innerText = allProducts.length;
    });

    // Load Pengumuman/Running Text
    const infoSnap = await getDoc(doc(db, "pengaturan", "toko"));
    if (infoSnap.exists() && document.getElementById("isiPengumuman")) {
      document.getElementById("isiPengumuman").innerText = infoSnap.data().pengumuman;
    }

    window.muatTestimoni();
    if(window.location.href.includes("admin.html")) window.muatPesananAdmin();
    jalankanLiveNotif();

  } catch (error) { 
    console.error(error);
    produkDiv.innerHTML = "Gagal memuat data.";
  }
};

// --- 3. RENDER PRODUK KE HTML ---
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
              <div style="font-size:12px;">${p.nama}</div>
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
            <p onclick="window.bukaDetail('${namaAman}', '${deskAman}', '${p.gambar}', ${p.harga})" style="font-size: 11px; color: #00d2ff; cursor: pointer; margin:5px 0;">🔍 Cek Detail</p>
            <span class="harga-baru">Rp${hargaFormat}</span>
            <button class="btn-beli" ${isSold ? 'disabled style="background:#475569;"' : `onclick="window.bukaStruk('${namaAman}', ${p.harga})"`}>
              ${isSold ? 'SOLD OUT' : 'BELI SEKARANG'}
            </button>
          </div>
        </div>`;
    }
  });
  produkDiv.innerHTML = html || "<p style='grid-column:1/3; text-align:center;'>Produk tidak tersedia.</p>";
}

// --- 4. FITUR TRANSAKSI (USER) ---
window.bukaStruk = function(nama, harga) {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  dataPesananSementera = { produk: nama, hargaAsli: harga, total: harga, inv: inv };
  
  document.getElementById("isiStruk").innerHTML = `
    <div class="struk-header"><h3>FAZA STORE</h3><p>Invoice: ${inv}</p></div>
    <div class="struk-divider"></div>
    <div class="struk-item"><span>Produk:</span><span>${nama}</span></div>
    <div class="struk-total"><span>TOTAL:</span><span id="displayTotal">Rp${harga.toLocaleString('id-ID')}</span></div>
    <div class="struk-divider"></div>
    <label>NAMA PEMBELI</label><input type="text" id="pembeliNama" placeholder="Nama Anda">
    <label>WHATSAPP</label><input type="number" id="pembeliWA" placeholder="628xxx">
    <label>EMAIL PENGIRIMAN</label><input type="email" id="pembeliEmail" placeholder="akun@gmail.com">
    <label>METODE BAYAR</label>
    <select id="metodeBayar" onchange="window.pilihPembayaran(this.value)">
      <option value="">-- Pilih Pembayaran --</option>
      <option value="DANA">DANA (${NO_DANA})</option>
      <option value="QRIS">QRIS (Otomatis)</option>
    </select>
    <div id="wadahBayar"></div>
    <label>LINK BUKTI TRANSFER</label><input type="text" id="buktiTransfer" placeholder="Tempel link foto bukti">
  `;
  document.getElementById("modalStruk").style.display = "flex";
};

window.pilihPembayaran = function(val) {
  const wadah = document.getElementById("wadahBayar");
  if(val === "QRIS") {
    wadah.innerHTML = `<img src="${URL_QRIS}" style="width:100%; border-radius:10px; margin-top:10px;">`;
  } else if(val === "DANA") {
    wadah.innerHTML = `<div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-top:10px; text-align:center;">
      <p style="font-size:10px; margin:0;">Transfer Ke DANA:</p>
      <b style="font-size:16px;">${NO_DANA}</b><br>
      <button onclick="window.salinTeks('${NO_DANA}', this)" style="background:#0f172a; color:white; border:none; padding:5px 10px; border-radius:5px; font-size:10px; margin-top:5px; cursor:pointer;">SALIN NOMOR</button>
    </div>`;
  } else { wadah.innerHTML = ""; }
};

window.handleConfirmBayar = async function() {
  const nama = document.getElementById("pembeliNama").value;
  const wa = document.getElementById("pembeliWA").value;
  const email = document.getElementById("pembeliEmail").value;
  const bukti = document.getElementById("buktiTransfer").value;
  const metode = document.getElementById("metodeBayar").value;

  if(!nama || !wa || !email || !bukti || !metode) return notify("Lengkapi formulir! ⚠️", "#ef4444");

  try {
    await setDoc(doc(db, "pesanan", dataPesananSementera.inv), {
      ...dataPesananSementera,
      pembeli: nama, whatsapp: wa, email: email, bukti: bukti, metode: metode,
      status: "⏳ Menunggu Validasi", tanggal: new Date()
    });
    notify("Pesanan Berhasil! Silakan tunggu konfirmasi. 🚀");
    setTimeout(() => location.reload(), 2000);
  } catch (e) { notify("Gagal kirim pesanan.", "#ef4444"); }
};

// --- 5. FITUR ADMIN (PANEL) ---
window.muatPesananAdmin = function() {
  const list = document.getElementById("listPesananAdmin");
  if(!list) return;
  onSnapshot(query(collection(db, "pesanan"), orderBy("tanggal", "desc")), (snap) => {
    let html = "";
    let cuan = 0;
    snap.forEach(d => {
      const p = d.data();
      const isSelesai = p.status === "🎉 Pesanan Selesai";
      if(isSelesai) cuan += Number(p.total);
      html += `
        <div class="order-item-admin ${isSelesai ? 'status-selesai' : ''}">
          <p><b>ID:</b> ${d.id} | <b>User:</b> ${p.pembeli}</p>
          <p><b>Produk:</b> ${p.produk} (Rp${Number(p.total).toLocaleString()})</p>
          <p><b>WA:</b> <a href="https://wa.me/${p.whatsapp}" class="wa-tag" target="_blank">Chat WA</a></p>
          ${!isSelesai ? `
            <textarea id="dataAkun_${d.id}" placeholder="Email:Pass Akun..."></textarea>
            <button class="btn-success" onclick="window.kirimDataEmail('${d.id}','${p.email}','${p.produk}','${p.pembeli}')">📧 KIRIM & SOLD</button>
          ` : `<button class="btn-selesai-muted" disabled>✅ TERKIRIM & SOLD</button>`}
          <button onclick="window.hapusPesanan('${d.id}')" style="background:none; color:red; border:none; font-size:10px; cursor:pointer;">Hapus</button>
        </div>`;
    });
    list.innerHTML = html || "Tidak ada pesanan.";
    if(document.getElementById("statCuan")) document.getElementById("statCuan").innerText = "Rp" + cuan.toLocaleString();
  });
};

window.kirimDataEmail = async function(id, email, produk, pembeli) {
  const dataAkun = document.getElementById(`dataAkun_${id}`).value;
  if(!dataAkun) return notify("Isi data akun!", "#ef4444");
  notify("Mengirim Email... 📧");
  try {
    await emailjs.send("service_xe358l6", "template_2j4eu9o", {
      nama_pembeli: pembeli, email_pembeli: email, nama_akun: produk, data_akun: dataAkun
    });
    await updateDoc(doc(db, "pesanan", id), { status: "🎉 Pesanan Selesai" });
    const q = query(collection(db, "produk"), where("nama", "==", produk));
    const qSnap = await getDocs(q);
    qSnap.forEach(async d => await updateDoc(doc(db, "produk", d.id), { status: "Sold" }));
    notify("Berhasil Terkirim! 🚀");
  } catch (e) { notify("Gagal kirim email.", "#ef4444"); }
};

// --- LAIN-LAIN ---
window.jalankanFilter = (kat) => {
  renderHTML(kat === 'Semua' ? allProducts : allProducts.filter(p => p.kategori === kat));
};

window.cekStatusPesanan = async (id) => {
  const d = await getDoc(doc(db, "pesanan", id.toUpperCase()));
  if(d.exists()) notify(`Status ${id}: ${d.data().status}`, "#3a7bd5");
  else notify("Invoice tidak ditemukan!", "#ef4444");
};

window.muatTestimoni = async function() {
  const wadah = document.getElementById("list-testimoni");
  if(!wadah) return;
  const snap = await getDocs(collection(db, "testimoni"));
  let h = "";
  snap.forEach(d => { h += `<img src="${d.data().gambar}" style="width:120px; height:160px; object-fit:cover; border-radius:10px; flex-shrink:0;">`; });
  wadah.innerHTML = h;
};

function jalankanLiveNotif() {
  const box = document.getElementById("salesNotif");
  if(!box) return;
  setInterval(async () => {
    const snap = await getDocs(query(collection(db, "pesanan"), where("status", "==", "🎉 Pesanan Selesai")));
    const list = [];
    snap.forEach(d => list.push(d.data()));
    if(list.length > 0) {
      const d = list[Math.floor(Math.random()*list.length)];
      document.getElementById("notifUser").innerText = d.pembeli.substring(0,3) + "*** (Verified)";
      document.getElementById("notifProduk").innerText = "Membeli " + d.produk;
      box.classList.add("show");
      setTimeout(() => box.classList.remove("show"), 5000);
    }
  }, 20000);
}

// Inisialisasi awal
window.tampilProduk();
