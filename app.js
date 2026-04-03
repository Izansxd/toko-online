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
//           FUNGSI UNTUK ADMIN.HTML
// ==========================================

// 1. Tambah/Edit Produk
window.submitProduk = async function() {
    const id = document.getElementById("editId").value;
    const data = {
        nama: document.getElementById("nama").value,
        harga: document.getElementById("harga").value,
        kategori: document.getElementById("kategori").value,
        deskripsi: document.getElementById("deskripsi").value,
        gambar: document.getElementById("gambar").value,
        status: "Ready"
    };

    try {
        if (id) await updateDoc(doc(db, "produk", id), data);
        else await addDoc(collection(db, "produk"), data);
        notify("Produk Berhasil Disimpan! ✅");
        location.reload();
    } catch (e) { notify("Gagal simpan produk", "#ef4444"); }
};

// 2. Muat Pesanan Masuk (Real-time)
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
          <div style="display:flex; gap:5px; margin-top:10px;">
            <button onclick="window.lihatBukti('${d.bukti}')" style="background:#3a7bd5; color:white; padding:5px; border-radius:5px; border:none; cursor:pointer;">LIHAT BUKTI</button>
            <button onclick="window.kirimDataAkun('${id}', '${d.email}', '${d.pembeli}', '${d.produk}')" class="btn-success" ${isSelesai ? 'disabled' : ''}>
              ${isSelesai ? 'SUDAH DIKIRIM' : 'KIRIM AKUN'}
            </button>
            <button onclick="window.hapusPesanan('${id}')" class="btn-danger">HAPUS</button>
          </div>
        </div>`;
    });
    wadah.innerHTML = html || "<p style='text-align:center;'>Belum ada pesanan.</p>";
  });
};

// 3. Kirim Akun via EmailJS
window.kirimDataAkun = async function(id, emailUser, namaUser, produk) {
    const detail = prompt("Masukkan Detail Akun (Email:Pass/Log):");
    if (!detail) return;

    try {
        notify("Sedang mengirim email... 📧", "#3a7bd5");
        // Pastikan ID Service & Template EmailJS lu bener di sini
        await emailjs.send("service_xe358l6", "template_2j4eu9o", {
            to_email: emailUser,
            to_name: namaUser,
            product_name: produk,
            account_details: detail,
            invoice_id: id
        });

        await updateDoc(doc(db, "pesanan", id), { status: "Selesai" });
        notify("Email Terkirim! ✅");
    } catch (e) { notify("Gagal kirim email!", "#ef4444"); }
};

// 4. Fungsi Admin Lainnya (Voucher, Pengumuman, Testi)
window.tambahVoucher = async function() {
    const kode = document.getElementById("vKode").value;
    const diskon = document.getElementById("vDiskon").value;
    await setDoc(doc(db, "vouchers", kode), { diskon: diskon, kuota: document.getElementById("vKuota").value });
    notify("Voucher Disimpan! ✅");
};

window.updatePengumuman = async function() {
    const text = document.getElementById("inputPengumuman").value;
    await setDoc(doc(db, "pengaturan", "toko"), { pengumuman: text });
    notify("Pengumuman Terupdate! 📢");
};

// ==========================================
//           FUNGSI UNTUK INDEX.HTML
// ==========================================

window.tampilProduk = async function() {
  const dataSnap = await getDocs(collection(db, "produk"));
  allProducts = []; 
  dataSnap.forEach(docSnap => allProducts.push({ id: docSnap.id, ...docSnap.data() }));
  renderHTML(allProducts);
};

function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;
  let html = "";
  data.forEach((p) => {
    html += `
      <div class="card">
        <img src="${p.gambar.split(',')[0]}">
        <div class="card-info">
          <h4>${p.nama}</h4>
          <span class="harga-baru">Rp${Number(p.harga).toLocaleString('id-ID')}</span>
          <button class="btn-beli" onclick="window.bukaStruk('${p.nama}', ${p.harga})">BELI</button>
        </div>
      </div>`;
  });
  produkDiv.innerHTML = html;
}

// Global Init
window.lihatBukti = (b) => { const w = window.open(); w.document.write(`<img src="${b}" style="width:100%">`); };
window.hapusPesanan = async (id) => { if(confirm("Hapus?")) await deleteDoc(doc(db, "pesanan", id)); };

// Jalankan berdasarkan halaman
if (document.getElementById("listPesananAdmin")) {
    window.muatPesananAdmin();
} else {
    window.tampilProduk();
}
