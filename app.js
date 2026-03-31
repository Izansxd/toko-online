import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE & PEMBAYARAN ---
const NOMOR_WA_ADMIN = "6282298627146"; 
const NO_DANA = "082298627146"; // Ganti dengan nomor DANA kamu
const NO_OVO = "082298627146";  // Ganti dengan nomor OVO kamu
const URL_QRIS = "https://link-foto-qris-kamu.com/qris.jpg"; // Ganti link foto QRIS kamu

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

let allProducts = [];
let currentMinHarga = 0;
let currentMaxHarga = 999999999;
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
    
    const statCuan = document.getElementById("statCuan");
    if(statCuan) statCuan.innerText = "Rp" + totalCuan.toLocaleString('id-ID');

    const infoSnap = await getDoc(doc(db, "pengaturan", "toko"));
    if (infoSnap.exists()) {
      const marquee = document.getElementById("isiPengumuman");
      if(marquee) marquee.innerText = infoSnap.data().pengumuman;
    }

    const statTotal = document.getElementById("statTotal");
    const statSold = document.getElementById("statSold");
    if (statTotal && statSold) {
      statTotal.innerText = allProducts.length;
      statSold.innerText = allProducts.filter(p => p.status === "Sold").length;
    }

    window.searchProduk(); 
    muatTestimoni(); 
    // Jika di halaman admin, muat pesanan masuk
    if(window.location.href.includes("admin.html")) muatPesananMasuk();
  } catch (error) { console.error(error); }
};

async function muatTestimoni() {
  const testiDiv = document.getElementById("list-testimoni");
  if (!testiDiv) return;
  try {
    const snap = await getDocs(collection(db, "testimoni"));
    let html = "";
    snap.forEach(d => {
      const data = d.data();
      const isAdmin = window.location.href.includes("admin.html");
      html += `
        <div class="card-testi">
          <img src="${data.gambar}" loading="lazy">
          ${isAdmin ? `<button onclick="hapusTesti('${d.id}')" style="background:red; color:white; border:none; padding:5px; border-radius:5px; width:100%; margin-top:5px;">HAPUS</button>` : ''}
        </div>`;
    });
    testiDiv.innerHTML = html || "<p style='font-size:12px; color:#94a3b8;'>Belum ada testimoni.</p>";
  } catch (e) { console.error(e); }
}

// --- 3. LOGIKA FILTER & SEARCH ---
window.searchProduk = function() {
  const keyword = document.getElementById("searchInput")?.value.toLowerCase().trim() || "";
  const activeCatBtn = document.querySelector('.filter-container .btn-filter.active');
  let kategoriAktif = activeCatBtn ? activeCatBtn.innerText.trim() : "Semua";
  
  if(kategoriAktif === "MLBB") kategoriAktif = "Mobile Legends";
  if(kategoriAktif === "FF") kategoriAktif = "Free Fire";
  if(kategoriAktif === "PUBG") kategoriAktif = "PUBG Mobile";

  const filteredData = allProducts.filter(p => {
    const harga = Number(p.harga) || 0;
    const cocokKategori = (kategoriAktif === "Semua" || p.kategori === kategoriAktif);
    const cocokKeyword = (p.nama || "").toLowerCase().includes(keyword);
    const cocokHarga = (harga >= currentMinHarga && harga <= currentMaxHarga);
    return cocokKategori && cocokKeyword && cocokHarga;
  });
  renderHTML(filteredData);
};

window.filterGame = function(el, kategori) {
  el.parentElement.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  window.searchProduk();
};

window.filterHarga = function(el, min, max) {
  el.parentElement.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentMinHarga = min;
  currentMaxHarga = max;
  window.searchProduk();
};

// --- 4. RENDER HTML ---
function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;
  const isAdmin = window.location.href.includes("admin.html");
  let html = "";

  data.forEach((p) => {
    const isSold = p.status === "Sold"; 
    const hargaFormat = Number(p.harga).toLocaleString('id-ID');
    const hargaLamaValue = p.hargaLama ? Number(p.hargaLama) : 0;
    const hargaBaruValue = Number(p.harga);
    const diskonValue = hargaLamaValue > hargaBaruValue ? hargaLamaValue - hargaBaruValue : 0;
    
    const namaAman = p.nama.replace(/'/g, "\\'");
    const deskripsiAman = (p.deskripsi || "").replace(/'/g, "\\'").replace(/\n/g, "\\n");
    const gambarAman = p.gambar;

    if (isAdmin) {
      html += `
        <div class="card-admin">
          <img src="${p.gambar.split(',')[0]}">
          <div style="flex:1"><h4 style="margin:0; font-size:13px;">${p.nama}</h4><p style="margin:0; color:#10b981; font-size:12px;">Rp${hargaFormat} [${p.status}]</p></div>
          <button onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${p.deskripsi}','${p.kategori}','${p.status}',${p.isPromo},'${p.hargaLama || ''}','${p.flashSaleEnd || ''}')">✏️</button>
          <button onclick="hapusProduk('${p.id}')">🗑️</button>
        </div>`;
    } else {
      html += `
        <div class="card">
          <div class="card-img-container">
            <img src="${p.gambar.split(',')[0]}">
            <div class="badge">${p.kategori}</div>
            ${p.isPromo ? `<div class="badge-promo">⚡ FLASH SALE</div>` : ''}
            ${isSold ? `<div class="sold-overlay"><div class="sold-label">SOLD OUT</div></div>` : ''}
          </div>
          <div class="card-info">
            <div style="display:flex; align-items:center; gap:5px;"><h4 style="font-size:13px;">${p.nama}</h4><span style="color:#38bdf8;">🔵</span></div>
            
            <p onclick="bukaDetail('${namaAman}', '${deskripsiAman}', '${gambarAman}', ${hargaBaruValue}, ${diskonValue}, '${p.flashSaleEnd || ''}')" style="font-size: 11px; color: #00d2ff; cursor: pointer; text-decoration: underline; margin: 5px 0; font-weight: 600;">🔍 Cek Detail Akun</p>
            
            <div class="garansi-tag">🛡️ Garansi Anti-HB</div>
            <div class="harga">
                ${p.hargaLama ? `<span class="harga-lama">Rp${Number(p.hargaLama).toLocaleString('id-ID')}</span>` : ''}
                <span class="harga-baru">Rp${hargaFormat}</span>
            </div>
            <button class="btn-beli" ${isSold ? 'disabled' : `onclick="bukaStruk('${namaAman}', ${hargaBaruValue}, ${diskonValue})"`}>
                ${isSold ? 'TERJUAL' : 'BELI SEKARANG'}
            </button>
          </div>
        </div>`;
    }
  });
  produkDiv.innerHTML = html || `<p style="text-align:center; padding:20px;">Produk tidak ditemukan.</p>`;
}

// --- 5. SISTEM DETAIL & STRUK ---
window.bukaDetail = function(nama, deskripsi, gambar, harga, diskon, flashSaleEnd) {
  const daftarGambar = gambar.split(",");
  let htmlGambar = `<img src="${daftarGambar[0].trim()}" id="mainDetailImg" style="width:100%; border-radius:10px; margin-bottom:10px; border:1px solid #334155;">`;
  
  if(daftarGambar.length > 1) {
    htmlGambar += `<div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:10px; scrollbar-width: none;">`;
    daftarGambar.forEach(img => {
      htmlGambar += `<img src="${img.trim()}" onclick="document.getElementById('mainDetailImg').src='${img.trim()}'" style="width:70px; height:70px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid #334155;">`;
    });
    htmlGambar += `</div>`;
  }

  document.getElementById("detailNama").innerText = nama;
  document.getElementById("detailDeskripsi").innerText = deskripsi.replace(/\\n/g, '\n');
  document.getElementById("detailGambarWadah").innerHTML = htmlGambar;

  const timerDiv = document.getElementById("timerFlashSale");
  if(timerDiv) {
    if(flashSaleEnd) {
      timerDiv.style.display = "block";
      const countdown = setInterval(() => {
        const now = new Date().getTime();
        const distance = new Date(flashSaleEnd).getTime() - now;
        if (distance < 0) {
          clearInterval(countdown);
          timerDiv.innerText = "PROMO BERAKHIR";
        } else {
          const jam = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const menit = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const detik = Math.floor((distance % (1000 * 60)) / 1000);
          timerDiv.innerText = `Sisa Waktu: ${jam}j ${menit}m ${detik}s`;
        }
      }, 1000);
    } else { timerDiv.style.display = "none"; }
  }
  
  const btnNego = document.getElementById("btnNegoWA");
  if(btnNego) {
    btnNego.onclick = function() {
      const pesanNego = `Halo Faza Store, saya tertarik nego akun: *${nama}*.\nHarganya bisa kurang dikit gak ya?`;
      window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesanNego)}`, "_blank");
    };
  }

  const btnLanjut = document.getElementById("btnLanjutBeli");
  btnLanjut.onclick = function() {
    tutupDetail();
    window.bukaStruk(nama, harga, diskon);
  };

  document.getElementById("modalDetail").style.display = "flex";
};

window.tutupDetail = () => document.getElementById("modalDetail").style.display = "none";

window.bukaStruk = function(nama, harga, diskon) {
  const inv = dataPesananSementera.inv || "FZ-" + Math.floor(1000 + Math.random() * 9999);
  const hargaTampil = harga < 0 ? 0 : harga;
  dataPesananSementera = { ...dataPesananSementera, nama, harga: hargaTampil, inv, diskon };
  
  document.getElementById("isiStruk").innerHTML = `
    <div style="font-size: 13px; color: #333; line-height: 1.6;">
      <div style="display:flex; justify-content:space-between;"><span>No. Invoice</span><b>${inv}</b></div>
      <div style="display:flex; justify-content:space-between;"><span>Produk</span><b style="text-align:right; max-width:60%">${nama}</b></div>
      <hr style="border: 0.5px dashed #ccc; margin: 10px 0;">
      
      <label>Nama Lengkap:</label>
      <input type="text" id="pembeliNama" placeholder="Nama Anda" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #ddd;">
      
      <label>WhatsApp (Darurat):</label>
      <input type="number" id="pembeliWA" placeholder="628..." style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #ddd;">
      
      <label>Email (Kirim Akun):</label>
      <input type="email" id="pembeliEmail" placeholder="email@anda.com" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #ddd;">
      
      <label>Metode Pembayaran:</label>
      <select id="metodeBayar" onchange="pilihPembayaran(this.value)" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px;">
          <option value="">-- Pilih --</option>
          <option value="QRIS">QRIS (Otomatis)</option>
          <option value="DANA">DANA</option>
          <option value="OVO">OVO</option>
      </select>

      <div id="wadahBayar" style="display:none; background:#f1f5f9; padding:10px; border-radius:8px; text-align:center; margin-bottom:10px;"></div>

      <div id="wadahBukti" style="display:none;">
          <label style="color:red; font-weight:bold;">Wajib Kirim Link Bukti Transfer/SS:</label>
          <input type="text" id="buktiTransfer" placeholder="Tempel Link Foto Bukti Di Sini" style="width:100%; padding:8px; border:1px solid #ef4444; border-radius:5px;">
      </div>

      <hr style="border: 0.5px dashed #ccc; margin: 10px 0;">
      <div style="display:flex; justify-content:space-between; font-size:16px; color:#10b981; font-weight:800;">
        <span>TOTAL</span>
        <span>Rp${hargaTampil.toLocaleString('id-ID')}</span>
      </div>
    </div>
  `;
  document.getElementById("modalStruk").style.display = "flex";
};

window.pilihPembayaran = function(val) {
    const wadah = document.getElementById("wadahBayar");
    const bukti = document.getElementById("wadahBukti");
    wadah.style.display = val ? "block" : "none";
    bukti.style.display = val ? "block" : "none";

    if(val === "QRIS") {
        wadah.innerHTML = `<p>Scan QRIS FAZA STORE:</p><img src="${URL_QRIS}" style="width:150px; border-radius:10px;">`;
    } else if(val === "DANA") {
        wadah.innerHTML = `<p>Transfer DANA:</p><b style="font-size:18px;">${NO_DANA}</b><br>A/N FAZA STORE`;
    } else if(val === "OVO") {
        wadah.innerHTML = `<p>Transfer OVO:</p><b style="font-size:18px;">${NO_OVO}</b><br>A/N FAZA STORE`;
    }
}

window.tutupStruk = () => {
    document.getElementById("modalStruk").style.display = "none";
    dataPesananSementera = {}; 
};

// --- 6. KIRIM PESANAN & VOUCHER ---
window.kirimInvoiceWA = async function() {
  const pNama = document.getElementById("pembeliNama").value;
  const pWA = document.getElementById("pembeliWA").value;
  const pEmail = document.getElementById("pembeliEmail").value;
  const metode = document.getElementById("metodeBayar").value;
  const bukti = document.getElementById("buktiTransfer").value;

  if(!pNama || !pWA || !pEmail || !metode || !bukti) return alert("Lengkapi data dan lampirkan bukti transfer!");

  const { nama, harga, inv, voucherDipakai } = dataPesananSementera;
  try {
    if(voucherDipakai) {
        const vRef = doc(db, "vouchers", voucherDipakai);
        const vSnap = await getDoc(vRef);
        if(vSnap.exists()) await updateDoc(vRef, { kuota: vSnap.data().kuota - 1 });
    }

    await setDoc(doc(db, "pesanan", inv), { 
      produk: nama, 
      total: harga, 
      metode: metode, 
      pembeli: pNama,
      whatsapp: pWA,
      email: pEmail,
      bukti: bukti,
      status: "⏳ Menunggu Validasi Pembayaran", 
      tanggal: new Date()
    });

    const pesan = `*PESANAN BARU - FAZA STORE*\nInvoice: ${inv}\nProduk: ${nama}\nPembeli: ${pNama}\nBukti: ${bukti}`;
    window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
    alert("Pesanan terkirim! Admin akan mengecek bukti transfer Anda.");
    tutupStruk();
  } catch (e) { alert("Gagal membuat pesanan."); }
};

// --- 7. DASHBOARD ADMIN ---
async function muatPesananMasuk() {
    const list = document.getElementById("listPesananAdmin");
    if(!list) return;
    const snap = await getDocs(collection(db, "pesanan"));
    let html = "";
    snap.forEach(d => {
        const p = d.data();
        html += `
        <div style="background:#fff; border:1px solid #ddd; padding:10px; border-radius:10px; margin-bottom:10px;">
            <p><b>ID:</b> ${d.id} | <b>Penerima:</b> ${p.pembeli}</p>
            <p><b>Item:</b> ${p.produk} | <b>Email:</b> ${p.email}</p>
            <p><b>Status:</b> ${p.status}</p>
            <a href="${p.bukti}" target="_blank" style="color:blue;">[Lihat Bukti Transfer]</a>
            <hr>
            <textarea id="dataAkun_${d.id}" placeholder="Ketik data akun di sini..." style="width:100%; height:50px;"></textarea>
            <button onclick="kirimDataEmail('${d.id}', '${p.email}', '${p.produk}', '${p.pembeli}')" style="background:#10b981; color:#fff; border:none; padding:5px; border-radius:5px; cursor:pointer;">📧 Kirim Email</button>
            <button onclick="hapusPesanan('${d.id}')" style="background:red; color:#fff; border:none; padding:5px; border-radius:5px;">🗑️</button>
        </div>`;
    });
    list.innerHTML = html || "Belum ada pesanan.";
}

window.kirimDataEmail = async function(invId, emailTujuan, produk, namaPembeli) {
    const dataAkun = document.getElementById(`dataAkun_${invId}`).value;
    if(!dataAkun) return alert("Isi data akun manual dulu!");

    try {
        // GANTI ID DI BAWAH DENGAN MILIKMU
        await emailjs.send("service_xxxx", "template_xxxx", {
            nama_pembeli: namaPembeli,
            email_pembeli: emailTujuan,
            produk_nama: produk,
            data_akun: dataAkun,
            invoice_id: invId
        });

        await updateDoc(doc(db, "pesanan", invId), { status: "🎉 Pesanan Selesai" });
        alert("Email Terkirim & Pesanan Selesai!");
        location.reload();
    } catch (e) { alert("Gagal kirim email: " + e.message); }
};

window.hapusPesanan = async (id) => { if(confirm("Hapus?")) { await deleteDoc(doc(db, "pesanan", id)); location.reload(); } };

// --- LOGIKA LAIN-LAIN ---
window.pakaiVoucher = async function() {
  const kode = document.getElementById("inputVoucher").value.trim().toUpperCase();
  const notif = document.getElementById("notifVoucher");
  if(!kode) return;
  try {
    const vSnap = await getDoc(doc(db, "vouchers", kode));
    if (vSnap.exists() && vSnap.data().kuota > 0) {
        const potongan = Number(vSnap.data().potongan);
        dataPesananSementera.voucherDipakai = kode;
        dataPesananSementera.potonganVoucher = potongan;
        window.bukaStruk(dataPesananSementera.nama, dataPesananSementera.harga - potongan, dataPesananSementera.diskon);
        notif.innerText = "✅ Berhasil!";
    } else { notif.innerText = "❌ Gagal!"; }
  } catch (e) { console.error(e); }
};

// ... (Sisa fungsi admin submitProduk, editProduk tetap sama) ...
window.submitProduk = async function() {
  const editId = document.getElementById("editId").value;
  const dataObj = {
    nama: document.getElementById("nama").value,
    harga: Number(document.getElementById("harga").value),
    hargaLama: document.getElementById("hargaLama").value ? Number(document.getElementById("hargaLama").value) : null,
    gambar: document.getElementById("gambar").value,
    deskripsi: document.getElementById("deskripsi").value,
    kategori: document.getElementById("kategori").value,
    status: document.getElementById("status").value,
    isPromo: document.getElementById("isPromo").checked,
    flashSaleEnd: document.getElementById("flashSaleEnd")?.value || ""
  };
  try {
    if (editId) { await updateDoc(doc(db, "produk", editId), dataObj); } 
    else { await addDoc(collection(db, "produk"), dataObj); }
    alert("Berhasil!"); location.reload();
  } catch (e) { alert(e.message); }
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori, status, isPromo, hargaLama, flashSaleEnd) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("status").value = status;
  document.getElementById("isPromo").checked = isPromo;
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

tampilProduk();
