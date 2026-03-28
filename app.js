// IMPORT FIREBASE
console.log("JALAN");
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, addDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// REGISTER
window.register = function(email, password){
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => alert("Berhasil daftar"))
    .catch(err => alert(err.message));
}

// LOGIN
window.login = function(email, password){
  signInWithEmailAndPassword(auth, email, password)
    .then(() => window.location.href = "index.html")
    .catch(err => alert(err.message));
}

// TAMBAH PRODUK
window.tambahProduk = function(nama, harga){
  addDoc(collection(db, "produk"), {
    nama, harga
  }).then(() => alert("Produk ditambah"));
}

// TAMPIL PRODUK
window.tampilProduk = async function(){
  const data = await getDocs(collection(db, "produk"));
  let html = "";

  data.forEach(doc => {
    let p = doc.data();
    html += `<p>${p.nama} - Rp${p.harga}</p>
    <button onclick="tambahKeCart('${p.nama}', ${p.harga})">Beli</button>`;
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