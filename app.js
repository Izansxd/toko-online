import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d",
  storageBucket: "toko-online-8a68d.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const storage = getStorage();

// TAMPIL PRODUK
window.tampilProduk = async function(){
  const data = await getDocs(collection(db,"produk"));
  let html = "";

  data.forEach(doc=>{
    let p = doc.data();
    html += `
  <div class="card">
    <img src="${p.gambar}" style="width:100%; border-radius:10px;">
    <h4>${p.nama}</h4>
    <p>Rp${p.harga}</p>
    <button onclick="tambahKeCart('${p.nama}', ${p.harga})">
      Beli
    </button>
  </div>
`;
  });

  document.getElementById("produk").innerHTML = html;
}

// CART
window.tambahKeCart = function(nama, harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama, harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

// TAMPIL CART
window.showCart = function(){
  document.getElementById("cartPage").style.display = "block";

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = "";

  cart.forEach(p=>{
    html += `<p>${p.nama} - Rp${p.harga}</p>`;
  });

  document.getElementById("cart").innerHTML = html;
}
//tambah produk

window.tambahProduk = async function(){
  alert("KLIK TERDETEKSI");

  let nama = document.getElementById("nama").value;
  let harga = document.getElementById("harga").value;
  let file = document.getElementById("gambar").files[0];

  if(!nama || !harga){
    alert("Isi nama & harga!");
    return;
  }

  let urlGambar = "https://via.placeholder.com/150"; // default dulu

  try {
    if(file){
      const storageRef = ref(storage, "produk/" + file.name);
      await uploadBytes(storageRef, file);
      urlGambar = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "produk"), {
      nama: nama,
      harga: Number(harga),
      gambar: urlGambar
    });

    alert("BERHASIL TAMBAH!");
  } catch (err) {
    alert("ERROR: " + err.message);
    console.error(err);
  }
}
// SEMBUNYIIN CART
window.hideCart = function(){
  document.getElementById("cartPage").style.display = "none";
}
