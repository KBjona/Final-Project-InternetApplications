//initializing the global parameters
let parameters = { "product-name": "", "product-description": "", "product-price": 0, "product-stock": 0, "product-discount": 0, "background-firstly-color": "#ffffff", "background-secondary-color": "#cccccc", "name-color": "#000000", "description-color": "#000000" };
let review = 0;
let show_img = true;
let product_id = null;
let product_name = null;
let product_price = -1;
let can_review = false;
let owner_id = null;
let is_following = false;

function get_product_id() { //extracting the store id from the url
    const cleanUrl = window.location.pathname.replace(/\/+$/, '');
    product_id = cleanUrl.split('/').pop();
}

function toggleMedia() {
    const img = document.getElementById("productImage"); //getting the elements we need
    const vid = document.getElementById("productVideo");
    const media_btn = document.getElementById("media-btn");

    if (!img || !vid || !media_btn) {

        return;
    }

    show_img = !show_img; // change what we need to see
    if (show_img) { // show the image and hide the video
        img.style.display = "block";
        vid.style.display = "none";
        media_btn.innerText = "🎬Show video"
    }
    else { // show the video and hide the image
        img.style.display = "none";
        vid.style.display = "block";
        media_btn.innerText = "🖼️Show Image";
    }
    vid.pause();
}

function togglefollowing() {
    const follow_btn = document.getElementById("follow-owner-btn");

    if (!follow_btn) {

        return;
    }

    is_following = !is_following; // change what we need to see
    if (is_following) { // show the image and hide the video
        follow_btn.innerText = "✓ Following";
        follow_btn.classList.add("following");
    }
    else { // show the video and hide the image
        follow_btn.innerText = "➕ Follow Owner";
        follow_btn.classList.remove("following");
    }
}

async function check_follow_state() {
    const follow_btn = document.getElementById("follow-owner-btn"); 
    if(!follow_btn || !owner_id) return; // if we couldnt get the follow button or the owner id we cant follow or unfollow

    const response = await fetch('/api/auth/check-follow', { // sends a post request to check whether the user already follows or doesn't follow the owner
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: owner_id })
    });

    const data = await response.json();
    if (!response.ok) { //if we couldnt see if the user follows or not

        return;
    }
    follow_btn.disabled = false;
    if (data.follow == 1) { // if the user already follows this owner
        togglefollowing();
    }
}

async function load_map() {
    const response = await fetch('/api/auth/location', { //sends a post request to get the owner's location
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: owner_id })
    });

    if (!response.ok) { //if we couldnt get the location
        return;
    }
    const data = await response.json();

    //getting the owner's latitude and longitude
    const lat = data.latitude;
    const long = data.longitude;

    const map = L.map('map').setView([lat, long], 12);//centers the map on the location we got and zooms 12
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; OpenStreetMap'}).addTo(map); //adds the visual location itself to the map
    L.marker([lat, long]).addTo(map); //marks the specific location in the map




    
}

async function load_store() {  // send a request to the server to get the parameters using the store id
    get_product_id();

    const response = await fetch('/api/product/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: product_id })
    });
    const data = await response.json(); //get the data of the response from the server
    if (!response.ok) { //if we couldnt get the parameters
        window.location.href = '/menu/';

        return;
    }
    else { //if the response is ok 
        product_name = data.parameters["product-name"];

        if (data.owner) {
            owner_id = data.owner;
            check_follow_state();
        }

        const original_price = Number(data.parameters["product-price"]); //getting the prices and discount
        const discount = Number(data.parameters["product-discount"]);
        const new_price = original_price - discount / 100 * original_price;
        product_price = new_price;

        let rating; // getting the rating
        if (!isNaN(data.rating) && typeof (data.rating) == 'number' && isFinite(data.rating)) { rating = (data.rating) + '★'; }
        else { rating = 'None'; }


        document.documentElement.style.setProperty('--background-firstly-color', data.parameters["background-firstly-color"]); //initializing the colors 
        document.documentElement.style.setProperty('--background-secondary-color', data.parameters["background-secondary-color"]);
        document.documentElement.style.setProperty('--text-color', data.parameters["name-color"]);
        document.documentElement.style.setProperty('--description-color', data.parameters["description-color"]);

        document.title = `Product: ${data.parameters["product-name"]}`; // setting the name and discription
        document.getElementById("product-name").innerText = data.parameters["product-name"];
        document.getElementById("product-description").innerText = data.parameters["product-description"];

        document.getElementById("product-price").innerText = `Original Price: \n ${original_price.toFixed(2)}$`; //setting the prices stock and rating
        document.getElementById("product-stock").innerText = `Stock: \n ${data.parameters["product-stock"]}`;
        document.getElementById("product-discount").innerText = `Discount: \n ${discount.toFixed(2)}%`;
        document.getElementById("product-price-after-discount").innerText = `New Price: \n ${new_price.toFixed(2)}$`;
        document.getElementById("product-rating").innerText = `Rating: \n ${rating}`;
    }
    if (data.productImage) { //if the image exists we load it to the canvas
        const img_canvas = document.getElementById("productImage");
        if (img_canvas) {
            const ctx = img_canvas.getContext("2d");
            const img = new Image();

            img.onload = function () { //setting the canvas size
                img_canvas.width = img.width;
                img_canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                if (img.src.startsWith("blob:")) {
                    URL.revokeObjectURL(img.src);
                }
            };

            if (typeof data.productImage === "string") { // if the image is a base64 string we can directly set the src to it
                img.src = data.productImage.startsWith("data:") ? data.productImage : `data:image/png;base64,${data.productImage}`;
            }
            else { // if the image is in raw bytes we need to convert it to blob in order to create the url for the image
                const img_raw_bytes = data.productImage.data || (data.productImage.buffer && data.productImage.buffer.data) || data.productImage.buffer;
                if (img_raw_bytes) {
                    const img_blob = new Blob([new Uint8Array(img_raw_bytes)], { type: 'image/png' });
                    img.src = URL.createObjectURL(img_blob);
                }
            }
        }
    }

    if (data.productVideo) { //if the video exists we load it to the video tag
        const vid = document.getElementById("productVideo");
        const media_btn = document.getElementById("media-btn");

        if (vid || media_btn) {
            if (typeof data.productVideo === "string") { // if the video is a base64 string we can directly set the src to it
                vid.src = data.productVideo.startsWith("data:") ? data.productVideo : `data:video/mp4;base64,${data.productVideo}`;

            }

            else { // if the video is in raw bytes we need to convert it to blob in order to create the url for the video
                const vid_raw_bytes = data.productVideo.data || (data.productVideo.buffer && data.productVideo.buffer.data) || data.productVideo.buffer;
                if (vid_raw_bytes) {
                    const vid_blob = new Blob([new Uint8Array(vid_raw_bytes)], { type: 'video/mp4' });
                    vid.src = URL.createObjectURL(vid_blob);
                }
            }//showing the media button if we can switch
            media_btn.style.display = "block";
        }

    }
    return;
}

window.onload = load_store;

async function send_review(event) { //send the review to the server
    event.disabled = true;
    if (review === null) {
        event.disabled = false;
        return;
    }
    const response = await fetch('/api/product/addreview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: product_id, rating: review })
    });
    const data = await response.json();
    if (!response.ok) { //if we couldnt send the review

        event.disabled = false;
        return;
    }

    //makes the send button and stars disabled after sending the rating
    event.innerText = "✓ Sent"; 
    event.classList.add("disabled-element");

    const stars_container = document.querySelector('.stars');
    if (stars_container){
        stars_container.classList.add("disabled-element");
    }
}

async function add_to_cart(event) { //send the request to the server to add the product to the cart
    event.disabled = true;
    if (!product_id || !product_name || product_price == -1) {
        // add popup
        event.disabled = false;
        return;
    }
    const response = await fetch('/api/cart/inc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: product_id, name: product_name, price: product_price })
    });
    const data = await response.json();
    if (!response.ok) { //if we couldnt add the product to the cart

        event.disabled = false;
        return;
    }
    event.disabled = false;
}

function check_or_uncheck(element, star_number) { // to check or uncheck the star rating based on the user's selection
    if (review === star_number) { //if he clicked on the same star again he wants to remove it
        review = null;
        element.checked = false;
    }
    else { // he wants to change the stars amount
        review = star_number;

    }
}

async function follow_or_unfollow(event) {
    if (!owner_id) { return; }
    event.disabled = true;

    const fetch_address = !is_following ? '/api/auth/follow' : '/api/auth/unfollow'; // to determinate if to follow or not to follow

    const response = await fetch(fetch_address, { //sends a post request to follow the owner
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: owner_id })
    });

    if (!response.ok) { //if we couldnt follow or unfollow

        event.disabled = false;
        return;
    }
    togglefollowing(); // change the button ui
    event.disabled = false;

}