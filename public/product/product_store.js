
let parameters = { "product-name": "", "product-description": "", "product-price": 0, "product-stock": 0, "product-discount": 0, "background-firstly-color": "#ffffff", "background-secondary-color": "#cccccc", "name-color": "#000000", "description-color": "#000000" };
let review = 0;
let store_id = null;

function get_store_id() { //extracting the store id from the url
    const cleanUrl = window.location.pathname.replace(/\/+$/, '');
    store_id = cleanUrl.split('/').pop();
}

async function load_store() {  // send a request to the server to get the parameters using the store id
    get_store_id();
    document.title = `Product: ${parameters["product-name"]}`;
    const response = await fetch('/api/product/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: store_id })
    });
    const data = await response.json(); //get the data of the response from the server
    if (!response.ok) { //if we couldnt get the parameters
        window.location.href = '/menu/';
        //add popup
        return;
    }
    else { //if the response is ok 
        const original_price = Number(data.parameters["product-price"]);
        const discount = Number(data.parameters["product-discount"]);
        const new_price = original_price - discount/100 * original_price;
        let rating = data.rating || 'None';
        console.log(data);
        if (rating != 'None') {rating = (rating)+'★'; }

        document.documentElement.style.setProperty('--background-firstly-color', data.parameters["background-firstly-color"]);
        document.documentElement.style.setProperty('--background-secondary-color', data.parameters["background-secondary-color"]);
        document.documentElement.style.setProperty('--text-color', data.parameters["name-color"]);
        document.documentElement.style.setProperty('--description-color', data.parameters["description-color"]);
        document.title = `Product: ${data.parameters["product-name"]}`;
        document.getElementById("product-name").innerText = data.parameters["product-name"];
        document.getElementById("product-description").innerText = data.parameters["product-description"];
        document.getElementById("product-price").innerText = `Original Price: \n ${original_price.toFixed(2)}$`;
        document.getElementById("product-stock").innerText = `Stock: \n ${data.parameters["product-stock"]}`;
        document.getElementById("product-discount").innerText = `Discount: \n ${discount.toFixed(2)}%`;
        document.getElementById("product-price-after-discount").innerText = `New Price: \n ${new_price.toFixed(2)}$`;
        document.getElementById("product-rating").innerText = `Rating: \n ${rating}`;
    }
    if (data.productImage) {
        const canvas = document.getElementById("productCanvas");
        if (canvas) {
            const ctx = canvas.getContext("2d");
            const img = new Image();

            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                if (img.src.startsWith("blob:")) {
                    URL.revokeObjectURL(img.src);
                }
            };

            if (typeof data.productImage === "string") { // if the image is a base64 string we can directly set the src to it
                img.src = data.productImage.startsWith("data:") ? data.productImage : `data:image/png;base64,${data.productImage}`;
            }
            else { // if the image is in raw bytes we need to convert it to blob in order to create the url for the image
                const raw_bytes = data.productImage.data || (data.productImage.buffer && data.productImage.buffer.data) || data.productImage.buffer;
                if (raw_bytes) {
                    const blob = new Blob([new Uint8Array(raw_bytes)], { type: 'image/png' });
                    img.src = URL.createObjectURL(blob);
                }
            }
        }
    }
    return;
}

window.onload = load_store;

async function send_review() { //send the review to the server
    if (review === null) {
        return;
    }
    const response = await fetch('/api/product/addreview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: store_id, rating: review })
    });
    const data = await response.json();
    if (!response.ok) { //if we couldnt send the review
        //add popup
        return;
    }
}

async function add_to_cart() { //send the request to the server to add the product to the cart
    const response = await fetch('/api/cart/inc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: store_id })
    });
    const data = await response.json();
    if (!response.ok) { //if we couldnt add the product to the cart
        //add popup
        return;
    }
}

function check_or_uncheck(element, star_number) { // to check or uncheck the star rating based on the user's selection
    if (review === star_number) {
        review = null;
        element.checked = false;
    }
    else {
        review = star_number;

    }
}