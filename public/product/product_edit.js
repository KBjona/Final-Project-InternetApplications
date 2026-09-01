let parameters = { "product-name": "", "product-description": "", "product-price": 0, "product-stock": 0, "product-discount": 0, "product-weather": null, "background-firstly-color": "#ffffff", "background-secondary-color": "#cccccc", "name-color": "#000000", "description-color": "#000000" };
let editing = window.location.pathname != '/product/create';
let store_id = null;
let rating = null;
let facebook_page_id = null;
let facebook_page_access_token = null;

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
    if (!response.ok) {
        return false;
    }

    const data = await response.json(); //get the data of the response from the server

    if (!data.is_owner) { // if the user is not the owner of the store, redirect to the menu page

        return false;
    }
    return true;
}

async function load_store() {  // send a request to the server to get the parameters using the store id
    if (!editing) { //if we are not editing we have nothing to load
        document.title = 'Creating a store';
        return;
    }
    else if (!(await validate_owner()) && editing) { // if we are trying to edit a product that isnt ours
        window.location.href = '/menu/';
        return;
    }
    if (store_id == null) { //if we couldnt get the store id 
        window.location.href = '/menu/';
        return;
    }
    //if we are editing our store
    document.title = `Editing store`;
    let delete_btn = document.getElementById("delete-btn");
    if (delete_btn) {
        delete_btn.classList.remove("hidden");
    }
    const analytics_section = document.getElementById("analytics-section");
    if (analytics_section) {
        analytics_section.classList.remove("hidden");
    }
    const response = await fetch('/api/product/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: store_id })
    });
    const data = await response.json(); //get the data of the response from the server
    if (!response.ok) { //if we couldnt get the parameters
        window.location.href = '/menu/';

        return;
    }
    else { //if the response is ok 
        rating = data.rating;
        const pie_graph_text = document.getElementById("pie-graph-text");
        if (pie_graph_text) {
            pie_graph_text.innerHTML += " " + rating.toFixed(2);
        }
        for (const key in parameters) {
            if (data.parameters.hasOwnProperty(key)) { // if the key exists in the data, update the parameters object with the value from the data
                parameters[key] = data.parameters[key];
            }
            if (key === "product-weather" && parameters[key]) {
                const weather_to_check = document.getElementById(parameters[key]);
                if (weather_to_check) {
                    weather_to_check.checked = true;
                }
                continue;
            }
            const c_param = document.getElementById(key); //to update the value of the input fields with the values from the parameters object
            if (c_param) { //if the input field exists and is not a file input, update the value of the input field with the value from the parameters object
                c_param.value = parameters[key];
                if (key === "product-price" || key === "product-discount") { // so you cant change the price or discount to match the vibe of this app which is the same price always
                    c_param.disabled = true;
                }
            }
        }
        const bar_graph_text = document.getElementById("bar-graph-text");
        if (bar_graph_text) {
            bar_graph_text.innerText += " " + (Number(100 - parameters["product-discount"]) / 100).toFixed(2);
        }
        create_charts();
    }
    return;
}

async function delete_store(element) {
    element.disabled = true;
    if (!editing) {
        return;
    }

    const response = await fetch('/api/product/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: store_id })
    });

    const data = await response.json(); //get the data of the response from the server
    if (response.ok) { //if we couldnt get the parameters
        window.location.href = '/menu/';

        return;
    }
}

window.onload = load_store; //to get the store id and parameters when the page is loaded


function upload_file(id) { //to use the file input indirectly when clicking on the image or video upload button
    const input_to_focus = document.getElementById(id);
    if (input_to_focus) {
        input_to_focus.click();
    }
}

function validate_data() { //to validate the data before sending it to the server   
    if (parameters["product-name"].length < 1 || parameters["product-name"].length > 20) { return false; }
    if (parameters["product-description"].length < 1 || parameters["product-description"].length > 500) { return false; }
    if (isNaN(parameters["product-price"]) || parameters["product-price"] < 0 || parameters["product-price"] > 1000) { return false; }
    if (isNaN(parameters["product-stock"]) || parameters["product-stock"] < 0 || parameters["product-stock"] > 10000) { return false; }
    if (isNaN(parameters["product-discount"]) || parameters["product-discount"] < 0 || parameters["product-discount"] > 100) { return false; }
    if (!(document.querySelector('#weather-picker input[type="radio"]:checked'))) { return false; }
    if (!editing && !(document.getElementById('product-image')?.files[0])) { return false; }
    const img = document.getElementById("product-image");
    if (img.files[0]) {
        const img_file = img.files[0];
        if (img_file.size > 1024 * 1024) { // 1 MB in bytes
            return false;
        }
    }
    const vid = document.getElementById("product-video");
    if (vid.files[0]) {
        const vid_file = vid.files[0];
        if (vid_file.size > 6 * 1024 * 1024) { // 6 MB in bytes
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

function create_charts() {
    if (!editing) { return; }

    if (rating == null) { return; }
    const pie_chart_data = [{ label: "Rating", value: rating, color: "#32a852" }, { label: "Gap", value: 5 - rating, color: "#1f96d1" }]; //sets the elements we will use for the pie chart

    const pie_container = document.getElementById("pie-chart");
    if (pie_container) pie_container.innerHTML = ""; //clearing the div to add the graph cleanly
    const bar_container = document.getElementById("bar-chart");
    if (bar_container) bar_container.innerHTML = ""; //clearing the div to add the graph cleanly

    const base_size = 300; //initializing the sizes
    const bar_height = 40;
    const pie_radius = base_size / 2;

    const pie_svg = d3.select("#pie-chart").append("svg").attr("viewBox", `0 0 ${base_size} ${base_size}`).attr("preserveAspectRatio", "xMidYMid meet").style("width", "100%").style("height", "100%").style("max-height", "150px").append("g").attr("transform", `translate(${base_size / 2},${base_size / 2})`); //creating the svg - the vector for the pie chart

    const pie_generator = d3.pie().value(d => d.value).sort(null);
    const arc_generator = d3.arc().innerRadius(pie_radius * 0.3).outerRadius(pie_radius); //the drawing generator

    const pie_data = pie_generator(pie_chart_data);

    pie_svg.selectAll("path").data(pie_data).join("path").attr("d", arc_generator).attr("fill", d => d.data.color); //creating the pie chart


    const bar_svg = d3.select("#bar-chart").append("svg").attr("viewBox", `0 0 ${base_size} ${bar_height}`).attr("preserveAspectRatio", "xMidYMid meet").style("width", "100%").style("height", "100%").style("max-height", "150px"); //creating the svg - the vector for the bar chart

    const original_price = parseFloat(parameters["product-price"]) || 0; //calculating the prices
    const discount = parseFloat(parameters["product-discount"]) || 0;
    const new_price = original_price * (1 - discount / 100);
    const ratio = original_price > 0 ? Math.min(new_price / original_price, 1) : 0;

    bar_svg.append("rect").attr("x", 0).attr("y", 0).attr("width", base_size).attr("height", bar_height).attr("rx", 8).attr("fill", "#1f96d1"); //adding the full price rectangle
    bar_svg.append("rect").attr("x", 0).attr("y", 0).attr("width", base_size * ratio).attr("height", bar_height).attr("rx", 8).attr("fill", "#32a852"); //adding the new price rectangle
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

    }
    else {

        return;
    }
    return;
});

async function create_facebook_ad() {
    const create_ad_btn = document.getElementById("create-ad-btn");
    if (create_ad_btn) {
        create_ad_btn.disabled = true; //disable the button to prevent spamming clicks
    }
    else {
        return;
    }

    const img = document.getElementById("facebook-img"); //getting the elements
    const message = document.getElementById("facebook-msg");
    if (!img || !message) {
        create_ad_btn.disabled = false;
        return;
    }

    let image_base64 = null;
    try {
        if (img.files[0]) { //converts the image file to base64
            image_base64 = await file_to_base64(img.files[0]);
        }
        const response = await fetch('/api/auth/create-ad', { //sends a post request to the controller and there it sends a post request to facebook api
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message.value, image_base64: image_base64 })
        });

        let data = await response.json();
        if (response.ok) { //if the store saved successfully redirect to the menu page
            create_ad_btn.disabled = false;
            window.location.href = '/menu/';

        }
        else {
            const errorMessage = data.error?.message || data.error || data.message || "Failed to create Facebook ad.";
            alert(`Failed to create Facebook ad Error: ${errorMessage}`);
            create_ad_btn.disabled = false;
            return;
        }
    } catch (error) {
        alert(`Network error occurred while sending the request or getting the response: ${error}`);
        create_ad_btn.disabled = false;
    }
    create_ad_btn.disabled = false;
    return;
}

function openFacebookModal() {
    const modalElement = document.getElementById('facebookModal'); //opens the modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function showSelectedFileName(input) {
    const fileNameDisplay = document.getElementById('facebook-file-name'); //shows the file selected for the ad
    if (input.files && input.files[0]) {
        fileNameDisplay.textContent = `Selected: ${input.files[0].name}`;
    } else {
        fileNameDisplay.textContent = '';
    }
}