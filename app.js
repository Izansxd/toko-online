import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE ---
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
};

// --- LOGIKA UPLOAD FOTO ---
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'buktiTransferFile') {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                base64Bukti = reader.result; 
                notify("Bukti Transfer Terlampir! ✅", "#10b981");
            };
            reader.readAsDataURL(file);
        }
    }
});

// ==========================================
//           BAGIAN HALAMAN UTAMA
// ==========================================

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
      const pengumumanEl = document.getElementById("isiPengumuman");
      if(pengumumanEl) pengumumanEl.innerText = infoSnap.data().pengumuman;
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
  produkDiv.innerHTML = html || "<p>Produk tidak tersedia.</p>";
}

window.bukaStruk = function(nama, harga) {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  base64Bukti = ""; 
  dataPesananSementera = { produk: nama, harga: harga, inv: inv };

  const isiStruk = document.getElementById("isiStruk");
  if(!isiStruk) return;

  isiStruk.innerHTML = `
    <div class="struk-header">
      <h3>FAZA STORE</h3>
      <p>ID INVOICE: <b>${inv}</b></p>
    </div>
    <div class="struk-divider"></div>
    <div class="struk-item"><span>PRODUK:</span> <span>${nama}</span></div>
    <div class="struk-total"><span>TOTAL:</span> <span>Rp${harga.toLocaleString('id-ID')}</span></div>
    <div class="struk-divider"></div>
    
    <label>NAMA PEMBELI</label>
    <input type="text" id="pembeliNama" placeholder="Nama Lengkap">
    <label>WHATSAPP</label>
    <input type="number" id="pembeliWA" placeholder="628xxxx">
    <label>EMAIL (PENGIRIMAN AKUN)</label>
    <input type="email" id="pembeliEmail" placeholder="email@aktif.com">
    <label>METODE BAYAR</label>
    <select id="metodeBayar" onchange="window.pilihPembayaran(this.value)">
      <option value="">-- PILIH --</option>
      <option value="DANA">DANA (${NO_DANA})</option>
      <option value="QRIS">QRIS</option>
    </select>
    <div id="wadahBayar"></div>
    <label>UPLOAD BUKTI TRANSFER</label>
    <input type="file" id="buktiTransferFile" accept="image/*">
  `;
  document.getElementById("modalStruk").style.display = "flex";
};

window.pilihPembayaran = function(val) {
  const wadah = document.getElementById("wadahBayar");
  if(val === "QRIS") wadah.innerHTML = `<img src="${URL_QRIS}" style="width:120px; display:block; margin:10px auto;">`;
  else if(val === "DANA") wadah.innerHTML = `<div style="background:#f1f5f9; padding:8px; border-radius:5px; text-align:center; font-size:11px; margin:5px 0;">Transfer ke DANA: <b>${NO_DANA}</b></div>`;
  else wadah.innerHTML = "";
};

window.handleConfirmBayar = async function() {
  const nama = document.getElementById("pembeliNama")?.value;
  const wa = document.getElementById("pembeliWA")?.value;
  const email = document.getElementById("pembeliEmail")?.value;
  const metode = document.getElementById("metodeBayar")?.value;

  if(!nama || !wa || !email || !metode || !base64Bukti) {
    return notify("Lengkapi data & bukti bayar! ⚠️", "#ef4444");
  }

  try {
    notify("Sedang memproses pesanan... ⏳", "#3a7bd5");

    await setDoc(doc(db, "pesanan", dataPesananSementera.inv), { 
      ...dataPesananSementera, 
      pembeli: nama, 
      whatsapp: wa, 
      email: email, 
      metode: metode, 
      bukti: base64Bukti, 
      status: "⏳ Pending", 
      tanggal: new Date() 
    });

    notify("Berhasil! Admin akan segera memproses. ✅", "#10b981");

    setTimeout(() => {
        document.getElementById("modalStruk").style.display = "none";
        alert("Terima kasih! Pesanan " + dataPesananSementera.inv + " sukses. Silahkan tunggu admin memvalidasi.");
    }, 1500);

  } catch (e) {
    console.error(e);
    notify("Gagal mengirim! Coba lagi.", "#ef4444");
  }
};

// ==========================================
//           BAGIAN HALAMAN ADMIN
// ==========================================

window.muatPesananAdmin = function() {
  const wadah = document.getElementById("listPesananAdmin");
  if (!wadah) return;

  const q = query(collection(db, "pesanan"), orderBy("tanggal", "desc"));
  
  onSnapshot(q, (snapshot) => {
    let html = "";
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const id = docSnap.id;
      const isSelesai = d.status === "Selesai";

      html += `
        <div class="order-item-admin ${isSelesai ? 'status-selesai' : ''}">
          <p><b>INV: ${id}</b> - ${d.produk}</p>
          <p>User: ${d.pembeli} (${d.whatsapp})</p>
          <p>Email: <b>${d.email}</b></p>
          <p>Status: <b>${d.status}</b></p>
          <div style="display:flex; gap:5px; margin-top:10px;">
            <button onclick="window.lihatBukti('${d.bukti}')" style="background:#3a7bd5; color:white; flex:1; padding:5px; border-radius:5px; border:none; cursor:pointer;">LIHAT BUKTI</button>
            <button onclick="window.tandaiSelesai('${id}', '${d.email}', '${d.pembeli}', '${d.produk}')" class="btn-success ${isSelesai ? 'btn-selesai-muted' : ''}" style="flex:2;">
              ${isSelesai ? 'TERKIRIM' : 'KIRIM AKUN'}
            </button>
            <button onclick="window.hapusPesanan('${id}')" class="btn-danger" style="flex:1;">HAPUS</button>
          </div>
        </div>`;
    });
    wadah.innerHTML = html || "<p style='text-align:center;'>Belum ada pesanan.</p>";
  });
};

window.lihatBukti = (base64) => {
    const win = window.open();
    win.document.write(`<img src="${base64}" style="max-width:100%;">`);
};

window.tandaiSelesai = async function(id, emailUser, namaUser, produk) {
    const detailAkun = prompt("Masukkan Detail Akun (Email:Pass/Log):\nIni akan dikirim ke email pembeli.");
    if (!detailAkun) return;

    try {
        notify("Sedang mengirim email... 📧", "#3a7bd5");

        // Kirim via EmailJS
        await emailjs.send("service_id", "template_id", {
            to_email: emailUser,
            to_name: namaUser,
            product_name: produk,
            account_details: detailAkun,
            invoice_id: id
        });

        await updateDoc(doc(db, "pesanan", id), { status: "Selesai" });
        notify("Akun Terkirim & Status Selesai! ✅", "#10b981");
    } catch (e) {
        console.error(e);
        notify("Gagal kirim email!", "#ef4444");
    }
};

window.hapusPesanan = async (id) => {
    if(confirm("Hapus pesanan ini?")) await deleteDoc(doc(db, "pesanan", id));
};

// Inisialisasi
if (location.pathname.includes("admin.html")) {
    window.muatPesananAdmin();
} else {
    window.tampilProduk();
}
