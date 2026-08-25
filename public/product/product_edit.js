let parameters = { "product-name": "", "product-description": "", "product-price": "", "product-stock": "", "product-discount": 0, "background-firstly-color": "#ffffff", "background-secondary-color": "#cccccc", "name-color": "#000000", "description-color": "#000000" };
let editing = window.location.pathname != '/product/create';
let store_id = null;

function get_store_id() { //extracting the store id from the url
    if (editing) {
        const cleanUrl = window.location.pathname.replace(/\/+$/, '');
        store_id = cleanUrl.split('/').pop();
    }
}

async function validate_owner() { //to check if the user is the owner of the store
    if (!editing) {
        return true;
    }
    get_store_id();
    const response = await fetch('/api/product/validate', { //sends a request to the server to check if the user is the owner of the store
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: store_id })
    });
    const data = await response.json(); //get the data of the response from the server
    if (!data.is_owner) { // if the user is not the owner of the store, redirect to the menu page
        //add popup
        return false;
    }
    return true;
}

async function load_store() {  // send a request to the server to get the parameters using the store id
    if (!editing) {
        document.title = 'Creating a product';
        return;
    }
    else if (!(await validate_owner()) && editing) {
        window.location.href = '/menu/';
        return;
    }
    if(store_id == null){
        return;
    }
    document.title = `Editing Product`;
    const response = await fetch('/api/product/load', {
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
        for (const key in parameters) {
            if (data.parameters.hasOwnProperty(key)) { // if the key exists in the data, update the parameters object with the value from the data
                parameters[key] = data.parameters[key];
            }
            const c_param = document.getElementById(key); //to update the value of the input fields with the values from the parameters object
            if (c_param) { //if the input field exists and is not a file input, update the value of the input field with the value from the parameters object
                c_param.value = parameters[key];
            }
        }
    }
    return;
}

window.onload = load_store; //to get the store id and parameters when the page is loaded

function changed_param(param_name) {
    const param = document.getElementById(param_name); //to update the parameters when changed in the input fields
    if (!param) return;
    if (param.value != parameters[param_name]) {
        parameters[param_name] = param.value;
    }

}

function upload_file(id) { //to use the file input indirectly when clicking on the image or video upload button
    const input_to_focus = document.getElementById(id);
    if (input_to_focus) {
        input_to_focus.click();
    }
}

function validate_data() { //to validate the data before sending it to the server   
    if (parameters["product-name"].length < 1 || parameters["product-name"].length > 100) { return false }
    if (parameters["product-description"].length < 1 || parameters["product-description"].length > 500) { return false }
    if (isNaN(parameters["product-price"]) || parameters["product-price"] < 0 || parameters["product-price"] > 1000) { return false }
    if (isNaN(parameters["product-stock"]) || parameters["product-stock"] < 0 || parameters["product-stock"] > 1000000000) { return false }
    if (isNaN(parameters["product-discount"]) || parameters["product-discount"] <= 0 || parameters["product-discount"] >= 100) { return false }
    if(!editing && !(document.getElementById('product-image')?.files[0])) {return false}
    const img = document.getElementById("product-image");
    if(img.files[0]){
        const img_file = img.files[0];
        if(vid_file.size / (1024) * (1024) > 1){
            return false;
        }
    }
    const vid = document.getElementById("product-video");
    if(vid.files[0]){
        const vid_file = vid.files[0];
        if(vid_file.size / (1024) * (1024) > 8){
            return false;
        }
    }
    return true; //add pop ups to each check
}

function file_to_base64(file) { //to convert the file to base64 format
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
    });
}

const form = document.querySelector('#form');//to get the form element from the html

form.addEventListener('submit', async function (event) {
    event.preventDefault(); //so the browser will not reload the website

    let Formdata = new FormData(form); // to get the data from the form in a form data method
    Formdata = Object.fromEntries(Formdata); // converts the data to a key value form 

    delete Formdata['product-video'];//deleting them because we will handle them separately
    delete Formdata['product-image'];

    let video_base64 = null;
    let image_base64 = null;

    const image_file = document.getElementById('product-image').files[0]; //to get the image file from the input field
    if (image_file) {
        image_base64 = await file_to_base64(image_file); //converts the image file to base64 format
    }

    const video_file = document.getElementById('product-video').files[0]; //to get the image file from the input field
    if (video_file) {
        video_base64 = await file_to_base64(video_file); //converts the image file to base64 format
    }


    parameters = { ...parameters, ...Formdata }; //merges the parameters object with the form data object

    if (!validate_data()) { //to validate the data before sending it to the server
        //add popup
        return;
    }

    let req_body = { parameters, image_base64, video_base64 };
    let option = '';
    if (editing) { option = 'update'; req_body['_id'] = store_id; }
    else { option = 'create'; }
    const fetch_location = `/api/product/${option}`;
    const response = await fetch(fetch_location, { //sends a fetch request to the server to update the parameters of the store in the database
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req_body)
    });

    let data = await response.json();
    if (response.ok) { //if the store saved successfully redirect to the menu page
        window.location.href = '/menu/';
        //add popup
    }
    else {
        //add popup
        return;
    }
    return;
});