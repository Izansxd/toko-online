import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 1. Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// 2. TAMPIL PRODUK
window.tampilProduk = async function() {
  const produkDiv = document.getElementById("produk");
  if (!produkDiv) return; // Mencegah error jika elemen tidak ada

  const data = await getDocs(collection(db, "produk"));
  let html = "";
  const isAdmin = window.location.href.toLowerCase().includes("admin.html");

  data.forEach(docSnap => {
    const p = docSnap.data();
    html += `
      <div class="card">
        <img src="${p.gambar}" alt="${p.nama}" style="width:100%; height:150px; object-fit:cover;">
        <h4>${p.nama}</h4>
        <p>Rp${Number(p.harga).toLocaleString('id-ID')}</p>
        ${isAdmin 
          ? `<button class="hapus-btn" style="background:red; color:white;" onclick="hapusProduk('${docSnap.id}')">🗑️ Hapus</button>
             <button style="background: blue; color:white; margin-top:5px;"
                     onclick="editProduk('${docSnap.id}','${p.nama}',${p.harga},'${p.gambar}')">✏️ Edit</button>` 
          : `<button onclick="tambahKeCart('${p.nama}', ${p.harga})">Beli</button>`}
      </div>
    `;
  });

  produkDiv.innerHTML = html;
}

// 3. TAMBAH / UPDATE PRODUK (Fungsi yang dipanggil tombol di admin.html)
window.submitProduk = async function() {
  const nama = document.getElementById("nama").value;
  const harga = document.getElementById("harga").value;
  const gambar = document.getElementById("gambar").value;
  const editId = document.getElementById("editId").value;

  if (!nama || !harga || !gambar) {
    alert("Isi semua field!");
    return;
  }

  try {
    if (editId) {
      // PROSES UPDATE
      await updateDoc(doc(db, "produk", editId), {
        nama: nama,
        harga: Number(harga),
        gambar: gambar
      });
      alert("Produk berhasil diupdate!");
    } else {
      // PROSES TAMBAH BARU
      await addDoc(collection(db, "produk"), {
        nama: nama,
        harga: Number(harga),
        gambar: gambar
      });
      alert("Produk berhasil ditambah!");
    }

    // Reset Form
    document.getElementById("nama").value = "";
    document.getElementById("harga").value = "";
    document.getElementById("gambar").value = "";
    document.getElementById("editId").value = "";
    
    tampilProduk(); // Refresh daftar
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat menyimpan data.");
  }
}

// 4. EDIT PRODUK (Memasukkan data ke form)
window.editProduk = function(id, nama, harga, gambar) {
  document.getElementById("nama").value = nama;
  document.getElementById("harga").value = harga;
  document.getElementById("gambar").value = gambar;
  document.getElementById("editId").value = id;
  window.scrollTo(0,0); // Scroll ke atas agar admin tahu data sudah masuk form
}

// 5. HAPUS PRODUK
window.hapusProduk = async function(id) {
  if(confirm("Yakin mau hapus produk ini?")){
    await deleteDoc(doc(db, "produk", id));
    tampilProduk();
  }
}

// Jalankan fungsi tampil produk saat halaman dimuat
tampilProduk();
