//initializing the global parameters
let parameters = { "product-name": "", "product-description": "", "product-price": 0, "product-stock": 0, "product-discount": 0, "background-firstly-color": "#ffffff", "background-secondary-color": "#cccccc", "name-color": "#000000", "description-color": "#000000" };
let review = 0;
let show_img = true;
let product_id = null;
let product_name = null;
let product_price = -1;

function get_product_id() { //extracting the store id from the url
    const cleanUrl = window.location.pathname.replace(/\/+$/, '');
    product_id = cleanUrl.split('/').pop();
}

function toggleMedia(){
    const img = document.getElementById("productImage"); //getting the elements we need
    const vid = document.getElementById("productVideo");
    const media_btn = document.getElementById("media-btn");

    if(!img || !vid || !media_btn) { 
        //add popup
         return;
    }

    show_img = !show_img; // change what we need to see
    if(show_img){ // show the image and hide the video
        img.style.display = "block";
        vid.style.display = "none";
        media_btn.innerText = "🎬Show video"
    }
    else{ // show the video and hide the image
        img.style.display = "none";
        vid.style.display = "block";
        media_btn.innerText = "🖼️Show Image";
    }
    vid.pause();
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
        //add popup
        return;
    }
    else { //if the response is ok 
        product_name = data.parameters["product-name"];

        const original_price = Number(data.parameters["product-price"]); //getting the prices and discount
        const discount = Number(data.parameters["product-discount"]);
        const new_price = original_price - discount/100 * original_price;
        product_price = new_price;

        let rating = 'None'; // getting the rating
        if (!isNaN(data.rating) && typeof(data.rating) == 'number' && isFinite(data.rating)) {rating = (data.rating)+'★'; }


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

            img.onload = function () {
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

    if(data.productVideo){ //if the video exists we load it to the video tag
        const vid = document.getElementById("productVideo");
        const media_btn = document.getElementById("media-btn");

        if(vid || media_btn){
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

async function send_review() { //send the review to the server
    if (review === null) {
        return;
    }
    const response = await fetch('/api/product/addreview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: product_id, rating: review })
    });
    const data = await response.json();
    if (!response.ok) { //if we couldnt send the review
        //add popup
        return;
    }
}

async function add_to_cart() { //send the request to the server to add the product to the cart
    if(!product_id || !product_name || product_price == -1) {
        // add popup
        return;
        }
    const response = await fetch('/api/cart/inc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: product_id, name: product_name, price: product_price })
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