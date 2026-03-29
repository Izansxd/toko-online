import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// --- TAMPIL PRODUK ---
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return;

  const data = await getDocs(collection(db, "produk"));
  let html = "";
  const isAdmin = window.location.href.includes("admin.html");

  data.forEach((docSnap) => {
    const p = docSnap.data();
    // Gunakan isi deskripsi, jika kosong tampilkan teks bantuan
    const deskripsi = p.deskripsi || "Tidak ada deskripsi produk.";

    html += `
      <div class="card">
        <img src="${p.gambar}" alt="${p.nama}">
        <h4>${p.nama}</h4>
        <p style="font-size: 12px; color: #777; margin: 5px 0; min-height: 30px;">${deskripsi}</p>
        <p style="color: #2ecc71; font-weight: bold;">Rp${Number(p.harga).toLocaleString('id-ID')}</p>
        ${isAdmin 
          ? `<button style="background:red; margin-bottom:5px;" onclick="hapusProduk('${docSnap.id}')">🗑️ Hapus</button>
             <button style="background:blue;" onclick="editProduk('${docSnap.id}','${p.nama}',${p.harga},'${p.gambar}', '${deskripsi.replace(/'/g, "\\'")}')">✏️ Edit</button>` 
          : `<button onclick="beliWhatsApp('${p.nama}')">Beli Sekarang</button>`}
      </div>`;
  });
  produkDiv.innerHTML = html;
};

// --- FUNGSI ADMIN ---
window.submitProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const gambar = document.getElementById("gambar").value;
  const deskripsi = document.getElementById("deskripsi").value;
  const editId = document.getElementById("editId").value;

  if (!nama || !harga || !gambar) return alert("Isi semua field!");

  try {
    const dataBaru = { nama, harga: Number(harga), gambar, deskripsi };
    if (editId) {
      await updateDoc(doc(db, "produk", editId), dataBaru);
      alert("Update Berhasil!");
    } else {
      await addDoc(collection(db, "produk"), dataBaru);
      alert("Tambah Berhasil!");
    }
    location.reload();
  } catch (e) { alert("Error: " + e.message); }
};

window.hapusProduk = async function(id) {
  if (confirm("Hapus produk?")) {
    await deleteDoc(doc(db, "produk", id));
    tampilProduk();
  }
};

window.editProduk = (id, nama, harga, gambar, deskripsi) => {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  document.getElementById("deskripsi").value = deskripsi;
  document.getElementById("editId").value = id;
  window.scrollTo(0,0);
};

window.beliWhatsApp = (nama) => {
  window.open(`https://wa.me/628123456789?text=Halo, saya mau beli ${nama}`, "_blank");
};

tampilProduk();
