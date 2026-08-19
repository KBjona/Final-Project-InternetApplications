let parameters = { "product-name": "", "product-description": "", "product-price": 0, "product-stock": 0, "product-discount": 0, "background-firstly-color": "#ffffff", "background-secondary-color": "#cccccc", "name-color": "#000000", "description-color": "#000000" };
let review = null;
let store_id = null;

function get_store_id() { //extracting the store id from the url
    if (editing) {
        const cleanUrl = window.location.pathname.replace(/\/+$/, '');
        store_id = cleanUrl.split('/').pop();
    }
}

async function load_store() {  // send a request to the server to get the parameters using the store id
    if(store_id == null){
        return;
    }
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
        document.documentElement.style.setProperty('--background-firstly-color', data.parameters["background-firstly-color"]);
        document.documentElement.style.setProperty('--background-secondary-color', data.parameters["background-secondary-color"]);
        document.documentElement.style.setProperty('--text-color', data.parameters["name-color"]);
        document.documentElement.style.setProperty('--description-color', data.parameters["description-color"]);
        document.title = `Product: ${data.parameters["product-name"]}`;
        document.getElementById("product-name").innerText = data.parameters["product-name"];
        document.getElementById("product-description").innerText = data.parameters["product-description"];
        document.getElementById("product-price").innerText = data.parameters["product-price"];
        document.getElementById("product-stock").innerText = data.parameters["product-stock"];
        document.getElementById("product-discount").innerText = data.parameters["product-discount"];
        document.getElementById("product-price-after-discount").innerText = data.parameters["product-price"] - (data.parameters["product-price"] * data.parameters["product-discount"] / 100);
        document.getElementById("product-rating").innerText = data.rating;
    }
    return;
}

function check_or_uncheck(element, star_number) { // to check or uncheck the star rating based on the user's selection
    if (review === star_number) {
        review = null;
        element.checked = false;
    }
    else{
        review = star_number;
        
    }
}