let cart = [];

let mail = '';



async function load_mail() {
  const response = await fetch('api/auth/me'); // request user information from cookies
  if (!response.ok) return;

  const data = await response.json(); // read the information as json
  if (!data.loggedIn) return; // throw back to login

  mail = data.user.mail; // update mail
}

// Cart Pop-up Toggle
function toggleCart() {
  const cartPopup = document.getElementById('cart-popup');
  const cartBackdrop = document.getElementById('cart-backdrop');

  cartPopup.classList.toggle('open');
  cartBackdrop.classList.toggle('active');
}

// Fetch from MongoDB
async function fetchProductsFromDB() {
  // === PLACE YOUR MONGODB BACKEND ENDPOINT HERE ===
  const API_URL = "YOUR_MONGODB_API_ENDPOINT_HERE";

  try {
    const response = await fetch(API_URL);
    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    console.error("MongoDB Fetch Error:", error);
  }
}

function renderProducts(products) {
  const productGrid = document.getElementById('product-grid');
  productGrid.innerHTML = '';

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${product.imageUrl || 'images/placeholder.png'}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h5>${product.name}</h5>
        <p class="text-success fw-bold">$${product.price.toFixed(2)}</p>
        <button class="btn btn-primary btn-sm w-100" onclick="addToCart('${product._id}', '${product.name}', ${product.price})">
          Add to Cart
        </button>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  updateCartUI();
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
    const modal = document.getElementById("Account-modal");
    if(modal)
        modal.classList.remove("hidden"); // makes the modal visiable to see the payment area.
    let pass = document.getElementById("pass");
    if (pass && pass.value != "")
      pass.disabled = true;
    let bday = document.getElementById("bday");
    if (bday && bday.value != "")
      bday.disabled = true;
}

async function closeSettings(){
    const modal = document.getElementById("Account-modal");
    if(modal)
        modal.classList.add("hidden"); // hides the modal.
}