let cart = [];

let mail = '';



async function load_mail() {
  const response = await fetch('/api/auth/me'); // request user information from cookies
  if (!response.ok) return;

  const data = await response.json(); // read the information as json
  if (!data.loggedIn) return; // throw back to login

  mail = data.user.mail; // update mail

  const emailInput = document.getElementById('email');
  const fnameInput = document.getElementById('fname');
  const lnameInput = document.getElementById('lname');

  if (emailInput) emailInput.value = data.user.mail || '';
  if (fnameInput) fnameInput.value = data.user.fname || '';
  if (lnameInput) lnameInput.value = data.user.lname || '';

  await fetchDbCart();
}

async function fetchDbCart() {
  if (!mail) return;
  
  try{
    const res = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mail })
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.items) {
      cart = data.items.map(item => ({
         id: item.name,
         name: item.name,
         price: item.cost,
         qty: item.quantity
      }));
      updateCartUI();
    }
  }
  catch (err) {
    console.error("Failed to load cart from DB:", err);
  }
}

async function syncCartToDb() {
  if (!mail) return;

  const dbItems = cart.map(item => ({
    name: item.name,
    cost: item.price,
    quantity: item.qty
  }));

  try {
    await fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json'},
      body: JSON.stringify({ mail, items:dbItems})
    });
  }
  catch (err){
    console.error("failed to sync cart:", err);
  }
}

function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id || item.name === name);
  
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  
  updateCartUI();
  syncCartToDb(); // Persists updates to MongoDB
}

document.addEventListener('DOMContentLoaded', () => {
  const accountForm = document.querySelector('#Account-modal form');
  if (accountForm) {
    accountForm.addEventListener('submit', async (e) => { e.preventDefault();

    const payload = {
      fname: document.getElementById('fname')?.value,
      lname: document.getElementById('lname')?.value,
      bday: document.getElementById('bday')?.value,
      password: document.getElementById('pass')?.value,      
    };

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) closeSettings();
    }
    catch (err) {
      console.error("Update failed:", err);
    }
    });
  }
});

// Cart Pop-up Toggle
function toggleCart() {
  const cartPopup = document.getElementById('cart-popup');
  const cartBackdrop = document.getElementById('cart-backdrop');

  cartPopup.classList.toggle('open');
  cartBackdrop.classList.toggle('active');
}

// Fetch from MongoDB
async function fetchProductsFromDB() {
  try {
    const response = await fetch('/api/product/getAll', {method: 'GET'});
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    console.error("MongoDB Fetch Error:", error);
  }
}

function renderProducts(products) {
  const productGrid = document.getElementById('product-grid');
  productGrid.innerHTML = '';

  const addProductCard = document.createElement('div');
  addProductCard.className = 'product-card add-product-card';
  addProductCard.innerHTML = `
    <a href="/product/create" class="add-product-link">
      <div class="add-icon-wrap">
        <span class="plus-icon">+</span>
      </div>
      <div class="product-info text-center mt-2">
        <h5>New Product</h5>
        <p class="text-muted small mb-0">List a new item for sale</p>
      </div>
    </a>
  `;
  productGrid.appendChild(addProductCard);

  if (!products || products.length === 0) {
    productGrid.innerHTML = `<p class="text-muted text-center col-12">No products found in database.</p>`;
    return;
  }
  
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const priceVal = product.parameters['product-price'] ?? 0;
    const priceFormatted = Number(priceVal).toFixed(2);
    const imageSrc = product.productImage || 'noImage.png';

    const isOwner =  (mail === product.owner); // check if current user is product owner

    const editButtonHtml = isOwner ? `
      <button class="btn btn-warning btn-sm mt-2" onclick="window.location.href='http://localhost:8080/product/edit/${product._id}'">
        ✏️ Edit Product
      </button>
    ` : ''; // if so make an edit button
    card.innerHTML = `
      <div class="product-image-wrap">
      <a href="http://localhost:8080/product/${product._id}" class="product-link">
        <img src="${imageSrc}" alt="${product.parameters['product-name'] || 'Product'}">
      </div>
      <div class="product-info">
        <h5 class="product-name-class">${product.parameters['product-name'] || 'Untitled Product'}</h5>
        <p class="text-success fw-bold">$${priceFormatted}</p>
        </a>
        <button class="btn btn-primary btn-sm w-100" onclick="addToCart('${product._id}', '${product.parameters['product-name']}', ${priceVal})">
          Add to Cart
        </button>
        ${editButtonHtml}
      </div>
    `;
    productGrid.appendChild(card);
  });
}


function updateCartUI() {
  const cartItemsList = document.getElementById('cart-items-list');
  const emptyCartMsg = document.getElementById('empty-cart-msg');
  const cartBadge = document.getElementById('cart-badge');
  const cartTotal = document.getElementById('cart-total');

  cartItemsList.innerHTML = '';
  let totalCount = 0;
  let totalPrice = 0;

  if (cart.length === 0) {
    emptyCartMsg.style.display = 'block';
  } else {
    emptyCartMsg.style.display = 'none';

    cart.forEach(item => {
      totalCount += item.qty;
      totalPrice += item.price * item.qty;

      const li = document.createElement('li');
      li.className = 'list-group-item bg-dark text-white d-flex justify-content-between align-items-center mb-2 border-secondary rounded';
      li.innerHTML = `
        <div>
          <h6 class="my-0">${item.name}</h6>
          <small class="text-muted">$${item.price.toFixed(2)} x ${item.qty}</small>
        </div>
        <span class="fw-bold">$${(item.price * item.qty).toFixed(2)}</span>
      `;
      cartItemsList.appendChild(li);
    });
  }

  cartBadge.innerText = totalCount;
  cartTotal.innerText = `$${totalPrice.toFixed(2)}`;
}



document.addEventListener('DOMContentLoaded', () => {
  load_mail();
  fetchProductsFromDB();

  const maxPriceInput = document.getElementById('maxPrice');
  const maxPriceDisplay = document.getElementById('priceVal');
  const minDiscountInput = document.getElementById('minDiscount');
  const minDiscountDisplay = document.getElementById('discountVal');

  if (maxPriceInput && maxPriceDisplay) {
    maxPriceInput.addEventListener('input', (event) => {
      maxPriceDisplay.textContent = `0$ - ${event.target.value}$`;
    });
  }

  if (minDiscountInput && minDiscountDisplay) {
    minDiscountInput.addEventListener('input', (event) => {
      minDiscountDisplay.textContent = `${event.target.value}% - 100%`;
    });
  }
});

function openSettings(){
    let currentTime = new Date();
    console.log(currentTime.getFullYear());

    const modal = document.getElementById("Account-modal");
    if(modal)
        modal.classList.remove("hidden"); // makes the modal visiable to see the payment area.
    let pass = document.getElementById("pass");
    if (pass && pass.value != "")
      pass.disabled = true;
    let bday = document.getElementById("bday");
    if (bday && bday.value != "")
      bday.disabled = true;
    let bdayms = new Date(bday.value);
    if ((currentTime < bdayms.getTime()) || currentTime.getFullYear() - bdayms.getFullYear() > 120)
      console.log("invalid age");

  }

async function closeSettings(){
    const modal = document.getElementById("Account-modal");
    if(modal)
        modal.classList.add("hidden"); // hides the modal.
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload(); // refresh the page when user opened it, needed to update cart items when coming back from payment menu.
  }
});

function search(){
  let searchQuery = document.getElementById("store-search").value.toLowerCase().trim();
  let products = document.querySelectorAll(".product-card");

  products.forEach( product => { // go over all products
    let itemName = product.querySelector(".product-name-class");
    let searchName = itemName ? itemName.textContent.toLowerCase() : "";
    console.log("itemName: " + itemName + " searchName: " + searchName);
    if ((searchName.includes(searchQuery))) product.style.display = ""
    else product.style.display = "none";
  });
}