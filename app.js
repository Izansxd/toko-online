import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- 1. KONFIGURASI FIREBASE ---
const NOMOR_WA_ADMIN = "6282298627146"; 
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

    // --- FITUR INCOME TRACKER (TOTAL CUAN) ---
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

// --- 5. SISTEM DETAIL (MULTI IMAGE & NEGO) ---
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

  // FITUR TIMER FLASH SALE
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
  
  // TOMBOL NEGO WA
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

// FUNGSI BUKA STRUK
window.bukaStruk = function(nama, harga, diskon) {
  const inv = "FZ-" + Math.floor(1000 + Math.random() * 9999);
  dataPesananSementera = { nama, harga, inv, diskon };
  
  document.getElementById("isiStruk").innerHTML = `
    <div style="font-size: 13px; color: #333; line-height: 1.6;">
      <div style="display:flex; justify-content:space-between;"><span>No. Invoice</span><b>${inv}</b></div>
      <div style="display:flex; justify-content:space-between;"><span>Produk</span><b style="text-align:right; max-width:60%">${nama}</b></div>
      <div style="display:flex; justify-content:space-between;"><span>Harga</span><span>Rp${(harga + diskon).toLocaleString('id-ID')}</span></div>
      ${diskon > 0 ? `<div style="display:flex; justify-content:space-between; color:#ef4444;"><span>Potongan</span><span>-Rp${diskon.toLocaleString('id-ID')}</span></div>` : ''}
      <hr style="border: 0.5px dashed #ccc; margin: 10px 0;">
      <div style="display:flex; justify-content:space-between; font-size:16px; color:#10b981; font-weight:800;">
        <span>TOTAL</span>
        <span>Rp${harga.toLocaleString('id-ID')}</span>
      </div>
    </div>
  `;
  document.getElementById("modalStruk").style.display = "flex";
};

window.tutupStruk = () => document.getElementById("modalStruk").style.display = "none";

window.kirimInvoiceWA = async function() {
  const metode = document.getElementById("metodeBayar").value;
  const { nama, harga, inv } = dataPesananSementera;
  try {
    await setDoc(doc(db, "pesanan", inv), { produk: nama, total: harga, metode: metode, status: "⏳ Menunggu Pembayaran", tanggal: new Date() });
    const pesan = `*PESANAN BARU - FAZA STORE*\n` +
                  `----------------------------------\n` +
                  `*No. Invoice :* ${inv}\n` +
                  `*Produk      :* ${nama}\n` +
                  `*Total Bayar :* Rp${Number(harga).toLocaleString('id-ID')}\n` +
                  `*Metode      :* ${metode}\n` +
                  `----------------------------------\n\n` +
                  `_Mohon kirimkan detail pembayaran/QRIS nya ya Min!_`;
    window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
    tutupStruk();
  } catch (e) { alert("Gagal membuat pesanan."); }
};

// --- 6. FITUR LACAK PESANAN ---
window.cekStatusPesanan = async function() {
  const idInput = document.getElementById("inputCekStatus").value.trim().toUpperCase();
  const hasilDiv = document.getElementById("hasilStatus");
  if(!idInput) return alert("Masukkan ID Invoice!");
  try {
    const docSnap = await getDoc(doc(db, "pesanan", idInput));
    if (docSnap.exists()) {
      const data = docSnap.data();
      hasilDiv.style.display = "block";
      hasilDiv.innerHTML = `<p><b>ID:</b> ${idInput}</p><p><b>Status:</b> <span style="color:#00d2ff; font-weight:700;">${data.status}</span></p>`;
    } else { alert("ID Invoice tidak ditemukan!"); }
  } catch (e) { alert("Terjadi kesalahan."); }
};

// --- 7. FITUR ADMIN ---
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
  document.getElementById("displayHarga").value = new Intl.NumberFormat('id-ID').format(harga);
  document.getElementById("hargaLama").value = hargaLama || "";
  document.getElementById("displayHargaLama").value = hargaLama ? new Intl.NumberFormat('id-ID').format(hargaLama) : "";
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("status").value = status;
  document.getElementById("isPromo").checked = isPromo;
  if(document.getElementById("flashSaleEnd")) document.getElementById("flashSaleEnd").value = flashSaleEnd || "";
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

window.hapusProduk = async function(id) {
  if (confirm("Hapus akun?")) { await deleteDoc(doc(db, "produk", id)); location.reload(); }
};

window.updatePengumuman = async function() {
  const teks = document.getElementById("teksBaru").value;
  try {
    await setDoc(doc(db, "pengaturan", "toko"), { pengumuman: teks }, { merge: true });
    alert("Berhasil!");
  } catch (e) { alert(e.message); }
};

window.submitTestimoni = async function() {
  const url = document.getElementById("fotoTesti").value;
  try {
    await addDoc(collection(db, "testimoni"), { gambar: url, createdAt: new Date() });
    alert("Testimoni Berhasil!"); location.reload();
  } catch (e) { alert(e.message); }
};

window.updateStatusPesanan = async function() {
  const invId = document.getElementById("adminIdPesanan").value.trim().toUpperCase();
  const status = document.getElementById("adminStatusUpdate").value;
  try {
    await setDoc(doc(db, "pesanan", invId), { status: status }, { merge: true });
    alert("Status Terupdate!");
  } catch (e) { alert("Gagal!"); }
};

window.hapusTesti = async function(id) {
    if(confirm("Hapus testimoni?")) { await deleteDoc(doc(db, "testimoni", id)); location.reload(); }
}

tampilProduk();
