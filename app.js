Import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE ---
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
let base64Bukti = ""; 

// Fungsi Notify (Panggil Toast dari Index)
const notify = (msg, color) => {
    if (window.showToast) window.showToast(msg, color);
    else console.log(msg);
};

// --- LOGIKA UPLOAD FOTO (ID: buktiTransferFile) ---
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'buktiTransferFile') {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                notify("Foto terlalu besar! Max 1MB.", "#ef4444");
                e.target.value = "";
                return;
            }
            const reader = new FileReader();
            reader.onloadend = function() {
                base64Bukti = reader.result; 
                notify("Foto Bukti Berhasil Dimuat! ✅", "#10b981");
            }
            reader.readAsDataURL(file);
        }
    }
});

// --- TAMPIL DATA ---
window.tampilProduk = async function() {
  try {
    const dataSnap = await getDocs(collection(db, "produk"));
    allProducts = []; 
    dataSnap.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderHTML(allProducts);
    
    const infoSnap = await getDoc(doc(db, "pengaturan", "toko"));
    if (infoSnap.exists()) {
      document.getElementById("isiPengumuman").innerText = infoSnap.data().pengumuman;
    }
  } catch (error) { console.error(error); }
};

function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;
  let html = "";
  data.forEach((p) => {
    const isSold = p.status === "Sold"; 
    html += `
      <div class="card">
        <div class="badge">${p.kategori}</div>
        <img src="${p.gambar.split(',')[0]}">
        <div class="card-info">
          <h4 style="margin:0; font-size:13px;">${p.nama}</h4>
          <span class="harga-baru">Rp${Number(p.harga).toLocaleString('id-ID')}</span>
          <button class="btn-beli" ${isSold ? 'disabled' : `onclick="window.bukaStruk('${p.nama.replace(/'/g, "\\'")}', ${p.harga})"`}>
            ${isSold ? 'SOLD' : 'BELI'}
          </button>
        </div>
      </div>`;
  });
  produkDiv.innerHTML = html || "<p>Produk tidak ditemukan.</p>";
}

// --- LOGIKA STRUK ---
window.bukaStruk = function(nama, harga) {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  base64Bukti = ""; 
  dataPesananSementera = { produk: nama, hargaAsli: harga, total: harga, inv: inv };

  document.getElementById("isiStruk").innerHTML = `
    <div class="struk-header">
      <h3>FAZA STORE</h3>
      <p>ID INVOICE: <b>${inv}</b></p>
    </div>
    <div class="struk-divider"></div>
    <div class="struk-item"><span>PRODUK:</span> <span>${nama}</span></div>
    <div class="struk-total"><span>TOTAL:</span> <span>Rp${harga.toLocaleString('id-ID')}</span></div>
    <div class="struk-divider"></div>
    
    <label>NAMA LENGKAP</label>
    <input type="text" id="pembeliNama" placeholder="Sesuai KTP/E-Wallet">
    <label>WHATSAPP (628xxx)</label>
    <input type="number" id="pembeliWA" placeholder="62822986xxxxx">
    <label>EMAIL (KIRIM AKUN)</label>
    <input type="email" id="pembeliEmail" placeholder="nama@email.com">
    <label>METODE BAYAR</label>
    <select id="metodeBayar" onchange="window.pilihPembayaran(this.value)">
      <option value="">-- PILIH PEMBAYARAN --</option>
      <option value="DANA">DANA (${NO_DANA})</option>
      <option value="QRIS">QRIS OTOMATIS</option>
    </select>
    <div id="wadahBayar"></div>
    <label>UPLOAD BUKTI TRANSFER</label>
    <input type="file" id="buktiTransferFile" accept="image/*">
  `;
  document.getElementById("modalStruk").style.display = "flex";
};

window.pilihPembayaran = function(val) {
  const wadah = document.getElementById("wadahBayar");
  if(val === "QRIS") wadah.innerHTML = `<img src="${URL_QRIS}" style="width:150px; display:block; margin:10px auto; border-radius:10px;">`;
  else if(val === "DANA") wadah.innerHTML = `<div style="background:#f1f5f9; padding:10px; border-radius:5px; text-align:center; font-size:12px; margin:10px 0;">Transfer ke DANA: <b>${NO_DANA}</b></div>`;
  else wadah.innerHTML = "";
};

// --- EKSEKUSI PEMBAYARAN (FIX UNTUK INDEX.HTML) ---
window.handleConfirmBayar = async function() {
  const nama = document.getElementById("pembeliNama")?.value;
  const wa = document.getElementById("pembeliWA")?.value;
  const email = document.getElementById("pembeliEmail")?.value;
  const metode = document.getElementById("metodeBayar")?.value;

  // Validasi
  if(!nama || !wa || !email || !metode) {
    return notify("Lengkapi semua data pembeli! ⚠️", "#ef4444");
  }
  if(!base64Bukti) {
    return notify("Bukti transfer wajib diupload! 📸", "#ef4444");
  }

  try {
    notify("Sedang memproses... Jangan tutup halaman", "#3a7bd5");

    await setDoc(doc(db, "pesanan", dataPesananSementera.inv), { 
      ...dataPesananSementera, 
      pembeli: nama, 
      whatsapp: wa, 
      email: email, 
      metode: metode, 
      bukti: base64Bukti, 
      status: "⏳ Menunggu Validasi", 
      tanggal: new Date() 
    });

    notify("Pesanan Berhasil! Mengalihkan ke WA...", "#10b981");
    
    const pesanWA = `Halo Admin Faza Store, saya *${nama}* ingin konfirmasi pembayaran.\n\n` +
                    `📦 Produk: ${dataPesananSementera.produk}\n` +
                    `📑 Inv: ${dataPesananSementera.inv}\n` +
                    `💰 Total: Rp${dataPesananSementera.total.toLocaleString('id-ID')}\n\n` +
                    `Mohon segera diproses ya!`;

    window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesanWA)}`, '_blank');

    setTimeout(() => location.reload(), 2000);
  } catch (e) {
    console.error(e);
    notify("Gagal menyimpan pesanan!", "#ef4444");
  }
};

// --- FUNGSI LAIN ---
window.jalankanFilter = function(game) {
  if (game === "Semua") renderHTML(allProducts);
  else renderHTML(allProducts.filter(p => p.kategori === game));
};

window.cekStatusPesanan = async function(invId) {
    const docSnap = await getDoc(doc(db, "pesanan", invId.toUpperCase()));
    if (docSnap.exists()) {
        notify(`ID: ${invId} | Status: ${docSnap.data().status}`, "#3a7bd5");
    } else {
        notify("Invoice tidak ditemukan!", "#ef4444");
    }
};

// Jalankan Awal
window.tampilProduk();
