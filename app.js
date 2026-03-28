import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, addDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNoZShqjTqLQEmoYogAQTshXlKNPWphH4",
  authDomain: "toko-online-8a68d.firebaseapp.com",
  projectId: "toko-online-8a68d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// NAVIGASI
function hideAll(){
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("registerPage").style.display = "none";
  document.getElementById("userPage").style.display = "none";
  document.getElementById("adminPage").style.display = "none";
  document.getElementById("cartPage").style.display = "none";
}

window.showRegister = () => { hideAll(); document.getElementById("registerPage").style.display="block"; }
window.showLogin = () => { hideAll(); document.getElementById("loginPage").style.display="block"; }
window.showUser = () => { hideAll(); document.getElementById("userPage").style.display="block"; tampilProduk(); }
window.showCart = () => { hideAll(); document.getElementById("cartPage").style.display="block"; tampilCart(); }

// REGISTER
window.registerUser = function(){
  let email = regEmail.value;
  let pass = regPass.value;

  createUserWithEmailAndPassword(auth, email, pass)
    .then(()=> alert("Daftar berhasil"))
    .catch(err=> alert(err.message));
}

// LOGIN
window.loginUser = function(){
  let email = document.getElementById("email").value;
  let pass = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, pass)
    .then(()=> alert("Login berhasil"))
    .catch(err=> alert(err.message));
}

// AUTO LOGIN
onAuthStateChanged(auth, (user)=>{
  if(user){
    if(user.email === "admin@gmail.com"){
      hideAll();
      document.getElementById("adminPage").style.display="block";
    }else{
      showUser();
    }
  }else{
    showLogin();
  }
});

// LOGOUT
window.logout = ()=> signOut(auth);

// PRODUK
window.tambahProduk = function(){
  addDoc(collection(db,"produk"), {
    nama: nama.value,
    harga: harga.value
  }).then(()=> alert("Produk ditambah"));
}

// TAMPIL PRODUK
async function tampilProduk(){
  let data = await getDocs(collection(db,"produk"));
  let html = "";

  data.forEach(doc=>{
    let p = doc.data();
    html += `<p>${p.nama} - Rp${p.harga}
    <button onclick="tambahKeCart('${p.nama}', ${p.harga})">Beli</button></p>`;
  });

  document.getElementById("produk").innerHTML = html;
}

// CART
window.tambahKeCart = function(nama, harga){
  let cart = JSON.parse(localStorage.getItem("cart"))||[];
  cart.push({nama, harga});
  localStorage.setItem("cart", JSON.stringify(cart));
}

function tampilCart(){
  let cart = JSON.parse(localStorage.getItem("cart"))||[];
  let html="";

  cart.forEach(p=>{
    html += `<p>${p.nama} - Rp${p.harga}</p>`;
  });

  document.getElementById("cart").innerHTML = html;
}
