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

// Variable Global
window.currentOrder = null;

// Helper Notifikasi
const notify = (msg, color) => {
    if (window.showToast) window.showToast(msg, color);
    else console.log(msg);
};

// --- 2. LOGIC TAMPIL PRODUK (USER & ADMIN) ---
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
            <button class="btn-warning" onclick="window.editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','','${p.kategori}')">✏️</button>
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
  produkDiv.innerHTML = html || "<p style='text-align:center; width:100%; font-size:12px;'>Belum ada produk.</p>";
}

// --- 3. SISTEM PEMBELIAN (USER) ---
window.bukaStruk = function(nama, harga) {
    const modal = document.getElementById("modalStruk");
    const isiStruk = document.getElementById("isiStruk");
    if(!modal) return;

    window.currentOrder = { produk: nama, hargaAsli: harga, total: harga, voucher: "" };

    isiStruk.innerHTML = `
        <div class="struk-header">
            <h3>FORM PEMBELIAN</h3>
            <p>Silakan isi data untuk menerima akun</p>
        </div>
        <div class="struk-divider"></div>
        <div class="struk-item"><span>Produk:</span> <b>${nama}</b></div>
        <div class="struk-item"><span>Harga:</span> <b>Rp${harga.toLocaleString()}</b></div>
        <div class="struk-divider"></div>
        <label>NAMA PEMBELI</label>
        <input type="text" id="pembeliNama" placeholder="Nama Anda...">
        <label>EMAIL PENERIMA</label>
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

window.handleConfirmBayar = async function() {
    const nama = document.getElementById("pembeliNama").value;
    const email = document.getElementById("pembeliEmail").value;
    if(!nama || !email) return notify("Lengkapi data formulir!", "#ef4444");

    try {
        const orderData = { 
            ...window.currentOrder, 
            pembeli: nama, 
            email: email, 
            status: "Menunggu Pembayaran", 
            tanggal: new Date() 
        };
        
        await addDoc(collection(db, "pesanan"), orderData);
        
        window.tutupStruk();
        notify("Pesanan Berhasil! Silakan tunggu konfirmasi admin.", "#10b981");
    } catch (e) { notify("Gagal memproses pesanan.", "#ef4444"); }
};

window.tutupStruk = () => { document.getElementById("modalStruk").style.display = "none"; };

// --- 4. [ADMIN] KELOLA PESANAN & KIRIM AKUN ---
window.muatPesananAdmin = function() {
  const list = document.getElementById("listPesananAdmin");
  if(!list) return;
  
  onSnapshot(query(collection(db, "pesanan"), orderBy("tanggal", "desc")), (snap) => {
    let html = "";
    snap.forEach(d => {
      const p = d.data();
      const isSelesai = p.status === "🎉 Pesanan Selesai";
      
      html += `
        <div class="order-item-admin ${isSelesai ? 'status-selesai' : ''}">
          <p><b>Pebeli:</b> ${p.pembeli} | <b>Produk:</b> ${p.produk}</p>
          <p><b>Email:</b> ${p.email} | <b>Status:</b> ${p.status}</p>
          ${!isSelesai ? `
            <textarea id="dataAkun_${d.id}" placeholder="Email:Pass Akun (Data ini dikirim ke pembeli)" style="width:100%; margin-top:10px;"></textarea>
            <button class="btn-success" onclick="window.prosesKirimAkun('${d.id}','${p.email}','${p.produk}','${p.pembeli}')">📧 KIRIM DATA & SELESAI</button>
          ` : `<p style="color:#10b981; font-weight:bold;">✅ AKUN SUDAH DIKIRIM</p>`}
        </div>`;
    });
    list.innerHTML = html || "<p style='text-align:center;'>Belum ada pesanan.</p>";
  });
};

window.prosesKirimAkun = async function(docId, userEmail, produk, userNama) {
    const detailAkun = document.getElementById(`dataAkun_${docId}`).value;
    if(!detailAkun) return notify("Isi detail akun dulu!", "#ef4444");

    const params = {
        to_email: userEmail,
        to_name: userNama,
        product_name: produk,
        account_details: detailAkun
    };

    // Integrasi EmailJS
    emailjs.send("service_id_kamu", "template_kirim_akun", params)
    .then(async () => {
        await updateDoc(doc(db, "pesanan", docId), { status: "🎉 Pesanan Selesai" });
        notify("Akun Berhasil dikirim ke " + userEmail, "#10b981");
    })
    .catch((err) => {
        notify("Gagal kirim email: " + err.text, "#ef4444");
    });
};

// --- 5. FUNGSI ADMIN LAINNYA ---
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

// --- 6. INISIALISASI ---
window.initApp = async function() {
  const pSnap = await getDoc(doc(db, "pengaturan", "toko"));
  if(pSnap.exists() && document.getElementById("isiPengumuman")) {
    document.getElementById("isiPengumuman").innerText = pSnap.data().pengumuman;
  }

  if (window.location.href.includes("admin.html")) {
    window.muatVoucherAdmin();
    window.muatPesananAdmin();
    window.tampilProduk();
  } else {
    window.tampilProduk();
  }
};

window.initApp();
