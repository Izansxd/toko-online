import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, getDoc, getDocs, setDoc, query, orderBy, onSnapshot, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d",
  storageBucket: "toko-online-8a68d.appspot.com"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore();
const storage = getStorage(app);

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

// ========== PRODUK ==========
window.tampilProduk = () => {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;
  onSnapshot(collection(db, "produk"), async (snapshot) => {
    let all = [];
    snapshot.forEach(d => all.push({ id: d.id, ...d.data() }));
    if (document.getElementById("statTotal")) document.getElementById("statTotal").innerText = all.length;
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
          <div><strong>${p.nama}</strong><br>Rp${hargaFormat}<br><small>${(p.deskripsi || "").substring(0,50)}</small></div>
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
  if (document.getElementById("statCuan")) document.getElementById("statCuan").innerText = "Rp" + total.toLocaleString();
}

// ========== PEMBELIAN (USER) ==========
window.bukaStruk = (nama, harga, produkId) => {
  const modal = document.getElementById("modalStruk");
  if (!modal) return;
  window.currentOrder = { produk: nama, hargaAsli: harga, total: harga, voucher: "", produkId: produkId };
  const isi = document.getElementById("isiStruk");
  isi.innerHTML = `
    <div class="struk-header"><h3>FORM PEMBELIAN</h3></div>
    <div class="struk-item"><span>Produk:</span> <b>${nama}</b></div>
    <div class="struk-item"><span>Harga:</span> <b>Rp${harga.toLocaleString()}</b></div>
    <label>NAMA PEMBELI</label><input type="text" id="pembeliNama" placeholder="Nama Anda">
    <label>EMAIL PENERIMA</label><input type="email" id="pembeliEmail" placeholder="Email aktif">
    <label>NOMOR WHATSAPP (opsional)</label><input type="text" id="pembeliWA" placeholder="08xxxx">
    <label>METODE PEMBAYARAN</label>
    <select id="metodeBayar">
      <option value="QRIS">QRIS</option>
      <option value="Dana">Dana</option>
      <option value="OVO">OVO</option>
      <option value="Gopay">Gopay</option>
    </select>
    <label>UPLOAD BUKTI TRANSFER (screenshot)</label>
    <input type="file" id="buktiFile" accept="image/*">
    <label>VOUCHER (Opsional)</label>
    <div style="display:flex; gap:5px;"><input type="text" id="inputVoucher"><button onclick="window.pakaiVoucher()" style="background:#0f172a;color:white;padding:5px;">CEK</button></div>
    <p id="pesanVoucher"></p>
    <div class="struk-total"><span>TOTAL:</span> <span id="displayTotal">Rp${harga.toLocaleString()}</span></div>
  `;
  modal.style.display = "flex";

  // Hapus event listener lama jika ada, lalu pasang yang baru
  const btnKirim = document.getElementById("btnKirimBukti");
  if (btnKirim) {
    // Clone dan ganti untuk menghapus listener lama
    const newBtn = btnKirim.cloneNode(true);
    btnKirim.parentNode.replaceChild(newBtn, btnKirim);
    newBtn.onclick = async () => {
      const nama = document.getElementById("pembeliNama").value;
      const email = document.getElementById("pembeliEmail").value;
      const wa = document.getElementById("pembeliWA").value;
      const metode = document.getElementById("metodeBayar").value;
      const fileInput = document.getElementById("buktiFile");
      const file = fileInput.files[0];
      if (!nama || !email) {
        window.showToast("Lengkapi nama dan email!", "#ef4444");
        return;
      }
      if (!file) {
        window.showToast("Upload bukti transfer!", "#ef4444");
        return;
      }
      if (!email.includes("@")) {
        window.showToast("Email tidak valid!", "#ef4444");
        return;
      }

      window.showToast("Mengupload bukti...", "#3b82f6");
      try {
        // Upload file ke Firebase Storage
        const fileName = `bukti_${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `bukti/${fileName}`);
        await uploadBytes(storageRef, file);
        const buktiUrl = await getDownloadURL(storageRef);

        // Simpan pesanan
        const orderData = {
          produk: window.currentOrder.produk,
          hargaAsli: window.currentOrder.hargaAsli,
          totalAkhir: window.currentOrder.total,
          voucher: window.currentOrder.voucher || "",
          pembeli: nama,
          email: email,
          wa: wa,
          metode: metode,
          buktiUrl: buktiUrl,
          status: "Menunggu Verifikasi",
          tanggal: new Date(),
          invoice: "INV-" + Date.now()
        };
        await addDoc(collection(db, "pesanan"), orderData);
        window.tutupStruk();
        window.showToast("Pesanan terkirim! Tunggu verifikasi admin.", "#10b981");
      } catch (err) {
        console.error(err);
        window.showToast("Gagal upload bukti: " + err.message, "#ef4444");
      }
    };
  } else {
    console.error("Tombol btnKirimBukti tidak ditemukan!");
  }
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

window.tutupStruk = () => {
  const modal = document.getElementById("modalStruk");
  if (modal) modal.style.display = "none";
};

// ========== ADMIN PESANAN ==========
window.muatPesananAdmin = () => {
  const list = document.getElementById("listPesananAdmin");
  if (!list) return;
  onSnapshot(query(collection(db, "pesanan"), orderBy("tanggal", "desc")), (snap) => {
    let html = "";
    snap.forEach(d => {
      const p = d.data();
      const isSelesai = p.status === "🎉 Pesanan Selesai";
      const isDitolak = p.status === "Ditolak";
      if (isSelesai || isDitolak) {
        html += `<div class="order-item status-selesai"><div class="order-selesai-ringkas"><span><b>${p.pembeli}</b> - ${p.produk} ${isSelesai ? '✅' : '❌'}</span><span>${p.status}</span></div></div>`;
      } else {
        html += `
          <div class="order-item">
            <div class="order-detail-lengkap">
              <p><b>${p.pembeli}</b> | ${p.produk} | ${p.email} | WA: ${p.wa || '-'}</p>
              <p>Metode: ${p.metode} | Total: Rp${p.totalAkhir.toLocaleString()}</p>
              <p>Status: ${p.status}</p>
              <a href="${p.buktiUrl}" target="_blank"><img src="${p.buktiUrl}" class="bukti-img"></a>
              <textarea id="dataAkun_${d.id}" placeholder="Isi detail akun (Email:Password)" rows="2"></textarea>
              <div class="aksi-group">
                <button class="btn-success" onclick="window.terimaPesanan('${d.id}','${p.email}','${p.produk}','${p.pembeli}')">✅ TERIMA & KIRIM</button>
                <button class="btn-danger" onclick="window.tolakPesanan('${d.id}','${p.email}','${p.pembeli}')">❌ TOLAK</button>
              </div>
            </div>
          </div>`;
      }
    });
    list.innerHTML = html || "<p>Belum ada pesanan.</p>";
  });
};

window.terimaPesanan = async (docId, userEmail, produk, userNama) => {
  const detailAkun = document.getElementById(`dataAkun_${docId}`).value;
  if (!detailAkun) return window.showToast("Isi detail akun!", "#ef4444");
  if (!userEmail || !userEmail.includes("@")) return window.showToast("Email tidak valid!", "#ef4444");
  const templateParams = {
    email_pembeli: userEmail,
    nama_akun: produk,
    data_akun: detailAkun,
    nama_pembeli: userNama
  };
  try {
    await emailjs.send("service_xe358l6", "template_2j4eu9o", templateParams);
    await updateDoc(doc(db, "pesanan", docId), { status: "🎉 Pesanan Selesai", detailAkun: detailAkun });
    await addDoc(collection(db, "notifikasi"), {
      email: userEmail,
      pesan: `✅ Pesanan ${produk} telah selesai. Akun sudah dikirim ke email ${userEmail}.`,
      tanggal: new Date(),
      dibaca: false
    });
    window.showToast(`Akun dikirim ke ${userEmail}`, "#10b981");
  } catch (err) {
    window.showToast(`Gagal kirim email: ${err.text}`, "#ef4444");
  }
};

window.tolakPesanan = async (docId, userEmail, userNama) => {
  const alasan = prompt("Masukkan alasan penolakan (contoh: BUKTI PALSU):");
  if (!alasan) return;
  await updateDoc(doc(db, "pesanan", docId), { status: "Ditolak", alasanTolak: alasan });
  await addDoc(collection(db, "notifikasi"), {
    email: userEmail,
    pesan: `❌ Pesanan Anda ditolak. Alasan: ${alasan}. Silakan upload ulang bukti yang valid.`,
    tanggal: new Date(),
    dibaca: false
  });
  window.showToast("Pesanan ditolak, notifikasi terkirim.", "#ef4444");
};

// ========== INBOX USER ==========
window.muatInbox = async () => {
  const container = document.getElementById("listInbox");
  if (!container) return;
  let userEmail = localStorage.getItem("userEmail");
  if (!userEmail) {
    userEmail = prompt("Masukkan email Anda untuk melihat notifikasi:");
    if (userEmail) localStorage.setItem("userEmail", userEmail);
    else return;
  }
  const q = query(collection(db, "notifikasi"), where("email", "==", userEmail), orderBy("tanggal", "desc"));
  const snap = await getDocs(q);
  if (snap.empty) {
    container.innerHTML = "<p style='text-align:center;'>Belum ada notifikasi.</p>";
    return;
  }
  let html = "";
  snap.forEach(d => {
    const notif = d.data();
    const tgl = notif.tanggal?.toDate ? notif.tanggal.toDate().toLocaleString() : new Date().toLocaleString();
    html += `<div class="inbox-item"><p>📩 ${tgl}</p><p>${notif.pesan}</p></div>`;
  });
  container.innerHTML = html;
};

// ========== VOUCHER ==========
window.tambahVoucher = async () => {
  const kode = document.getElementById("vKode").value.trim().toUpperCase();
  const pot = Number(document.getElementById("vDiskon").value);
  const kuota = Number(document.getElementById("vKuota").value);
  if (!kode || !pot) return window.showToast("Lengkapi kode dan potongan!", "#ef4444");
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
      html += `<div><b>${d.id}</b> - Rp${d.data().potongan.toLocaleString()} (sisa: ${d.data().kuota}) <button onclick="window.hapusVoucher('${d.id}')">❌</button></div>`;
    });
    list.innerHTML = html;
  });
};

window.hapusVoucher = async (id) => {
  await deleteDoc(doc(db, "vouchers", id));
  window.showToast("Voucher dihapus");
};

// ========== TESTIMONI ==========
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
      html += `<div style="background:#0f172a;padding:10px;border-radius:12px;"><img src="${d.data().gambar}" style="width:100%;border-radius:8px;"><button class="btn-danger" onclick="window.hapusTesti('${d.id}')" style="margin-top:5px;padding:5px;">Hapus</button></div>`;
    });
    container.innerHTML = html || "<p>Belum ada testimoni.</p>";
  });
};

window.muatTestimoniUser = () => {
  const container = document.getElementById("list-testimoni");
  if (!container) return;
  onSnapshot(collection(db, "testimoni"), (snap) => {
    let html = "";
    snap.forEach(d => {
      html += `<img src="${d.data().gambar}" style="width:100px;height:100px;object-fit:cover;border-radius:12px;">`;
    });
    container.innerHTML = html || "<p>Belum ada testimoni.</p>";
  });
};

window.hapusTesti = async (id) => {
  if (confirm("Hapus testimoni?")) await deleteDoc(doc(db, "testimoni", id));
};

// ========== CRUD PRODUK ==========
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
  if (!dataObj.nama || !dataObj.harga) return window.showToast("Lengkapi nama dan harga!", "#ef4444");
  if (editId) await updateDoc(doc(db, "produk", editId), dataObj);
  else await addDoc(collection(db, "produk"), dataObj);
  window.showToast("Produk tersimpan!");
  resetForm();
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
  if (confirm("Hapus produk?")) await deleteDoc(doc(db, "produk", id));
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

// ========== FILTER & LAINNYA ==========
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
  document.getElementById("detailGambarWadah").innerHTML = `<img src="${gambar.split(',')[0]}" style="width:100%;border-radius:10px;">`;
  document.getElementById("btnLanjutBeli").onclick = () => { window.bukaStruk(nama, harga, id); modal.style.display = "none"; };
  document.getElementById("btnNegoWA").onclick = () => { window.open(`https://wa.me/628123456789?text=Halo, saya mau nego ${nama}`, "_blank"); };
  modal.style.display = "flex";
};

// ========== INIT ==========
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
