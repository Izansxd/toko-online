import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

// --- 2. FUNGSI UTAMA (TAMPIL DATA) ---
window.tampilProduk = async function() {
  try {
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
  } catch (error) { console.error(error); }
};

// --- 3. KELOLA PRODUK (ADMIN) ---
window.submitProduk = async function() {
  const editId = document.getElementById("editId").value;
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  
  if(!nama || !harga) return alert("Nama dan Harga wajib diisi!");

  const dataObj = {
    nama: nama,
    harga: Number(harga),
    gambar: document.getElementById("gambar").value,
    deskripsi: document.getElementById("deskripsi").value,
    kategori: document.getElementById("kategori").value,
    status: document.getElementById("status").value,
    tanggal: new Date()
  };

  try {
    if (editId) { await updateDoc(doc(db, "produk", editId), dataObj); } 
    else { await addDoc(collection(db, "produk"), dataObj); }
    alert("Berhasil Simpan Produk!"); location.reload();
  } catch (e) { alert("Gagal: " + e.message); }
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori, status) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  if(document.getElementById("displayHarga")) document.getElementById("displayHarga").value = new Intl.NumberFormat('id-ID').format(harga);
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("status").value = status;
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

window.hapusProduk = async (id) => { if(confirm("Hapus produk ini?")) { await deleteDoc(doc(db, "produk", id)); location.reload(); } };

// --- 4. KELOLA VOUCHER & PENGUMUMAN (ADMIN) ---
window.tambahVoucher = async function() {
  const kode = document.getElementById("vKode").value.trim().toUpperCase();
  const potongan = Number(document.getElementById("vDiskon").value);
  const kuota = Number(document.getElementById("vKuota").value);
  if(!kode || !potongan) return alert("Lengkapi data voucher!");
  try {
    await setDoc(doc(db, "vouchers", kode), { potongan, kuota });
    alert("Voucher Berhasil Disimpan!"); muatVoucher();
  } catch (e) { alert("Gagal!"); }
};

async function muatVoucher() {
  const list = document.getElementById("listVoucherAdmin");
  if(!list) return;
  const snap = await getDocs(collection(db, "vouchers"));
  let html = "";
  snap.forEach(d => {
    html += `<div style="font-size:11px; background:#0f172a; padding:8px; margin-top:5px; border-radius:5px; border:1px solid #334155;">
      <b>${d.id}</b> - Pot: Rp${d.data().potongan.toLocaleString()} (Sisa: ${d.data().kuota}) 
      <button onclick="hapusVoucher('${d.id}')" style="background:none; color:red; border:none; float:right; cursor:pointer;">[HAPUS]</button>
    </div>`;
  });
  list.innerHTML = html;
}

window.hapusVoucher = async (id) => { await deleteDoc(doc(db, "vouchers", id)); muatVoucher(); };

window.updatePengumuman = async function() {
  const teks = document.getElementById("inputPengumuman").value;
  if(!teks) return alert("Isi teks pengumuman!");
  try {
    await setDoc(doc(db, "pengaturan", "toko"), { pengumuman: teks });
    alert("Running Text Berhasil Diupdate!");
  } catch (e) { alert("Gagal!"); }
};

// --- 5. TESTIMONI ---
window.tambahTesti = async function() {
  const img = document.getElementById("inputTesti").value;
  if(!img) return alert("Masukkan link gambar!");
  try {
    await addDoc(collection(db, "testimoni"), { gambar: img });
    alert("Testimoni Berhasil Ditambah!"); location.reload();
  } catch (e) { alert("Gagal!"); }
};

async function muatTestimoni() {
  const testiDiv = document.getElementById("list-testimoni");
  if (!testiDiv) return;
  const snap = await getDocs(collection(db, "testimoni"));
  let html = "";
  snap.forEach(d => {
    const isAdmin = window.location.href.includes("admin.html");
    html += `
      <div class="card-testi" style="position:relative; flex-shrink:0;">
        <img src="${d.data().gambar}" style="width:120px; height:160px; object-fit:cover; border-radius:10px; border:1px solid #334155;">
        ${isAdmin ? `<button onclick="hapusTesti('${d.id}')" style="position:absolute; top:5px; right:5px; background:red; color:white; border:none; border-radius:50%; width:25px; height:25px; cursor:pointer;">X</button>` : ''}
      </div>`;
  });
  testiDiv.innerHTML = html || "<p>Belum ada testimoni.</p>";
}

window.hapusTesti = async (id) => { if(confirm("Hapus?")) { await deleteDoc(doc(db, "testimoni", id)); location.reload(); } };

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
          <img src="${p.gambar.split(',')[0]}">
          <div style="flex:1"><h4 style="margin:0; font-size:12px;">${p.nama}</h4><p style="margin:0; color:#10b981; font-size:11px;">Rp${hargaFormat}</p></div>
          <div style="display:flex; gap:5px;">
            <button onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${p.deskripsi}','${p.kategori}','${p.status}')">✏️</button>
            <button onclick="hapusProduk('${p.id}')">🗑️</button>
          </div>
        </div>`;
    } else {
      html += `
        <div class="card">
          <div class="card-img-container"><img src="${p.gambar.split(',')[0]}"></div>
          <div class="card-info">
            <h4 style="font-size:13px; margin:0;">${p.nama}</h4>
            <p onclick="bukaDetail('${namaAman}', '${deskripsiAman}', '${p.gambar}', ${p.harga})" style="font-size: 11px; color: #00d2ff; cursor: pointer; margin:5px 0;">🔍 Cek Detail</p>
            <div class="harga"><span class="harga-baru">Rp${hargaFormat}</span></div>
            <button class="btn-beli" ${isSold ? 'disabled' : `onclick="bukaStruk('${namaAman}', ${p.harga})"`}>${isSold ? 'SOLD' : 'BELI'}</button>
          </div>
        </div>`;
    }
  });
  produkDiv.innerHTML = html || "<p>Produk Kosong.</p>";
}

// --- 7. FILTER GAME ---
window.filterGame = function(el, kategori) {
  const btns = document.querySelectorAll('.btn-filter');
  btns.forEach(b => b.classList.remove('active'));
  el.classList.add('active');

  if(kategori === 'Semua') {
    renderHTML(allProducts);
  } else {
    const filtered = allProducts.filter(p => p.kategori === kategori);
    renderHTML(filtered);
  }
};

// --- 8. MODAL DETAIL & STRUK ---
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
  
  const btnNego = document.getElementById("btnNegoWA");
  btnNego.onclick = () => window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=Halo, saya ingin nego akun: ${nama}`, '_blank');
  
  document.getElementById("btnLanjutBeli").onclick = () => { tutupDetail(); window.bukaStruk(nama, harga); };
  document.getElementById("modalDetail").style.display = "flex";
};

window.tutupDetail = () => document.getElementById("modalDetail").style.display = "none";

window.bukaStruk = function(nama, harga) {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  dataPesananSementera = { produk: nama, total: harga, inv: inv };
  
  document.getElementById("isiStruk").innerHTML = `
    <p style="margin:5px 0;"><b>Invoice:</b> ${inv}</p>
    <p style="margin:5px 0;"><b>Produk:</b> ${nama}</p>
    <hr>
    <label>Nama Pembeli:</label><input type="text" id="pembeliNama">
    <label>WhatsApp:</label><input type="number" id="pembeliWA" placeholder="628xxx">
    <label>Email Pengiriman:</label><input type="email" id="pembeliEmail">
    <label>Metode Bayar:</label>
    <select id="metodeBayar" onchange="pilihPembayaran(this.value)">
      <option value="">-- Pilih --</option>
      <option value="DANA">DANA (${NO_DANA})</option>
      <option value="QRIS">QRIS (Scan Gambar)</option>
    </select>
    <div id="wadahBayar" style="text-align:center; margin-top:10px;"></div>
    <label>Link Bukti Transfer:</label><input type="text" id="buktiTransfer" placeholder="Tempel link foto bukti">
  `;
  document.getElementById("modalStruk").style.display = "flex";
};

window.pilihPembayaran = function(val) {
  const wadah = document.getElementById("wadahBayar");
  if(val === "QRIS") wadah.innerHTML = `<img src="${URL_QRIS}" style="width:150px;">`;
  else if(val === "DANA") wadah.innerHTML = `<b>Transfer ke: ${NO_DANA}</b>`;
  else wadah.innerHTML = "";
};

window.tutupStruk = () => document.getElementById("modalStruk").style.display = "none";

// --- 9. PROSES PESANAN ---
window.kirimInvoiceWA = async function() {
  const pNama = document.getElementById("pembeliNama").value;
  const pWA = document.getElementById("pembeliWA").value;
  const pEmail = document.getElementById("pembeliEmail").value;
  const metode = document.getElementById("metodeBayar").value;
  const bukti = document.getElementById("buktiTransfer").value;

  if(!pNama || !pWA || !pEmail || !metode || !bukti) return alert("Lengkapi data!");

  try {
    await setDoc(doc(db, "pesanan", dataPesananSementera.inv), { 
      ...dataPesananSementera, 
      pembeli: pNama, 
      whatsapp: pWA, 
      email: pEmail, 
      metode, 
      bukti, 
      status: "⏳ Menunggu Validasi", 
      tanggal: new Date() 
    });
    alert("Pesanan Berhasil! Menunggu validasi admin.");
    location.reload();
  } catch (e) { alert("Gagal!"); }
};

// --- 10. ADMIN: PESANAN MASUK ---
async function muatPesananMasuk() {
  const list = document.getElementById("listPesananAdmin");
  if(!list) return;
  const snap = await getDocs(collection(db, "pesanan"));
  let html = "";
  snap.forEach(d => {
    const p = d.data();
    html += `
      <div class="order-item-admin" style="background:white; color:#333; padding:15px; border-radius:10px; margin-bottom:10px; border-left:5px solid #10b981;">
        <p><b>ID:</b> ${d.id} | <b>Penerima:</b> ${p.pembeli}</p>
        <p><b>WA:</b> <a href="https://wa.me/${p.whatsapp}" target="_blank" class="wa-tag">${p.whatsapp}</a></p>
        <p><b>Email:</b> ${p.email}</p>
        <p><b>Bukti:</b> <a href="${p.bukti}" target="_blank">Lihat Bukti</a></p>
        <textarea id="dataAkun_${d.id}" placeholder="Isi data akun di sini..." style="width:100%; height:50px; color:#000; background:#eee;"></textarea>
        <button onclick="kirimDataEmail('${d.id}', '${p.email}', '${p.produk}', '${p.pembeli}')" class="btn-success" style="padding:5px; font-size:12px;">📧 KIRIM KE EMAIL</button>
        <button onclick="hapusPesanan('${d.id}')" style="background:none; color:red; border:none; cursor:pointer; font-size:10px;">Hapus Data</button>
      </div>`;
  });
  list.innerHTML = html || "Kosong.";
}

window.kirimDataEmail = async function(invId, emailTujuan, produk, namaPembeli) {
    const dataAkun = document.getElementById(`dataAkun_${invId}`).value;
    if(!dataAkun) return alert("Isi data akun dulu!");
    try {
        await emailjs.send("service_xe358l6", "template_2j4eu9o", {
            nama_pembeli: namaPembeli,
            email_pembeli: emailTujuan,
            nama_akun: produk,
            data_akun: dataAkun
        });
        await updateDoc(doc(db, "pesanan", invId), { status: "🎉 Pesanan Selesai" });
        alert("Email Berhasil Terkirim!"); location.reload();
    } catch (e) { alert("Gagal Kirim Email!"); }
};

window.hapusPesanan = async (id) => { if(confirm("Hapus pesanan?")) { await deleteDoc(doc(db, "pesanan", id)); location.reload(); } };

// Jalankan Awal
window.tampilProduk();
