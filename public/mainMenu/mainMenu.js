let cart = [];
let mail = '';
let userFollowing = [];
let currentProducts = [];
let visiableCount = 5;

async function load_mail() {
  const response = await fetch('/api/auth/me'); // request user information from cookies
  if (!response.ok) return;

  const data = await response.json(); // read the information as json
  if (!data.loggedIn) return; // throw back to login

  mail = data.user.mail; // update mail
  userFollowing = data.user.followings || []; // save followings list

  const emailInput = document.getElementById('email');
  const fnameInput = document.getElementById('fname');
  const lnameInput = document.getElementById('lname'); // get all account settings information
  const long = document.getElementById("long");
  const lat = document.getElementById("lat")

  if (emailInput) emailInput.value = data.user.mail || ''; // if exists update
  if (fnameInput) fnameInput.value = data.user.fname || '';
  if (lnameInput) lnameInput.value = data.user.lname || '';
  if (long) long.value = data.user.longitude || '';
  if (lat) lat.value = data.user.latitude || '';

  await fetchDbCart();
}

async function fetchDbCart() {
  if (!mail) return;
  
  try{
    const res = await fetch('/api/cart/items');
    if (!res.ok) return;
    const data = await res.json();
    if (data.items) {
      cart = data.items.map(item => ({
         id: item._id,
         name: item.name,
         price: item.price,
         qty: item.quantity
      }));
      updateCartUI();
    }
    console.log(cart);
  }
  catch (err) {
    console.error("Failed to load cart from DB:", err);
  }
}

async function syncCartToDb() {
  if (!mail) return;

  const dbItems = cart.map(item => ({
    _id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.qty
  }));

  try {
    await fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: dbItems })
    });
  }
  catch (err) {
    console.error("failed to sync cart:", err);
  }
}

function addToCart(id, name, price) {
  const safe_price = Number(price) || 0;
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price: safe_price, qty: 1 });
  }

  updateCartUI();
  syncCartToDb(); // Persists updates to MongoDB
}

document.addEventListener('DOMContentLoaded', () => {
  const accountForm = document.querySelector('#Account-modal form');
  if (accountForm) {
    accountForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const longInput = document.getElementById('long')?.value;
      const latInput = document.getElementById('lat')?.value;

      const payload = {
        fname: document.getElementById('fname')?.value,
        lname: document.getElementById('lname')?.value,
        bday: document.getElementById('bday')?.value,
        password: document.getElementById('pass')?.value,
        longitude: longInput !== '' && longInput !== undefined ? parseFloat(longInput) : null,
        latitude: latInput !== '' && latInput !== undefined ? parseFloat(latInput) : null,
      };

      try {
        const res = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch('/api/product/getAll', { method: 'GET' });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    console.error("MongoDB Fetch Error:", error);
  }
}

function get_base64_prefix(base64_string) {
  if (base64_string.startsWith('iVBORw')) return 'data:image/png;base64';
  if (base64_string.startsWith('/9j/')) return 'data:image/jpeg;base64';
  if (base64_string.startsWith('R0lGOD')) return 'data:image/gif;base64';
  return 'data:image/png;base64'; // default to PNG if unknown
}

function renderProducts(products) {
  if(products){
    currentProducts = products;
    visiableCount = 5;
  }

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

  if (!currentProducts || currentProducts.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'text-muted text-center col-12 mt-3';
    emptyMsg.textContent = 'No products found in database.';
    productGrid.appendChild(emptyMsg);    return;
  }

  currentProducts.slice(0,visiableCount).forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const raw_price = (Number(product.parameters['product-price'])) || 0;
    const discount = Number(((product.parameters['product-discount'])/100).toFixed(2)) || 0;
    const priceVal = raw_price*(1-discount) ;
    const priceFormatted = (priceVal).toFixed(2);

    const numRatings = Number(product.num_ratings ?? product.parameters?.['num_ratings'] ?? 0);
    const sumRatings = Number(product.sum_ratings ?? product.parameters?.['sum_ratings'] ?? 0);

    const averageRating = numRatings > 0 ? (sumRatings / numRatings).toFixed(1) : null;

    let imageSrc = '/noImage.png';

    if (product.productImage) {
      imageSrc = product.productImage.startsWith('data:') || product.productImage.startsWith('http') || (product.productImage.startsWith('/') && !product.productImage.startsWith('/9j/'))
        ? product.productImage
        : `${get_base64_prefix(product.productImage)},${product.productImage}`;
    }

    const isOwner = (mail === product.owner); // check if current user is product owner

    const editButtonHtml = isOwner ? `
      <button class="btn btn-warning btn-sm mt-2" onclick="window.location.href='/product/edit/${product._id}'">
        ✏️ Edit Product
      </button>
    ` : ''; // if so make an edit button
    const ratingHtml = averageRating
      ? `<span class="text-warning small">★ ${averageRating} <span class="text-muted">`
      : `<span class="text-muted small">★ No reviews</span>`;
    card.innerHTML = `
    <a href="http://localhost:8080/product/${product._id}" class="product-link">
      <div class="product-image-wrap">
        <img src="${imageSrc}" alt="${product.parameters['product-name'] || 'Product'}">
      </div>
      <div class="product-info">
        <h5 class="product-name-class">${product.parameters['product-name'] || 'Untitled Product'}</h5>
        <p class="text-success fw-bold">$${priceFormatted}  ${ratingHtml}</p>
      </div>
    </a>
    <div class="px-3 pb-3">
      <button class="btn btn-primary btn-sm w-100" onclick="addToCart('${product._id}', '${product.parameters['product-name']}', ${priceVal})">
         Add to Cart
      </button>
      ${editButtonHtml}
    </div>
    `;
    productGrid.appendChild(card);
  });

  const loadMoreButton = document.getElementById("load-more-btn");
  if(loadMoreButton) loadMoreButton.style.display = visiableCount >= currentProducts.length ? 'none' : 'inline block'; // Hide button if no more items to show
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
          <small class="text-muted">$${Number(item.price).toFixed(2)} x ${item.qty}</small>
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
  let isSearching = false; // set up safeguard flag
  const searchInput = document.getElementById('store-search');
  if (searchInput) {
    searchInput.addEventListener('input', search) // search locally whenver something changed
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { // if clicked enter update from db
        event.preventDefault();

        if (event.repeat) return; // safeguard incase the user holds enter key
        if (isSearching) return; // safeguard incase user send a request while the last one hasn't finished
        try {
          isSearching = true;
          dbSearch();
        }
        finally {
          isSearching = false; // reset flag when request finished
        }
      }
    })
  }

  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    visiableCount += 5;
    renderProducts();
  });

  let isDeleteConfirmed = false;
  let deleteTimer = null;

  const deleteBtn = document.getElementById('delete-account-btn');

  if (deleteBtn) { // if button clicked
    deleteBtn.addEventListener('click', async () => {
      if (!isDeleteConfirmed) {
        isDeleteConfirmed = true;
        deleteBtn.textContent = '⚠️ Click again to confirm deletion'; // change text for user to understand
        deleteBtn.classList.remove('btn-outline-danger');
        deleteBtn.classList.add('btn-danger');

        deleteTimer = setTimeout(() => { // if no reclick after 4sec go back
          isDeleteConfirmed = false;
          deleteBtn.textContent = 'Delete Account';
          deleteBtn.classList.remove('btn-danger');
          deleteBtn.classList.add('btn-outline-danger');
        }, 4000);

      } else {
        clearTimeout(deleteTimer);
        deleteBtn.disabled = true;

        try {
          const response = await fetch('/api/auth/delete-account', { // try deleting account
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await response.json();
          if (response.ok) {
            window.location.href = ''; // Redirect to login page
          } else {
            console.error("Failed to delete acc");
            isDeleteConfirmed = false;
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete Account';
            deleteBtn.classList.remove('btn-danger');
            deleteBtn.classList.add('btn-outline-danger');
          }
        } catch (err) {
          console.error('Error deleting account:', err);
          alert('Server error occurred while attempting to delete account.');
        }
      }
    });
  }

});

function openSettings() {
  let currentTime = new Date();
  console.log(currentTime.getFullYear());

  const modal = document.getElementById("Account-modal");
  if (modal)
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

async function closeSettings() {
  const modal = document.getElementById("Account-modal");
  if (modal)
    modal.classList.add("hidden"); // hides the modal.
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload(); // refresh the page when user opened it, needed to update cart items when coming back from payment menu.
  }
});

function search() {
  let searchQuery = document.getElementById("store-search").value.toLowerCase().trim();
  let products = document.querySelectorAll(".product-card");

  products.forEach(product => { // go over all products
    let itemName = product.querySelector(".product-name-class");
    let searchName = itemName ? itemName.textContent.toLowerCase() : "";

    if (product.classList.contains("add-product-card")) return;

    console.log("itemName: " + itemName + " searchName: " + searchName);
    if (!searchQuery || (searchName.includes(searchQuery))) product.style.display = ""
    else product.style.display = "none";
  });
}

async function dbSearch() {
  const searchQuery = document.getElementById("store-search").value.toLowerCase().trim();
  const maxPrice = document.getElementById("maxPrice")?.value || 1000;
  const minDiscount = document.getElementById("minDiscount")?.value || 0;
 
  let minStars = 0;
  if (document.getElementById("stars5")?.checked) minStars = 5;
  if (document.getElementById("stars4")?.checked) minStars = 4;
  if (document.getElementById("stars3")?.checked) minStars = 3;
  if (document.getElementById("stars2")?.checked) minStars = 2;
  if (document.getElementById("stars1")?.checked) minStars = 1;

  const selectedSeasons = [];
  if (document.getElementById("Spring")?.checked) selectedSeasons.push("Warm");
  if (document.getElementById("Summer")?.checked) selectedSeasons.push("Hot");
  if (document.getElementById("Fall")?.checked) selectedSeasons.push("Cool");
  if (document.getElementById("Winter")?.checked) selectedSeasons.push("Cold");
  const weatherChecked = document.getElementById("ownWeather")?.checked || false; // check to see whice filters are selected

  const mineOnly = document.getElementById("mineOnly")?.checked || false;
  const followersOnly = document.getElementById("followersOnly")?.checked || false;

  const queryParams = new URLSearchParams({
    q: searchQuery,
    maxPrice: maxPrice,
    minDiscount: minDiscount,
    minStars: minStars,
    useWeather: weatherChecked,
    selectedSeasons: selectedSeasons.join(','),
    mineOnly: mineOnly,
    followersOnly: followersOnly,
    userMail: mail,
    following: userFollowing.join(',')
  });

  try {
    const response = await fetch(`/api/product/search?${queryParams.toString()}`);
    if (!response.ok) throw new Error('search requested faield');

    const groupedData = await response.json();
    const products = groupedData.flatMap(group => group.items || []);

    renderProducts(products);
    //search();
  }
  catch (err) {
    console.error("db search failed", err);
  }
}