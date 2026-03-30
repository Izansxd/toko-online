import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// --- KONFIGURASI ---
const NOMOR_WA_ADMIN = "6282298627146"; 

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

let allProducts = [];
let pesananSekarang = {}; 

// --- 1. FUNGSI TAMPIL PRODUK ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  produkDiv.innerHTML = Array(4).fill('<div class="skeleton skeleton-card"></div>').join('');

  try {
    const data = await getDocs(collection(db, "produk"));
    allProducts = []; 
    data.forEach(docSnap => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });
    window.searchProduk(); 
  } catch (error) {
    produkDiv.innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data.</p>`;
  }
};

// --- 2. FUNGSI SEARCH ---
window.searchProduk = function() {
  const searchInput = document.getElementById("searchInput");
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  const activeBtn = document.querySelector('.btn-filter.active');
  let kategoriAktif = activeBtn ? activeBtn.innerText.trim() : "Semua";
  
  if(kategoriAktif === "MLBB") kategoriAktif = "Mobile Legends";
  if(kategoriAktif === "FF") kategoriAktif = "Free Fire";
  if(kategoriAktif === "PUBG") kategoriAktif = "PUBG Mobile";

  const filteredData = allProducts.filter(p => {
    const cocokKategori = (kategoriAktif === "Semua" || p.kategori === kategoriAktif);
    const namaProduk = (p.nama || "").toLowerCase();
    const deskripsiProduk = (p.deskripsi || "").toLowerCase();
    const cocokKeyword = namaProduk.includes(keyword) || deskripsiProduk.includes(keyword);
    return cocokKategori && cocokKeyword;
  });

  renderHTML(filteredData);
};

// --- 3. FUNGSI RENDER KE LAYAR ---
function renderHTML(data) {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  const isAdmin = window.location.href.includes("admin.html");
  let html = "";

  data.forEach((p) => {
    const isSold = p.status === "Sold"; 
    const isPromo = p.isPromo === true || p.isPromo === "true"; 
    const deskripsi = p.deskripsi || "Tidak ada detail spek.";
    const namaAman = p.nama.replace(/'/g, "\\'");
    const deskripsiAman = deskripsi.toString().replace(/'/g, "\\'").replace(/\n/g, " ");
    
    const hargaFormat = Number(p.harga).toLocaleString('id-ID');
    const hargaLamaHTML = p.hargaLama ? `<span class="harga-lama">Rp${Number(p.hargaLama).toLocaleString('id-ID')}</span>` : "";

    if (isAdmin) {
      html += `
        <div class="card-admin">
          <img src="${p.gambar}" alt="${p.nama}">
          <div class="info-admin">
            <h4>${p.nama} ${isPromo ? '🔥' : ''}</h4>
            <p>Rp${hargaFormat}</p>
          </div>
          <div class="btn-group">
            <button class="btn-edit" onclick="editProduk('${p.id}','${namaAman}',${p.harga},'${p.gambar}','${deskripsiAman}','${p.kategori}','${p.status}',${isPromo},'${p.hargaLama || ''}')">✏️ Edit</button>
            <button class="btn-hapus" onclick="hapusProduk('${p.id}')">🗑️ Hapus</button>
          </div>
        </div>`;
    } else {
      html += `
        <div class="card">
          <div class="card-img-container">
            <img src="${p.gambar}" alt="${p.nama}">
            <div class="badge">${p.kategori || 'Game'}</div>
            ${isPromo ? `<div class="badge-promo">🔥 HOT ITEM</div>` : ''}
            ${isSold ? `<div class="sold-overlay"><div class="sold-label">SOLD OUT</div></div>` : ''}
          </div>
          <div class="card-info">
            <h4>${p.nama}</h4>
            <p class="deskripsi-teks">${deskripsi}</p>
            <p class="harga">${hargaLamaHTML} Rp${hargaFormat}</p>
            <button ${isSold ? 'disabled' : `onclick="beliWhatsApp('${namaAman}', ${p.harga})"`}>
                ${isSold ? 'SUDAH TERJUAL' : 'BELI SEKARANG'}
            </button>
          </div>
        </div>`;
    }
  });

  produkDiv.innerHTML = html || `<p style="text-align:center; width:100%; color:#94a3b8; padding:20px;">Produk tidak ditemukan.</p>`;
}

// --- 4. FUNGSI FILTER ---
window.filterGame = function(elemen, kategori) {
  const buttons = document.querySelectorAll('.btn-filter');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (elemen) elemen.classList.add('active');
  window.searchProduk(); 
};

// --- 5. FUNGSI STRUK DIGITAL ---
window.beliWhatsApp = (nama, harga) => {
  pesananSekarang = { nama, harga };
  const hargaFormat = Number(harga).toLocaleString('id-ID');
  
  const isiStruk = document.getElementById("isiStruk");
  if(isiStruk) {
      isiStruk.innerHTML = `
        <div style="display: flex; justify-content: space-between;"><span>Produk:</span> <b style="color:#00d2ff">${nama}</b></div>
        <div style="display: flex; justify-content: space-between;"><span>Harga:</span> <b>Rp${hargaFormat}</b></div>
        <div style="display: flex; justify-content: space-between;"><span>Biaya Admin:</span> <b style="color:#10b981">Rp0 (GRATIS)</b></div>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 10px 0;">
        <div style="display: flex; justify-content: space-between; font-size: 16px;"><span>Total Bayar:</span> <b style="color:#f1c40f">Rp${hargaFormat}</b></div>
      `;
      document.getElementById("modalStruk").style.display = "flex";
  } else {
      const pesan = `Halo Admin 👋, saya mau beli akun ini:\n\n📌 *Produk:* ${nama}\n💰 *Harga:* Rp${hargaFormat}\n\nApakah akun ini masih ready?`;
      window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
  }
};

window.kirimInvoiceWA = () => {
  const metode = document.getElementById("metodeBayar").value;
  const hargaFormat = Number(pesananSekarang.harga).toLocaleString('id-ID');
  const invoiceID = "INV-" + Math.floor(Math.random() * 100000);

  const pesan = `*📄 INVOICE PESANAN - FAZA STORE*\n` +
                `--------------------------------------------\n` +
                `🆔 *ID Pesanan:* ${invoiceID}\n` +
                `🎮 *Produk:* ${pesananSekarang.nama}\n` +
                `💰 *Harga:* Rp${hargaFormat}\n` +
                `💳 *Metode Bayar:* ${metode}\n` +
                `--------------------------------------------\n` +
                `Halo Admin 👋, saya sudah membuat pesanan di web. Saya ingin membayar menggunakan *${metode}*. Mohon instruksi selanjutnya!`;

  window.open(`https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`, "_blank");
  window.tutupStruk();
};

window.tutupStruk = () => {
  document.getElementById("modalStruk").style.display = "none";
};

// --- 6. FUNGSI PENGUMUMAN ---
window.updatePengumuman = async function() {
  const teks = document.getElementById("teksBaru").value;
  if (!teks) return alert("Isi dulu teks pengumumannya!");

  try {
    await setDoc(doc(db, "pengaturan", "pengumuman"), { isi: teks });
    alert("Pengumuman Berhasil Diperbarui!");
    location.reload();
  } catch (e) { alert("Gagal update: " + e.message); }
};

window.ambilPengumuman = async function() {
  const marquee = document.getElementById("isiPengumuman");
  if (!marquee) return;

  try {
    const data = await getDocs(collection(db, "pengaturan"));
    data.forEach((d) => {
      if(d.id === "pengumuman") {
        marquee.innerText = d.data().isi;
      }
    });
  } catch (e) { console.error("Gagal ambil pengumuman:", e); }
};

// --- 7. FITUR STATUS PESANAN (DRAWER SYSTEM) ---

window.toggleDrawer = function(show) {
  const drawer = document.getElementById('statusDrawer');
  const overlay = document.getElementById('drawerOverlay');
  
  if (!drawer || !overlay) return;

  if (show) {
    overlay.style.display = 'block';
    setTimeout(() => {
      overlay.classList.add('show');
      drawer.classList.add('active');
    }, 10);
  } else {
    drawer.classList.remove('active');
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 400);
  }
};

window.updateStatusPesanan = async function() {
  const id = document.getElementById("adminIdPesanan").value.trim().toUpperCase();
  const status = document.getElementById("adminStatusUpdate").value;

  if (!id) return alert("Masukkan ID Pesanan dulu!");

  try {
    await setDoc(doc(db, "pesanan", id), {
      status: status,
      updateAt: new Date().getTime()
    });
    alert("Status " + id + " berhasil diupdate!");
  } catch (e) { alert("Gagal update status: " + e.message); }
};

window.cekStatusPesanan = async function() {
  const id = document.getElementById("inputCekStatus").value.trim().toUpperCase();
  const boxHasil = document.getElementById("hasilStatus");

  if (!id) return alert("Masukkan ID Pesanan kamu!");

  boxHasil.style.display = "block";
  boxHasil.innerHTML = "🔍 Sedang melacak pesanan...";
  boxHasil.style.background = "rgba(0, 210, 255, 0.05)";
  boxHasil.style.border = "1px solid var(--input-border)";

  try {
    const docRef = doc(db, "pesanan", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      let warnaStatus = "#f1c40f"; 
      if(data.status.toLowerCase().includes("selesai")) warnaStatus = "#10b981"; 
      if(data.status.toLowerCase().includes("batal")) warnaStatus = "#ef4444"; 

      boxHasil.innerHTML = `
        <div style="border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 8px;">
          <b style="color:var(--primary)">ID: ${id}</b>
        </div>
        <div style="font-size:14px; color:white;">
          Status: <b style="color:${warnaStatus}">${data.status}</b>
        </div>
      `;
      boxHasil.style.border = `1px solid ${warnaStatus}`;
    } else {
      boxHasil.innerHTML = "❌ <b style='color:#ef4444'>ID Tidak Ditemukan.</b><br>Periksa kembali ID Invoice kamu.";
      boxHasil.style.border = "1px solid var(--danger)";
    }
  } catch (e) { 
    boxHasil.innerHTML = "⚠️ Gagal mengecek: " + e.message; 
  }
};

// --- 8. FUNGSI ADMIN PRODUK ---
window.submitProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const hargaLama = document.getElementById("hargaLama").value;
  const gambar = document.getElementById("gambar").value;
  const deskripsi = document.getElementById("deskripsi").value;
  const kategori = document.getElementById("kategori").value; 
  const status = document.getElementById("status").value;     
  const isPromo = document.getElementById("isPromo").checked; 
  const editId = document.getElementById("editId").value;

  if (!nama || !harga || !gambar) return alert("Wajib isi Nama, Harga, dan Gambar!");

  try {
    const dataObj = { 
      nama, 
      harga: Number(harga), 
      hargaLama: hargaLama ? Number(hargaLama) : null,
      gambar, 
      deskripsi, 
      kategori, 
      status,
      isPromo: isPromo 
    };

    if (editId) {
      await updateDoc(doc(db, "produk", editId), dataObj);
      alert("Data Berhasil Diupdate!");
    } else {
      await addDoc(collection(db, "produk"), dataObj);
      alert("Akun Berhasil Ditambahkan!");
    }
    location.reload();
  } catch (e) { alert("Gagal menyimpan: " + e.message); }
};

window.hapusProduk = async function(id) {
  if (confirm("Hapus data akun ini?")) {
    await deleteDoc(doc(db, "produk", id));
    location.reload();
  }
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori, status, isPromo, hargaLama) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("hargaLama").value = hargaLama || "";
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("status").value = status;
  document.getElementById("isPromo").checked = (isPromo === true || isPromo === "true");
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

// --- 9. FITUR TESTIMONI ---
window.submitTestimoni = async function() {
  const foto = document.getElementById("fotoTesti").value;
  const ket = document.getElementById("ketTesti").value;

  if (!foto) return alert("Link foto testimoni wajib diisi!");

  try {
    await addDoc(collection(db, "testimoni"), {
      foto: foto,
      keterangan: ket || "Testimoni Pelanggan",
      tanggal: new Date().getTime()
    });
    alert("Testimoni Berhasil Ditambahkan!");
    location.reload();
  } catch (e) { alert("Gagal: " + e.message); }
};

window.tampilTestimoni = async function() {
  const testiDiv = document.getElementById("list-testimoni");
  if (!testiDiv) return;

  const isAdmin = window.location.href.includes("admin.html");

  try {
    const q = query(collection(db, "testimoni"), orderBy("tanggal", "desc"));
    const querySnapshot = await getDocs(q);
    let html = "";
    
    querySnapshot.forEach((docSnap) => {
      const t = docSnap.data();
      const id = docSnap.id;
      
      if (isAdmin) {
        html += `
          <div class="card-testi" style="min-width:150px">
            <img src="${t.foto}" style="height:150px">
            <p>${t.keterangan}</p>
            <button onclick="hapusTestimoni('${id}')" style="background:red; color:white; border:none; padding:5px; width:100%; border-radius:5px; margin-top:5px; cursor:pointer">Hapus</button>
          </div>`;
      } else {
        html += `
          <div class="card-testi">
            <img src="${t.foto}" alt="Testi" onclick="window.open('${t.foto}', '_blank')">
            <p>${t.keterangan}</p>
          </div>`;
      }
    });
    testiDiv.innerHTML = html || "<p style='color:#94a3b8'>Belum ada testimoni.</p>";
  } catch (e) { console.error(e); }
};

window.hapusTestimoni = async function(id) {
  if (confirm("Hapus testimoni ini?")) {
    try {
      await deleteDoc(doc(db, "testimoni", id));
      alert("Testimoni terhapus!");
      location.reload();
    } catch (e) { alert("Gagal hapus testi"); }
  }
};

// Jalankan fungsi awal
tampilProduk();
tampilTestimoni();
ambilPengumuman();
