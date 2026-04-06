import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, getDoc, getDocs, setDoc, query, orderBy, onSnapshot, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore();

window.currentOrder = null;
window.currentFilter = "Semua";

window.showToast = (msg, color = "#10b981") => {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.style.backgroundColor = color;
  toast.className = "show";
  setTimeout(() => toast.classList.remove("show"), 3000);
};

window.onerror = function(msg, url, line, col, error) {
  alert("Error: " + msg + "\nLine: " + line);
  return false;
};
// ========== PRODUK ==========
window.tampilProduk = () => {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;
  onSnapshot(collection(db, "produk"), async (snapshot) => {
    let all = [];
    snapshot.forEach(d => all.push({ id: d.id, ...d.data() }));
    const statTotal = document.getElementById("statTotal");
    if (statTotal) statTotal.innerText = all.length;
    if (window.location.href.includes("admin.html")) await hitungCuan();
    if (!window.location.href.includes("admin.html") && window.currentFilter !== "Semua") {
      all = all.filter(p => p.kategori === window.currentFilter);
    }
    renderProduk(all);
  });
};

function renderProduk(data) {
  const produkDiv = document.getElementById("produk");
  const isAdmin = window.location.href.includes("admin.html");
  if (!produkDiv) return;
  let html = "";
  data.forEach(p => {
    const isSold = p.status === "Sold";
    const hargaFormat = Number(p.harga).toLocaleString('id-ID');
    if (isAdmin) {
      html += `<div class="card-admin">
        <div class="card-admin-info">
          <img src="${p.gambar.split(',')[0]}">
          <div><div style="font-weight:600;">${p.nama}</div><div style="color:#10b981;">Rp${hargaFormat}</div><div style="font-size:10px;">${(p.deskripsi || "").substring(0,50)}</div></div>
        </div>
        <div class="admin-actions">
          <button class="btn-warning" onclick="window.editProduk('${p.id}','${p.nama.replace(/'/g, "\\'")}',${p.harga},'${p.gambar}','${(p.deskripsi || "").replace(/'/g, "\\'")}','${p.kategori}')">✏️</button>
          <button class="btn-danger" onclick="window.hapusProduk('${p.id}')">🗑️</button>
        </div>
      </div>`;
    } else {
      html += `<div class="card"><div class="badge">${p.kategori}</div><img src="${p.gambar.split(',')[0]}"><div class="card-info"><h4>${p.nama}</h4><span class="harga-baru">Rp${hargaFormat}</span><button class="btn-beli" ${isSold ? 'disabled' : `onclick="window.bukaStruk('${p.nama.replace(/'/g, "\\'")}', ${p.harga}, '${p.id}')"`}>${isSold ? 'SOLD' : 'BELI'}</button></div></div>`;
    }
  });
  produkDiv.innerHTML = html || "<p style='text-align:center;'>Belum ada produk.</p>";
}

async function hitungCuan() {
  const snap = await getDocs(collection(db, "pesanan"));
  let total = 0;
  snap.forEach(doc => {
    const data = doc.data();
    if (data.status === "🎉 Pesanan Selesai") total += data.totalAkhir || data.total || 0;
  });
  const cuanEl = document.getElementById("statCuan");
  if (cuanEl) cuanEl.innerText = "Rp" + total.toLocaleString();
}

// ========== PEMBELIAN ==========
window.bukaStruk = (nama, harga, produkId) => {
  const modal = document.getElementById("modalStruk");
  if (!modal) return;
  window.currentOrder = { produk: nama, hargaAsli: harga, total: harga, voucher: "", produkId: produkId };
  const isi = document.getElementById("isiStruk");
  isi.innerHTML = `
    <div class="struk-header"><h3>FORM PEMBELIAN</h3><p>Isi data untuk menerima akun</p></div>
    <div class="struk-divider"></div>
    <div class="struk-item"><span>Produk:</span> <b>${nama}</b></div>
    <div class="struk-item"><span>Harga:</span> <b>Rp${harga.toLocaleString()}</b></div>
    <div class="struk-divider"></div>
    <label>NAMA PEMBELI</label><input type="text" id="pembeliNama" placeholder="Nama Anda...">
    <label>EMAIL PENERIMA</label><input type="email" id="pembeliEmail" placeholder="Email aktif...">
    <label>VOUCHER (Opsional)</label>
    <div style="display:flex; gap:5px;"><input type="text" id="inputVoucher"><button onclick="window.pakaiVoucher()" style="background:#0f172a;">CEK</button></div>
    <p id="pesanVoucher"></p>
    <div class="struk-total"><span>TOTAL:</span> <span id="displayTotal">Rp${harga.toLocaleString()}</span></div>
  `;
  modal.style.display = "flex";
};

window.pakaiVoucher = async () => {
  const kode = document.getElementById("inputVoucher").value.trim().toUpperCase();
  if (!kode) return window.showToast("Masukkan kode voucher!", "#ef4444");
  const docRef = doc(db, "vouchers", kode);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return window.showToast("Voucher tidak valid!", "#ef4444");
  const data = snap.data();
  if (data.kuota <= 0) return window.showToast("Voucher sudah habis!", "#ef4444");
  const potongan = data.potongan;
  const totalBaru = Math.max(0, window.currentOrder.hargaAsli - potongan);
  window.currentOrder.total = totalBaru;
  window.currentOrder.voucher = kode;
  document.getElementById("displayTotal").innerText = `Rp${totalBaru.toLocaleString()}`;
  document.getElementById("pesanVoucher").innerHTML = `<span style="color:#10b981;">✅ Voucher dipotong Rp${potongan.toLocaleString()}</span>`;
  window.showToast(`Voucher ${kode} berhasil!`, "#10b981");
};

window.handleConfirmBayar = async () => {
  const nama = document.getElementById("pembeliNama").value;
  const email = document.getElementById("pembeliEmail").value;
  if (!nama || !email) return window.showToast("Lengkapi data formulir!", "#ef4444");
  if (!email.includes("@") || !email.includes(".")) return window.showToast("Email tidak valid!", "#ef4444");
  try {
    if (window.currentOrder.voucher) {
      const vocRef = doc(db, "vouchers", window.currentOrder.voucher);
      const vocSnap = await getDoc(vocRef);
      if (vocSnap.exists()) await updateDoc(vocRef, { kuota: vocSnap.data().kuota - 1 });
    }
    await addDoc(collection(db, "pesanan"), {
      produk: window.currentOrder.produk,
      hargaAsli: window.currentOrder.hargaAsli,
      totalAkhir: window.currentOrder.total,
      voucher: window.currentOrder.voucher || "",
      pembeli: nama,
      email: email,
      status: "Menunggu Pembayaran",
      tanggal: new Date(),
      invoice: "INV-" + Date.now()
    });
    window.tutupStruk();
    window.showToast("Pesanan berhasil!", "#10b981");
    const notif = document.getElementById("salesNotif");
    if (notif) {
      document.getElementById("notifUser").innerHTML = nama;
      document.getElementById("notifProduk").innerHTML = `membeli ${window.currentOrder.produk}`;
      notif.classList.add("show");
      setTimeout(() => notif.classList.remove("show"), 5000);
    }
  } catch (e) { window.showToast("Gagal!", "#ef4444"); }
};

window.tutupStruk = () => {
  const modal = document.getElementById("modalStruk");
  if (modal) modal.style.display = "none";
};

// ========== ADMIN ==========
window.muatPesananAdmin = () => {
  const list = document.getElementById("listPesananAdmin");
  if (!list) return;
  onSnapshot(query(collection(db, "pesanan"), orderBy("tanggal", "desc")), (snap) => {
    let html = "";
    snap.forEach(d => {
      const p = d.data();
      const isSelesai = p.status === "🎉 Pesanan Selesai";
      html += `
        <div class="order-item-admin ${isSelesai ? 'status-selesai' : ''}">
          <p><b>Pembeli:</b> ${p.pembeli} | <b>Produk:</b> ${p.produk}</p>
          <p><b>Email:</b> ${p.email} | <b>Status:</b> ${p.status}</p>
          ${!isSelesai ? `
            <textarea id="dataAkun_${d.id}" placeholder="Email:Pass Akun" style="width:100%; margin-top:10px;"></textarea>
            <button class="btn-success" onclick="window.prosesKirimAkun('${d.id}','${p.email}','${p.produk}','${p.pembeli}')">📧 KIRIM DATA & SELESAI</button>
          ` : `<p style="color:#10b981;">✅ AKUN SUDAH DIKIRIM</p>`}
        </div>`;
    });
    list.innerHTML = html || "<p>Belum ada pesanan.</p>";
  });
};

window.prosesKirimAkun = async (docId, userEmail, produk, userNama) => {
  const detailAkun = document.getElementById(`dataAkun_${docId}`).value;
  if (!detailAkun) return window.showToast("Isi detail akun dulu!", "#ef4444");

  // Validasi email
  if (!userEmail || userEmail.trim() === "" || !userEmail.includes("@")) {
    window.showToast("❌ Email penerima tidak valid!", "#ef4444");
    console.error("Email Error:", userEmail);
    return;
  }

  // Parameter sesuai template EmailJS (lihat gambar: {{email_pembeli}}, {{nama_akun}})
  const templateParams = {
    email_pembeli: userEmail,   // untuk field "To Email"
    nama_akun: produk,          // untuk subject
    data_akun: detailAkun,    // untuk isi email (pastikan di content template ada {{data_akun}})
    nama_pembeli: userNama      // opsional, jika template membutuhkan
  };

  try {
    // Kirim email
    const response = await emailjs.send("service_xe358l6", "template_2j4eu9o", templateParams);
    console.log("✅ Email berhasil terkirim!", response);

    // Update status pesanan di Firestore
    await updateDoc(doc(db, "pesanan", docId), {
      status: "🎉 Pesanan Selesai",
      detailAkun: detailAkun
    });
    window.showToast(`✅ Akun berhasil dikirim ke ${userEmail}`, "#10b981");
  } catch (error) {
    console.error("❌ Gagal kirim email:", error);
    window.showToast(`❌ Gagal kirim email: ${error.text || error.message}`, "#ef4444");
  }
};

// Voucher
window.tambahVoucher = async () => {
  const kode = document.getElementById("vKode").value.trim().toUpperCase();
  const pot = Number(document.getElementById("vDiskon").value);
  const kuota = Number(document.getElementById("vKuota").value);
  if (!kode || !pot) return window.showToast("Lengkapi!", "#ef4444");
  await setDoc(doc(db, "vouchers", kode), { potongan: pot, kuota: kuota });
  window.showToast("Voucher tersimpan!");
  document.getElementById("vKode").value = "";
  document.getElementById("vDiskon").value = "";
  document.getElementById("vKuota").value = "";
  window.muatVoucherAdmin();
};

window.muatVoucherAdmin = () => {
  const list = document.getElementById("listVoucherAdmin");
  if (!list) return;
  onSnapshot(collection(db, "vouchers"), (snap) => {
    let html = "";
    snap.forEach(d => {
      html += `<div><b>${d.id}</b> - Rp${d.data().potongan.toLocaleString()} (sisa: ${d.data().kuota}) <button onclick="window.hapusVoucher('${d.id}')">X</button></div>`;
    });
    list.innerHTML = html;
  });
};

window.hapusVoucher = async (id) => {
  await deleteDoc(doc(db, "vouchers", id));
  window.showToast("Voucher dihapus");
};

// Testimoni
window.tambahTesti = async () => {
  const link = document.getElementById("inputTesti").value.trim();
  if (!link) return window.showToast("Masukkan link gambar!", "#ef4444");
  await addDoc(collection(db, "testimoni"), { gambar: link, tanggal: new Date() });
  window.showToast("Testimoni ditambahkan!");
  document.getElementById("inputTesti").value = "";
  if (window.location.href.includes("admin.html")) window.muatTestimoniAdmin();
  else window.muatTestimoniUser();
};

window.muatTestimoniAdmin = () => {
  const container = document.getElementById("list-testimoni-admin");
  if (!container) return;
  onSnapshot(collection(db, "testimoni"), (snap) => {
    let html = "";
    snap.forEach(d => {
      html += `<div><img src="${d.data().gambar}" style="width:100%;"><button onclick="window.hapusTesti('${d.id}')">Hapus</button></div>`;
    });
    container.innerHTML = html;
  });
};

window.muatTestimoniUser = () => {
  const container = document.getElementById("list-testimoni");
  if (!container) return;
  onSnapshot(collection(db, "testimoni"), (snap) => {
    let html = "";
    snap.forEach(d => { html += `<img src="${d.data().gambar}" style="width:100px;">`; });
    container.innerHTML = html;
  });
};

window.hapusTesti = async (id) => {
  if (confirm("Hapus?")) await deleteDoc(doc(db, "testimoni", id));
};

// CRUD Produk
window.submitProduk = async () => {
  const editId = document.getElementById("editId").value;
  const dataObj = {
    nama: document.getElementById("nama").value,
    harga: Number(document.getElementById("harga").value),
    gambar: document.getElementById("gambar").value,
    deskripsi: document.getElementById("deskripsi").value,
    kategori: document.getElementById("kategori").value,
    status: "Ready",
    tanggal: new Date()
  };
  if (!dataObj.nama || !dataObj.harga) return window.showToast("Lengkapi!", "#ef4444");
  if (editId) await updateDoc(doc(db, "produk", editId), dataObj);
  else await addDoc(collection(db, "produk"), dataObj);
  window.showToast("Sukses!");
  if (window.resetForm) window.resetForm();
};

window.editProduk = (id, nama, harga, gambar, deskripsi, kategori) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  const display = document.getElementById("displayHarga");
  if (display) display.value = new Intl.NumberFormat('id-ID').format(harga);
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("kategori").value = kategori;
  document.getElementById("editId").value = id;
  window.scrollTo({ top: 0 });
};

window.hapusProduk = async (id) => {
  if (confirm("Hapus?")) await deleteDoc(doc(db, "produk", id));
};

window.resetForm = () => {
  document.getElementById("nama").value = "";
  document.getElementById("harga").value = "";
  if (document.getElementById("displayHarga")) document.getElementById("displayHarga").value = "";
  document.getElementById("gambar").value = "";
  document.getElementById("deskripsi").value = "";
  document.getElementById("editId").value = "";
  window.showToast("Form dibersihkan.");
};

window.updatePengumuman = async () => {
  const teks = document.getElementById("inputPengumuman").value;
  await setDoc(doc(db, "pengaturan", "toko"), { pengumuman: teks });
  window.showToast("Pengumuman diupdate!");
};

// Filter & Lainnya
window.jalankanFilter = (game) => {
  window.currentFilter = game;
  window.tampilProduk();
};

window.cekStatusPesanan = async (invoice) => {
  const q = query(collection(db, "pesanan"), where("invoice", "==", invoice));
  const snap = await getDocs(q);
  if (snap.empty) return window.showToast("Invoice tidak ditemukan!", "#ef4444");
  snap.forEach(d => window.showToast(`Status: ${d.data().status}`, "#10b981"));
};

window.bukaDetail = (id, nama, harga, gambar, deskripsi, kategori) => {
  const modal = document.getElementById("modalDetail");
  if (!modal) return;
  document.getElementById("detailNama").innerText = nama;
  document.getElementById("detailDeskripsi").innerHTML = deskripsi || "Tidak ada deskripsi.";
  document.getElementById("detailGambarWadah").innerHTML = `<img src="${gambar.split(',')[0]}" style="width:100%;">`;
  document.getElementById("btnLanjutBeli").onclick = () => { window.bukaStruk(nama, harga, id); modal.style.display = "none"; };
  document.getElementById("btnNegoWA").onclick = () => { window.open(`https://wa.me/628123456789?text=Halo, saya mau nego ${nama}`, "_blank"); };
  modal.style.display = "flex";
};

// INIT
window.initApp = async () => {
  const pengDoc = await getDoc(doc(db, "pengaturan", "toko"));
  if (pengDoc.exists() && document.getElementById("isiPengumuman")) {
    document.getElementById("isiPengumuman").innerText = pengDoc.data().pengumuman;
  }
  const isAdmin = window.location.href.includes("admin.html");
  if (isAdmin) {
    window.muatPesananAdmin();
    window.muatVoucherAdmin();
    window.muatTestimoniAdmin();
    window.tampilProduk();
    const displayHarga = document.getElementById("displayHarga");
    if (displayHarga) {
      displayHarga.addEventListener("input", function(e) {
        let val = e.target.value.replace(/[^0-9]/g, "");
        document.getElementById("harga").value = val;
        e.target.value = new Intl.NumberFormat('id-ID').format(val);
      });
    }
  } else {
    window.muatTestimoniUser();
    window.tampilProduk();
  }
};

window.initApp();
