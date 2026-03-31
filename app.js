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
          <img src="${data.gambar}" loading="lazy" style="width:100px; height:100px; object-fit:cover; border-radius:10px;">
          ${isAdmin ? `<button onclick="hapusTesti('${d.id}')" style="background:red; color:white; border:none; padding:5px; border-radius:5px; width:100%; margin-top:5px; cursor:pointer;">HAPUS</button>` : ''}
        </div>`;
    });
    testiDiv.innerHTML = html || "<p style='font-size:12px; color:#94a3b8;'>Belum ada testimoni.</p>";
  } catch (e) { console.error(e); }
}

window.hapusTesti = async (id) => { if(confirm("Hapus testimoni ini?")) { await deleteDoc(doc(db, "testimoni", id)); location.reload(); } };

// --- 3. LOGIKA FILTER & SEARCH ---
window.searchProduk = function() {
  const keyword = document.getElementById("searchInput")?.value.toLowerCase().trim() || "";
  const activeCatBtn = document.querySelector('.filter-container .btn-filter.active') || document.querySelector('.btn-filter.active');
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

// --- 4. RENDER HTML (FLASH SALE REMOVED) ---
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
    const gambarAman = p.gambar;

    if (isAdmin) {
      html += `
        <div class="card-admin" style="display:flex; align-items:center; background:#1e293b; padding:10px; border-radius:12px; margin-bottom:10px; border:1px solid #334155;">
          <img src="${p.gambar.split(',')[0]}" style="width:50px; height:50px; border-radius:8px; margin-right:15px;">
          <div style="flex:1"><h4 style="margin:0; font-size:13px; color:white;">${p.nama}</h4><p style="margin:0; color:#10b981; font-size:12px;">Rp${hargaFormat}</p></div>
          <button onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${p.deskripsi}','${p.kategori}','${p.status}')" style="margin-right:5px; cursor:pointer;">✏️</button>
          <button onclick="hapusProduk('${p.id}')" style="cursor:pointer;">🗑️</button>
        </div>`;
    } else {
      html += `
        <div class="card">
          <div class="card-img-container">
            <img src="${p.gambar.split(',')[0]}">
            <div class="badge">${p.kategori}</div>
            ${isSold ? `<div class="sold-overlay"><div class="sold-label">SOLD OUT</div></div>` : ''}
          </div>
          <div class="card-info">
            <div style="display:flex; align-items:center; gap:5px;"><h4 style="font-size:13px;">${p.nama}</h4><span style="color:#38bdf8;">🔵</span></div>
            <p onclick="bukaDetail('${namaAman}', '${deskripsiAman}', '${gambarAman}', ${p.harga})" style="font-size: 11px; color: #00d2ff; cursor: pointer; text-decoration: underline; margin: 5px 0; font-weight: 600;">🔍 Cek Detail Akun</p>
            <div class="garansi-tag">🛡️ Garansi Anti-HB</div>
            <div class="harga"><span class="harga-baru">Rp${hargaFormat}</span></div>
            <button class="btn-beli" ${isSold ? 'disabled' : `onclick="bukaStruk('${namaAman}', ${p.harga})"`}>
                ${isSold ? 'TERJUAL' : 'BELI SEKARANG'}
            </button>
          </div>
        </div>`;
    }
  });
  produkDiv.innerHTML = html || `<p style="text-align:center; padding:20px;">Produk tidak ditemukan.</p>`;
}

// --- 5. SISTEM DETAIL & PEMBAYARAN ---
window.bukaDetail = function(nama, deskripsi, gambar, harga) {
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

  const btnNego = document.getElementById("btnNegoWA");
  if(btnNego) {
    btnNego.onclick = function() {
      const pesanNego = `Halo Faza Store, saya tertarik nego akun: *${nama}*`;
      window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesanNego)}`, "_blank");
    };
  }

  const btnLanjut = document.getElementById("btnLanjutBeli");
  btnLanjut.onclick = function() {
    tutupDetail();
    window.bukaStruk(nama, harga);
  };

  document.getElementById("modalDetail").style.display = "flex";
};

window.tutupDetail = () => document.getElementById("modalDetail").style.display = "none";

window.bukaStruk = function(nama, harga) {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  dataPesananSementera = { nama, harga, inv };
  
  document.getElementById("isiStruk").innerHTML = `
    <div style="font-size: 13px; color: #333; line-height: 1.6;">
      <div style="display:flex; justify-content:space-between;"><span>No. Invoice</span><b>${inv}</b></div>
      <div style="display:flex; justify-content:space-between;"><span>Produk</span><b style="text-align:right; max-width:60%">${nama}</b></div>
      <hr style="border: 0.5px dashed #ccc; margin: 10px 0;">
      
      <label>Nama Lengkap:</label>
      <input type="text" id="pembeliNama" placeholder="Nama Anda" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #ddd;">
      
      <label>WhatsApp (Aktif):</label>
      <input type="number" id="pembeliWA" placeholder="628..." style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #ddd;">
      
      <label>Email (Kirim Akun):</label>
      <input type="email" id="pembeliEmail" placeholder="email@anda.com" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px; border:1px solid #ddd;">
      
      <label>Metode Pembayaran:</label>
      <select id="metodeBayar" onchange="pilihPembayaran(this.value)" style="width:100%; padding:8px; margin-bottom:10px; border-radius:5px;">
          <option value="">-- Pilih --</option>
          <option value="QRIS">QRIS</option>
          <option value="DANA">DANA</option>
          <option value="OVO">OVO</option>
      </select>

      <div id="wadahBayar" style="display:none; background:#f1f5f9; padding:10px; border-radius:8px; text-align:center; margin-bottom:10px;"></div>

      <div id="wadahBukti" style="display:none;">
          <label style="color:red; font-weight:bold;">Link Bukti Transfer/SS:</label>
          <input type="text" id="buktiTransfer" placeholder="Tempel Link Foto Bukti Di Sini" style="width:100%; padding:8px; border:1px solid #ef4444; border-radius:5px;">
      </div>

      <hr style="border: 0.5px dashed #ccc; margin: 10px 0;">
      <div style="display:flex; justify-content:space-between; font-size:16px; color:#10b981; font-weight:800;">
        <span>TOTAL</span>
        <span>Rp${harga.toLocaleString('id-ID')}</span>
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

window.tutupStruk = () => document.getElementById("modalStruk").style.display = "none";

// --- 6. KIRIM PESANAN OTOMATIS (TANPA WA) ---
window.kirimInvoiceWA = async function() {
  const pNama = document.getElementById("pembeliNama").value;
  const pWA = document.getElementById("pembeliWA").value;
  const pEmail = document.getElementById("pembeliEmail").value;
  const metode = document.getElementById("metodeBayar").value;
  const bukti = document.getElementById("buktiTransfer").value;

  if(!pNama || !pWA || !pEmail || !metode || !bukti) return alert("Lengkapi data dan lampirkan bukti transfer!");

  const { nama, harga, inv } = dataPesananSementera;
  const btn = event.target;
  btn.innerText = "⏳ SEDANG MEMPROSES...";
  btn.disabled = true;

  try {
    await setDoc(doc(db, "pesanan", inv), { 
      produk: nama, 
      total: harga, 
      metode: metode, 
      pembeli: pNama,
      whatsapp: pWA,
      email: pEmail,
      bukti: bukti,
      status: "⏳ Menunggu Validasi", 
      tanggal: new Date()
    });

    alert(`✅ PESANAN BERHASIL!\n\nID Invoice: ${inv}\nStatus: Sedang diproses oleh Admin.\n\nAkun akan dikirim ke email ${pEmail} setelah bukti transfer divalidasi. Silakan cek email secara berkala.`);
    
    tutupStruk();
    location.reload(); 
  } catch (e) { 
    alert("Gagal membuat pesanan."); 
    btn.innerText = "KONFIRMASI PEMBAYARAN";
    btn.disabled = false;
  }
};

// --- 7. DASHBOARD ADMIN (TAMPIL NOMOR WA) ---
async function muatPesananMasuk() {
    const list = document.getElementById("listPesananAdmin");
    if(!list) return;
    const snap = await getDocs(collection(db, "pesanan"));
    let html = "";
    snap.forEach(d => {
        const p = d.data();
        html += `
        <div style="background:#fff; color:#333; border:1px solid #ddd; padding:12px; border-radius:10px; margin-bottom:15px; border-left:5px solid #10b981;">
            <p style="margin:2px 0;"><b>ID:</b> ${d.id}</p>
            <p style="margin:2px 0;"><b>Item:</b> ${p.produk}</p>
            <p style="margin:2px 0;"><b>Pembeli:</b> ${p.pembeli} (<a href="https://wa.me/${p.whatsapp}" target="_blank" style="color:#25d366; font-weight:bold;">${p.whatsapp}</a>)</p>
            <p style="margin:2px 0;"><b>Email:</b> ${p.email}</p>
            <p style="margin:2px 0;"><b>Status:</b> ${p.status}</p>
            <a href="${p.bukti}" target="_blank" style="color:blue; font-size:12px;">[LIHAT BUKTI TRANSFER]</a>
            <hr>
            <textarea id="dataAkun_${d.id}" placeholder="Ketik data akun di sini..." style="width:100%; height:50px; border-radius:5px; padding:5px;"></textarea>
            <button onclick="kirimDataEmail('${d.id}', '${p.email}', '${p.produk}', '${p.pembeli}')" style="background:#10b981; color:#fff; border:none; padding:8px; border-radius:5px; width:100%; margin-top:5px; cursor:pointer; font-weight:bold;">📧 KIRIM EMAIL</button>
            <button onclick="hapusPesanan('${d.id}')" style="background:none; color:red; border:none; width:100%; margin-top:5px; cursor:pointer; font-size:11px;">Hapus Pesanan</button>
        </div>`;
    });
    list.innerHTML = html || "Belum ada pesanan.";
}

window.kirimDataEmail = async function(invId, emailTujuan, produk, namaPembeli) {
    const dataAkun = document.getElementById(`dataAkun_${invId}`).value;
    if(!dataAkun) return alert("Isi data akun manual dulu!");

    const btn = event.target;
    btn.innerText = "⏳ Mengirim...";
    btn.disabled = true;

    try {
        await emailjs.send("service_xe358l6", "template_2j4eu9o", {
            nama_pembeli: namaPembeli,
            email_pembeli: emailTujuan,
            nama_akun: produk,
            data_akun: dataAkun
        });

        await updateDoc(doc(db, "pesanan", invId), { status: "🎉 Pesanan Selesai" });
        alert("✅ Berhasil! Email terkirim ke " + emailTujuan);
        location.reload();
    } catch (e) { 
        alert("❌ Gagal kirim email."); 
        btn.innerText = "📧 Kirim Email";
        btn.disabled = false;
    }
};

window.hapusPesanan = async (id) => { if(confirm("Hapus pesanan ini?")) { await deleteDoc(doc(db, "pesanan", id)); location.reload(); } };

window.submitProduk = async function() {
  const editId = document.getElementById("editId").value;
  const dataObj = {
    nama: document.getElementById("nama").value,
    harga: Number(document.getElementById("harga").value),
    gambar: document.getElementById("gambar").value,
    deskripsi: document.getElementById("deskripsi").value,
    kategori: document.getElementById("kategori").value,
    status: document.getElementById("status").value
  };
  try {
    if (editId) { await updateDoc(doc(db, "produk", editId), dataObj); } 
    else { await addDoc(collection(db, "produk"), dataObj); }
    alert("Berhasil!"); location.reload();
  } catch (e) { alert(e.message); }
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori, status) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("status").value = status;
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

window.hapusProduk = async (id) => { if(confirm("Hapus produk?")) { await deleteDoc(doc(db, "produk", id)); location.reload(); } };

tampilProduk();
