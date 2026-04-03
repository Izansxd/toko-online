import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
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

const notify = (msg, color) => {
    if (window.showToast) window.showToast(msg, color);
    else console.log(msg); 
};

// --- LOGIKA UPLOAD FOTO ---
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

// --- FUNGSI UTAMA TOKO ---
window.tampilProduk = async function() {
  try {
    const dataSnap = await getDocs(collection(db, "produk"));
    allProducts = []; 
    dataSnap.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderHTML(allProducts);
    if(window.location.href.includes("admin.html")) muatPesananMasuk();
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
        <img src="${p.gambar.split(',')[0]}" style="width:100%; border-radius:10px;">
        <h4>${p.nama}</h4>
        <p>Rp${Number(p.harga).toLocaleString('id-ID')}</p>
        <button class="btn-beli" ${isSold ? 'disabled' : `onclick="window.bukaStruk('${p.nama.replace(/'/g, "\\'")}', ${p.harga})"`}>
          ${isSold ? 'SOLD' : 'BELI'}
        </button>
      </div>`;
  });
  produkDiv.innerHTML = html;
}

// --- LOGIKA PESANAN (FIX VALIDASI) ---
window.bukaStruk = function(nama, harga) {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  base64Bukti = ""; // Reset foto
  dataPesananSementera = { produk: nama, hargaAsli: harga, total: harga, inv: inv, voucherPakai: "" };

  document.getElementById("isiStruk").innerHTML = `
    <div style="text-align:center;">
      <h3>FAZA STORE</h3>
      <p>ID: ${inv}</p>
      <hr>
      <p>${nama} - Rp${harga.toLocaleString('id-ID')}</p>
      <h4 id="displayTotalStruk">TOTAL: Rp${harga.toLocaleString('id-ID')}</h4>
    </div>
    <div style="margin-top:15px;">
      <label>Nama Lengkap</label>
      <input type="text" id="pembeliNama" placeholder="Nama..." required>
      <label>WhatsApp</label>
      <input type="number" id="pembeliWA" placeholder="628..." required>
      <label>Email</label>
      <input type="email" id="pembeliEmail" placeholder="Email kirim akun..." required>
      <label>Metode</label>
      <select id="metodeBayar" onchange="window.pilihPembayaran(this.value)">
        <option value="">-- PILIH --</option>
        <option value="DANA">DANA - ${NO_DANA}</option>
        <option value="QRIS">QRIS (Otomatis)</option>
      </select>
      <div id="wadahBayar"></div>
      <label>Upload Bukti Transfer</label>
      <input type="file" id="buktiTransferFile" accept="image/*">
      <button onclick="window.prosesKonfirmasiAkhir()" style="width:100%; padding:10px; background:#10b981; color:white; border:none; margin-top:10px; border-radius:5px; cursor:pointer;">KONFIRMASI PEMBAYARAN</button>
    </div>
  `;
  document.getElementById("modalStruk").style.display = "flex";
};

window.pilihPembayaran = function(val) {
  const wadah = document.getElementById("wadahBayar");
  if(val === "QRIS") wadah.innerHTML = `<img src="${URL_QRIS}" style="width:150px; margin:10px auto; display:block;">`;
  else if(val === "DANA") wadah.innerHTML = `<div style="background:#eee; padding:10px; border-radius:5px; text-align:center; margin:10px 0;">Transfer ke: <b>${NO_DANA}</b></div>`;
  else wadah.innerHTML = "";
};

// FUNGSI KONFIRMASI YANG SUDAH DIPERBAIKI
window.prosesKonfirmasiAkhir = async function() {
  const nama = document.getElementById("pembeliNama").value;
  const wa = document.getElementById("pembeliWA").value;
  const email = document.getElementById("pembeliEmail").value;
  const metode = document.getElementById("metodeBayar").value;

  if(!nama || !wa || !email || !metode) {
    return notify("Woi! Isi dulu semua datanya!", "#ef4444");
  }

  if(!base64Bukti) {
    return notify("Bukti transfernya mana? Upload dulu!", "#ef4444");
  }

  try {
    notify("Sabar, lagi ngirim pesanan... ⏳", "#3a7bd5");
    
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

    notify("Pesanan Berhasil! Menuju WhatsApp Admin...", "#10b981");
    
    const textWA = `Halo Faza Store, saya ${nama} mau konfirmasi order ${dataPesananSementera.produk} (Inv: ${dataPesananSementera.inv}). Cek web ya!`;
    window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(textWA)}`, '_blank');

    setTimeout(() => location.reload(), 2000);
  } catch (e) {
    notify("Gagal simpan ke database!", "#ef4444");
  }
};

window.tampilProduk();
