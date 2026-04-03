import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE & PEMBAYARAN ---
const NOMOR_WA_ADMIN = "6282298627146"; 
const NO_DANA = "082298627146"; 
const NO_OVO = "082298627146";  
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

// --- FUNGSI HELPER TOAST ---
const notify = (msg, color) => {
    if (window.showToast) window.showToast(msg, color);
    else console.log(msg); // Fallback jika fungsi belum dimuat
};

// --- FUNGSI COPY OTOMATIS ---
window.salinTeks = function(teks, btn) {
  navigator.clipboard.writeText(teks).then(() => {
    const textAsli = btn.innerText;
    btn.innerText = "BERHASIL!";
    btn.style.background = "#10b981";
    notify("Nomor berhasil disalin! 📋");
    setTimeout(() => {
      btn.innerText = textAsli;
      btn.style.background = "#334155";
    }, 2000);
  });
};

// --- FUNGSI SKELETON (LOADING ANIMATION) ---
function tampilkanSkeleton() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;
  
  let skeletonHTML = "";
  for (let i = 0; i < 4; i++) {
    skeletonHTML += `
      <div class="card skeleton-loading" style="height: 280px; border: 1px solid #334155; margin-bottom: 15px; border-radius: 15px; padding:10px;">
        <div style="width: 100%; height: 150px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 10px;"></div>
        <div style="width: 80%; height: 15px; background: rgba(255,255,255,0.05); border-radius: 5px; margin-bottom: 8px;"></div>
        <div style="width: 50%; height: 15px; background: rgba(255,255,255,0.05); border-radius: 5px; margin-bottom: 12px;"></div>
        <div style="width: 100%; height: 35px; background: rgba(255,255,255,0.05); border-radius: 10px;"></div>
      </div>`;
  }
  produkDiv.innerHTML = skeletonHTML;
}

// --- 2. FUNGSI UTAMA (TAMPIL DATA) ---
window.tampilProduk = async function() {
  try {
    tampilkanSkeleton();
    const dataSnap = await getDocs(collection(db, "produk"));
    allProducts = []; 
    dataSnap.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });

    const pesananSnap = await getDocs(collection(db, "pesanan"));
    let totalCuan = 0;
    pesananSnap.forEach(docP => {
        const p = docP.data();
        if(p.status === "🎉 Pesanan Selesai") {
            totalCuan += Number(p.total || 0);
        }
    });
    
    if(document.getElementById("statCuan")) document.getElementById("statCuan").innerText = "Rp" + totalCuan.toLocaleString('id-ID');
    if(document.getElementById("statTotal")) document.getElementById("statTotal").innerText = allProducts.length;

    const infoSnap = await getDoc(doc(db, "pengaturan", "toko"));
    if (infoSnap.exists() && document.getElementById("isiPengumuman")) {
      document.getElementById("isiPengumuman").innerText = infoSnap.data().pengumuman;
    }

    renderHTML(allProducts);
    muatTestimoni(); 
    muatVoucher();
    if(window.location.href.includes("admin.html")) muatPesananMasuk();
    jalankanLiveNotif();
  } catch (error) { 
    console.error(error); 
    if(document.getElementById("produk")) document.getElementById("produk").innerHTML = "Gagal memuat data.";
  }
};

// --- 3. KELOLA PRODUK (ADMIN) ---
window.submitProduk = async function() {
  const editId = document.getElementById("editId").value;
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  
  if(!nama || !harga) return notify("Nama dan Harga wajib diisi!", "#ef4444");

  const dataObj = {
    nama: nama,
    harga: Number(harga),
    gambar: document.getElementById("gambar").value,
    deskripsi: document.getElementById("deskripsi").value,
    kategori: document.getElementById("kategori").value,
    status: editId ? document.getElementById("status")?.value || "Ready" : "Ready", 
    tanggal: new Date()
  };

  try {
    if (editId) { await updateDoc(doc(db, "produk", editId), dataObj); } 
    else { await addDoc(collection(db, "produk"), dataObj); }
    notify("Berhasil Simpan Produk! ✅"); 
    setTimeout(() => location.reload(), 1500);
  } catch (e) { notify("Gagal: " + e.message, "#ef4444"); }
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori, status) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  if(document.getElementById("displayHarga")) document.getElementById("displayHarga").value = new Intl.NumberFormat('id-ID').format(harga);
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("editId").value = id;
  notify("Mode Edit: " + nama + " ✏️", "#3a7bd5");
  window.scrollTo(0,0);
};

window.hapusProduk = async (id) => { 
    if(confirm("Hapus produk ini?")) { 
        await deleteDoc(doc(db, "produk", id)); 
        notify("Produk berhasil dihapus! 🗑️", "#ef4444");
        setTimeout(() => location.reload(), 1000); 
    } 
};

// --- 4. KELOLA VOUCHER & PENGUMUMAN (ADMIN) ---
window.tambahVoucher = async function() {
  const kode = document.getElementById("vKode").value.trim().toUpperCase();
  const potongan = Number(document.getElementById("vDiskon").value);
  const kuota = Number(document.getElementById("vKuota").value);
  if(!kode || !potongan) return notify("Lengkapi data voucher!", "#ef4444");
  try {
    await setDoc(doc(db, "vouchers", kode), { potongan, kuota });
    notify("Voucher Berhasil Disimpan! 🎟️"); 
    muatVoucher();
  } catch (e) { notify("Gagal simpan voucher!", "#ef4444"); }
};

async function muatVoucher() {
  const list = document.getElementById("listVoucherAdmin");
  if(!list) return;
  const snap = await getDocs(collection(db, "vouchers"));
  let html = "";
  snap.forEach(d => {
    html += `<div style="font-size:11px; background:#0f172a; padding:8px; margin-top:5px; border-radius:5px; border:1px solid #334155; color:white;">
      <b>${d.id}</b> - Pot: Rp${d.data().potongan.toLocaleString()} (Sisa: ${d.data().kuota}) 
      <button onclick="hapusVoucher('${d.id}')" style="background:none; color:red; border:none; float:right; cursor:pointer;">[HAPUS]</button>
    </div>`;
  });
  list.innerHTML = html;
}

window.hapusVoucher = async (id) => { 
    await deleteDoc(doc(db, "vouchers", id)); 
    notify("Voucher Dihapus!", "#ef4444");
    muatVoucher(); 
};

window.updatePengumuman = async function() {
  const teks = document.getElementById("inputPengumuman").value;
  if(!teks) return notify("Isi teks pengumuman!", "#ef4444");
  try {
    await setDoc(doc(db, "pengaturan", "toko"), { pengumuman: teks });
    notify("Running Text Diupdate! 📢", "#f1c40f");
  } catch (e) { notify("Gagal update!", "#ef4444"); }
};

// --- 5. TESTIMONI ---
window.tambahTesti = async function() {
  const img = document.getElementById("inputTesti").value;
  if(!img) return notify("Masukkan link gambar!", "#ef4444");
  try {
    await addDoc(collection(db, "testimoni"), { gambar: img });
    notify("Testimoni Ditambahkan! ✅"); 
    setTimeout(() => location.reload(), 1500);
  } catch (e) { notify("Gagal simpan testi!", "#ef4444"); }
};

async function muatTestimoni() {
  const isAdmin = window.location.href.includes("admin.html");
  const testiDiv = isAdmin ? document.getElementById("list-testimoni-admin") : document.getElementById("list-testimoni");
  
  if (!testiDiv) return;
  const snap = await getDocs(collection(db, "testimoni"));
  let html = "";
  
  snap.forEach(d => {
    const linkFull = d.data().gambar;
    const linkSimpel = linkFull.length > 25 ? linkFull.substring(0, 25) + "..." : linkFull;

    if (isAdmin) {
      html += `
        <div class="card-admin" style="display:flex; align-items:center; justify-content:space-between; background:#1e293b; padding:10px; border-radius:12px; border:1px solid #334155; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:12px; overflow:hidden; flex:1;">
            <img src="${linkFull}" style="width:45px; height:45px; object-fit:cover; border-radius:8px; border:1px solid #334155;">
            <div style="font-size:11px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${linkSimpel}</div>
          </div>
          <button onclick="window.hapusTesti('${d.id}')" class="btn-danger" style="width:auto; padding:6px 12px; font-size:10px; margin:0; border-radius:8px;">HAPUS</button>
        </div>`;
    } else {
      html += `
        <div class="card-testi" style="position:relative; flex-shrink:0;">
          <img src="${linkFull}" style="width:120px; height:160px; object-fit:cover; border-radius:10px; border:1px solid #334155;">
        </div>`;
    }
  });
  testiDiv.innerHTML = html || "<p style='text-align:center; font-size:12px; color:#64748b;'>Belum ada testimoni.</p>";
}

window.hapusTesti = async (id) => { 
    if(confirm("Hapus testimoni ini?")) { 
        await deleteDoc(doc(db, "testimoni", id)); 
        notify("Testimoni Dihapus!", "#ef4444");
        setTimeout(() => location.reload(), 1000); 
    } 
};

// --- 6. RENDER HTML ---
function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;
  const isAdmin = window.location.href.includes("admin.html");
  let html = "";

  data.forEach((p) => {
    const isSold = p.status === "Sold"; 
    const hargaFormat = Number(p.harga).toLocaleString('id-ID');
    const namaAman = p.nama.replace(/'/g, "\\'");
    const deskripsiAman = (p.deskripsi || "").replace(/'/g, "\\'").replace(/\n/g, "\\n");

    if (isAdmin) {
      html += `
        <div class="card-admin">
          <div class="card-admin-info">
            <img src="${p.gambar.split(',')[0]}">
            <div class="text-info">
              <div style="font-size:12px;">${p.nama}</div>
              <div style="color:#10b981; font-size:11px;">${isSold ? 'SOLD' : 'Rp'+hargaFormat}</div>
            </div>
          </div>
          <div class="admin-actions">
            <button class="btn-warning" onclick="window.editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${p.deskripsi}','${p.kategori}','${p.status}')">✏️</button>
            <button class="btn-danger" onclick="window.hapusProduk('${p.id}')">🗑️</button>
          </div>
        </div>`;
    } else {
      html += `
        <div class="card">
          <div class="card-img-container"><img src="${p.gambar.split(',')[0]}"></div>
          <div class="card-info">
            <h4 style="font-size:13px; margin:0;">${p.nama}</h4>
            <p onclick="window.bukaDetail('${namaAman}', '${deskripsiAman}', '${p.gambar}', ${p.harga})" style="font-size: 11px; color: #00d2ff; cursor: pointer; margin:5px 0;">🔍 Cek Detail</p>
            <div class="harga"><span class="harga-baru">Rp${hargaFormat}</span></div>
            <button class="btn-beli" ${isSold ? 'disabled' : `onclick="window.bukaStruk('${namaAman}', ${p.harga})"`}>${isSold ? 'SOLD' : 'BELI'}</button>
          </div>
        </div>`;
    }
  });
  produkDiv.innerHTML = html || "<p>Produk Kosong.</p>";
}

// --- 7. FILTER GAME (MODIFIKASI) ---
window.jalankanFilter = function(kategori) {
  if(kategori === 'Semua') renderHTML(allProducts);
  else renderHTML(allProducts.filter(p => p.kategori === kategori));
};

// --- 8. MODAL DETAIL ---
window.bukaDetail = function(nama, deskripsi, gambar, harga) {
  const daftarGambar = gambar.split(",");
  let htmlGambar = `<img src="${daftarGambar[0].trim()}" id="mainDetailImg" style="width:100%; border-radius:10px; margin-bottom:10px;">`;
  if(daftarGambar.length > 1) {
    htmlGambar += `<div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:10px;">`;
    daftarGambar.forEach(img => {
      htmlGambar += `<img src="${img.trim()}" onclick="document.getElementById('mainDetailImg').src='${img.trim()}'" style="width:60px; height:60px; object-fit:cover; border-radius:5px; cursor:pointer; border:1px solid #334155;">`;
    });
    htmlGambar += `</div>`;
  }
  document.getElementById("detailNama").innerText = nama;
  document.getElementById("detailDeskripsi").innerText = deskripsi;
  document.getElementById("detailGambarWadah").innerHTML = htmlGambar;
  document.getElementById("btnNegoWA").onclick = () => {
    notify("Membuka WhatsApp... 💬");
    window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=Halo, saya ingin nego akun: ${nama}`, '_blank');
  };
  document.getElementById("btnLanjutBeli").onclick = () => { window.tutupDetail(); window.bukaStruk(nama, harga); };
  document.getElementById("modalDetail").style.display = "flex";
};

window.tutupDetail = () => document.getElementById("modalDetail").style.display = "none";

// --- 9. BUKA STRUK & VOUCHER ---
window.bukaStruk = function(nama, harga) {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  const tgl = new Date().toLocaleDateString('id-ID');
  const jam = new Date().toLocaleTimeString('id-ID');
  
  dataPesananSementera = { produk: nama, hargaAsli: harga, total: harga, inv: inv, voucherPakai: "" };

  document.getElementById("isiStruk").innerHTML = `
    <div class="struk-header">
      <h3>FAZA STORE</h3>
      <p>PELAYANAN DIGITAL 24 JAM</p>
      <p>${tgl} | ${jam}</p>
    </div>

    <div class="struk-divider"></div>

    <div class="struk-item">
      <span>NO. INV</span>
      <span>${inv}</span>
    </div>

    <div class="struk-divider"></div>

    <div class="struk-item">
      <span style="flex:2;">${nama}</span>
      <span style="flex:1; text-align:right;">Rp${harga.toLocaleString('id-ID')}</span>
    </div>

    <div id="potonganVoucherRow" style="display:none;" class="struk-item">
      <span style="color:#ef4444;">DISKON VOUCHER</span>
      <span id="txtPotongan" style="color:#ef4444;">-Rp0</span>
    </div>

    <div class="struk-total">
      <span>TOTAL</span>
      <span id="displayTotalStruk">Rp${harga.toLocaleString('id-ID')}</span>
    </div>

    <div class="struk-divider"></div>

    <div style="margin-top:15px;">
      <label>KODE VOUCHER (OPSIONAL)</label>
      <div style="display:flex; gap:5px; margin-bottom:10px;">
        <input type="text" id="inputVoucher" placeholder="KODE" style="flex:1; margin-bottom:0; text-transform:uppercase;">
        <button onclick="window.cekVoucherAktif()" style="background:#1e293b; color:white; border:none; padding:0 12px; border-radius:6px; cursor:pointer; font-size:10px;">PAKAI</button>
      </div>

      <label>IDENTITAS PEMBELI</label>
      <input type="text" id="pembeliNama" placeholder="Nama Lengkap">
      <input type="number" id="pembeliWA" placeholder="Nomor WA (628xxx)">
      <input type="email" id="pembeliEmail" placeholder="Email (Untuk Kirim Akun)">
      
      <label>METODE PEMBAYARAN</label>
      <select id="metodeBayar" onchange="window.pilihPembayaran(this.value)">
        <option value="">-- PILIH PEMBAYARAN --</option>
        <option value="DANA">DANA (${NO_DANA})</option>
        <option value="QRIS">QRIS (OTOMATIS)</option>
      </select>
      
      <div id="wadahBayar"></div>
      
      <label>BUKTI TRANSFER (LINK FOTO)</label>
      <input type="text" id="buktiTransfer" placeholder="Tempel link bukti di sini">
    </div>

    <div class="struk-footer">
      --- TERIMA KASIH ---<br>
      BARANG YANG SUDAH DIBELI<br>
      TIDAK DAPAT DITUKAR KEMBALI
    </div>
  `;
  document.getElementById("modalStruk").style.display = "flex";
};

/*window.bukaStruk = function(nama, harga) {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  dataPesananSementera = { produk: nama, hargaAsli: harga, total: harga, inv: inv, voucherPakai: "" };
  document.getElementById("isiStruk").innerHTML = `
    <div style="font-size: 13px; color: #333;">
        <p><b>Invoice:</b> ${inv}</p>
        <p><b>Produk:</b> ${nama}</p>
        <p style="color:#10b981;"><b>Total Bayar:</b> <span id="displayTotalStruk" style="font-weight:bold;">Rp${harga.toLocaleString('id-ID')}</span></p>
    </div>
    <label style="font-size:11px; font-weight:bold; margin-top:10px; display:block;">VOUCHER</label>
    <div style="display:flex; gap:5px; margin-bottom:10px;">
      <input type="text" id="inputVoucher" placeholder="KODE" style="flex:1; text-transform:uppercase; padding:8px; border:1px solid #ddd; border-radius:5px;">
      <button onclick="window.cekVoucherAktif()" style="background:#0f172a; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">PAKAI</button>
    </div>
    <div id="pesanVoucher" style="font-size:10px; margin-top:-5px; margin-bottom:10px;"></div>
    <label>Nama Pembeli:</label><input type="text" id="pembeliNama">
    <label>WhatsApp:</label><input type="number" id="pembeliWA" placeholder="628xxx">
    <label>Email Pengiriman:</label><input type="email" id="pembeliEmail">
    <label>Metode Bayar:</label>
    <select id="metodeBayar" onchange="window.pilihPembayaran(this.value)">
      <option value="">-- Pilih --</option>
      <option value="DANA">DANA (${NO_DANA})</option>
      <option value="QRIS">QRIS (Scan Gambar)</option>
    </select>
    <div id="wadahBayar" style="text-align:center; margin-top:10px;"></div>
    <label>Link Bukti Transfer:</label><input type="text" id="buktiTransfer" placeholder="Tempel link foto bukti">
  `;
  document.getElementById("modalStruk").style.display = "flex";
};*/

window.cekVoucherAktif = async function() {
    const kode = document.getElementById("inputVoucher").value.trim().toUpperCase();
    if(!kode) return notify("Isi kode dulu!", "#ef4444");
    try {
        const vSnap = await getDoc(doc(db, "vouchers", kode));
        if (vSnap.exists() && vSnap.data().kuota > 0) {
            const pot = vSnap.data().potongan;
            dataPesananSementera.total = dataPesananSementera.hargaAsli - pot;
            dataPesananSementera.voucherPakai = kode;
            document.getElementById("displayTotalStruk").innerText = "Rp" + dataPesananSementera.total.toLocaleString('id-ID');
            notify("Voucher Berhasil Dipasang! ✅");
            document.getElementById("pesanVoucher").innerHTML = `<span style="color:green; font-weight:bold;">✔️ Potongan Rp${pot.toLocaleString()} Berhasil!</span>`;
        } else { 
            notify("Voucher tidak valid!", "#ef4444");
            document.getElementById("pesanVoucher").innerHTML = `<span style="color:red;">❌ Voucher tidak valid/habis!</span>`; 
        }
    } catch (e) { console.error(e); }
};

window.pilihPembayaran = function(val) {
  const wadah = document.getElementById("wadahBayar");
  if(val === "QRIS") {
      wadah.innerHTML = `<img src="${URL_QRIS}" style="width:150px; border-radius:10px;">`;
      notify("Silakan Scan QRIS 📸", "#3a7bd5");
  } else if(val === "DANA") {
      wadah.innerHTML = `
        <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-top:10px; border:1px dashed #334155;">
          <p style="font-size:11px; margin:0 0 5px;">Transfer ke DANA:</p>
          <p style="font-size:14px; font-weight:800; color:#0f172a; margin:0 0 10px;">${NO_DANA}</p>
          <button onclick="window.salinTeks('${NO_DANA}', this)" style="background:#334155; color:white; border:none; padding:5px 15px; border-radius:5px; font-size:10px; cursor:pointer;">SALIN NOMOR</button>
        </div>`;
      notify("Silakan Transfer ke DANA 📱", "#3a7bd5");
  } else { wadah.innerHTML = ""; }
};

window.tutupStruk = () => document.getElementById("modalStruk").style.display = "none";

// --- 10. PROSES PESANAN ---
window.kirimInvoiceWA = async function() {
  const pNama = document.getElementById("pembeliNama").value;
  const pWA = document.getElementById("pembeliWA").value;
  const pEmail = document.getElementById("pembeliEmail").value;
  const metode = document.getElementById("metodeBayar").value;
  const bukti = document.getElementById("buktiTransfer").value;

  if(!pNama || !pWA || !pEmail || !metode || !bukti) return notify("Lengkapi data pembeli!", "#ef4444");

  try {
    if(dataPesananSementera.voucherPakai) {
        const vRef = doc(db, "vouchers", dataPesananSementera.voucherPakai);
        const vSnap = await getDoc(vRef);
        if(vSnap.exists()) await updateDoc(vRef, { kuota: vSnap.data().kuota - 1 });
    }
    await setDoc(doc(db, "pesanan", dataPesananSementera.inv), { 
      ...dataPesananSementera, pembeli: pNama, whatsapp: pWA, email: pEmail, metode, bukti, status: "⏳ Menunggu Validasi", tanggal: new Date() 
    });
    notify("Pesanan Terkirim! Mohon tunggu konfirmasi. 🚀"); 
    setTimeout(() => location.reload(), 2000);
  } catch (e) { notify("Gagal memproses pesanan!", "#ef4444"); }
};

// --- 11. ADMIN: PESANAN MASUK & AUTO SOLD ---
async function muatPesananMasuk() {
  const list = document.getElementById("listPesananAdmin");
  if(!list) return;
  const snap = await getDocs(collection(db, "pesanan"));
  let html = "";
  snap.forEach(d => {
    const p = d.data();
    const isSelesai = p.status === "🎉 Pesanan Selesai";
    
    html += `
      <div class="order-item-admin ${isSelesai ? 'status-selesai' : ''}">
        <p><b>ID:</b> ${d.id} | <b>Pembeli:</b> ${p.pembeli}</p>
        <p><b>WA:</b> <a class="wa-tag" href="https://wa.me/${p.whatsapp}" target="_blank">WhatsApp</a></p>
        <p><b>Produk:</b> ${p.produk}</p>
        <p><b>Bukti:</b> <a href="${p.bukti}" target="_blank" style="color:#10b981; font-weight:bold;">Lihat Bukti Transfer</a></p>
        
        ${!isSelesai ? `
          <textarea id="dataAkun_${d.id}" placeholder="Tulis data akun (Email:Pass) di sini..." style="width:100%; height:50px; background:#f4f4f4; border:1px solid #ddd; margin:10px 0; border-radius:5px; padding:5px; color:#333;"></textarea>
          <button onclick="window.kirimDataEmail('${d.id}', '${p.email}', '${p.produk}', '${p.pembeli}')" class="btn-success">📧 KIRIM DATA KE EMAIL</button>
        ` : `
          <button class="btn-selesai-muted" disabled>✅ DATA SUDAH DIKIRIM (SOLD)</button>
        `}
        
        <button onclick="window.hapusPesanan('${d.id}')" style="background:none; color:#ef4444; border:none; cursor:pointer; font-size:11px; margin-top:10px; width:100%;">Hapus Riwayat Pesanan</button>
      </div>`;
  });
  list.innerHTML = html || "Belum ada pesanan.";
}

window.kirimDataEmail = async function(invId, emailTujuan, produk, namaPembeli) {
    const dataAkun = document.getElementById(`dataAkun_${invId}`).value;
    if(!dataAkun) return notify("Isi data akun dulu!", "#ef4444");
    
    notify("Sedang mengirim email... 📧", "#3a7bd5");

    try {
        await emailjs.send("service_xe358l6", "template_2j4eu9o", {
            nama_pembeli: namaPembeli,
            email_pembeli: emailTujuan,
            nama_akun: produk,
            data_akun: dataAkun
        });

        await updateDoc(doc(db, "pesanan", invId), { status: "🎉 Pesanan Selesai" });

        const q = query(collection(db, "produk"), where("nama", "==", produk));
        const qSnap = await getDocs(q);
        qSnap.forEach(async (docProduk) => {
            await updateDoc(doc(db, "produk", docProduk.id), { status: "Sold" });
        });

        notify("Data Terkirim & Produk SOLD! 📧🚀"); 
        muatPesananMasuk(); 
    } catch (e) { notify("Gagal Kirim!", "#ef4444"); }
};

window.hapusPesanan = async (id) => { 
    if(confirm("Hapus pesanan?")) { 
        await deleteDoc(doc(db, "pesanan", id)); 
        notify("Pesanan Dihapus!", "#ef4444");
        muatPesananMasuk(); 
    } 
};

// --- 12. LACAK PESANAN ---
window.cekStatusPesanan = async function() {
    const invId = document.getElementById("inputCekPesanan").value.trim().toUpperCase();
    if(!invId) return notify("Masukkan ID Invoice!", "#ef4444");
    
    const docSnap = await getDoc(doc(db, "pesanan", invId));
    if (docSnap.exists()) {
        const p = docSnap.data();
        notify(`ID: ${invId} | Status: ${p.status}`, "#3a7bd5");
    } else { notify("Invoice tidak ditemukan! ❌", "#ef4444"); }
};

// --- 13. LIVE SALES NOTIFIKASI ---
async function jalankanLiveNotif() {
  const notifBox = document.getElementById("salesNotif");
  if(!notifBox) return;

  const snap = await getDocs(collection(db, "pesanan"));
  let listSelesai = [];
  
  snap.forEach(d => { 
    if(d.data().status === "🎉 Pesanan Selesai") {
        listSelesai.push(d.data()); 
    }
  });

  if(listSelesai.length === 0) return;

  setInterval(() => {
    const data = listSelesai[Math.floor(Math.random() * listSelesai.length)];
    document.getElementById("notifUser").innerText = data.pembeli.substring(0, 2) + "*** (Verified)";
    document.getElementById("notifProduk").innerText = "Baru saja membeli " + data.produk;
    notifBox.classList.add("show");
    setTimeout(() => {
        notifBox.classList.remove("show");
    }, 5000);
  }, 15000);
}

// Jalankan fungsi awal
window.tampilProduk();
