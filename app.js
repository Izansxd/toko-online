// TAMPIL PRODUK UNTUK TOKO
window.tampilProduk = async function() {
  const data = await getDocs(collection(db,"produk"));
  let html = "";
  data.forEach(d=>{
    const p = d.data();
    html += `
      <div class="card">
        <img src="${p.gambar || 'https://via.placeholder.com/150'}" style="width:100%; border-radius:10px;">
        <h4>${p.nama}</h4>
        <p>Rp${p.harga}</p>
        <button onclick="tambahKeCart('${p.nama}', ${p.harga})">Beli</button>
      </div>
    `;
  });
  document.getElementById("produk").innerHTML = html;
}

// CART
window.tambahKeCart = function(nama,harga){
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({nama,harga});
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Masuk keranjang!");
}

window.showCart = function(){
  document.getElementById("cartPage").style.display = "block";
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let html = ""; let total = 0;
  cart.forEach(p => { html += `<p>${p.nama} - Rp${p.harga}</p>`; total += p.harga; });
  document.getElementById("cart").innerHTML = html;
  document.getElementById("totalHarga").innerHTML = `Total: Rp${total}`;
}

window.hideCart = function(){ document.getElementById("cartPage").style.display = "none"; }// Tampil Produk Admin
window.tampilProdukAdmin = async function() {
  const data = await getDocs(collection(db,"produk"));
  let html = "";
  data.forEach(d => {
    const p = d.data();
    html += `
      <div class="card">
        <h4>${p.nama}</h4>
        <p>Rp${p.harga}</p>
        <button onclick="hapusProduk('${d.id}')">🗑️ Hapus</button>
      </div>
    `;
  });
  document.getElementById("produk").innerHTML = html;
}
