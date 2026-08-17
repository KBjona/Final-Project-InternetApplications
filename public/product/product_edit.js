let parameters = {"product-name": "", "product-description": "", "product-price": "", "product-stock": "","product-discount": 0, "product-image": null,"product-video": null,"background-color": "#ffffff", "name-color": "#000000", "description-color": "#000000" };
let store_id = null;

function get_store_id(){ //extracting the store id from the url
    const cleanUrl = window.location.pathname.replace(/\/+$/, '');
    store_id = cleanUrl.split('/').pop();
}

async function validate_owner(){ //to check if the user is the owner of the store
    get_store_id();
    const response = await fetch('/api/product/validate',{ //sends a request to the server to check if the user is the owner of the store
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: store_id })
    });
    const data = await response.json(); //get the data of the response from the server
    if (!data.is_owner) { // if the user is not the owner of the store, redirect to the menu page
        window.location.href = '/menu/';
        //add popup
        return;
    }
}

async function load_store() {  // send a request to the server to get the parameters using the store id
    await validate_owner();
    const response = await fetch('/api/product/load',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: store_id })
    });
    const data = await response.json(); //get the data of the response from the server
    if(!response.ok){ //if we couldnt get the parameters
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
            if (c_param && c_param.type !== 'file') { //if the input field exists and is not a file input, update the value of the input field with the value from the parameters object
                c_param.value = parameters[key];
            }
        }
    }
    return;
}

window.onload = load_store; //to get the store id and parameters when the page is loaded

function changed_param(param_name){
    const param = document.getElementById(param_name); //to update the parameters when changed in the input fields
    if (!param) return;
    if( param.value != parameters[param_name]){
        parameters[param_name] = param.value;
    }

}

function upload_file(id){ //to use the file input indirectly when clicking on the image or video upload button
    const input_to_focus = document.getElementById(id);
    if(input_to_focus){
        input_to_focus.click();
    }
}

function validate_data(){ //to validate the data before sending it to the server   
    if(parameters["product-name"].length < 1 || parameters["product-name"].length > 100){ return false}
    if(parameters["product-description"].length < 1 || parameters["product-description"].length > 500){ return false}
    if(isNaN(parameters["product-price"]) || parameters["product-price"] < 0 || parameters["product-price"] > 1000){ return false}
    if(isNaN(parameters["product-stock"]) || parameters["product-stock"] < 0 || parameters["product-stock"] > 10000){ return false}
    if(isNaN(parameters["product-discount"]) || parameters["product-discount"] < 0 || parameters["product-discount"] > 100){ return false}
    return true;
}

const form = document.querySelector('#form');//to get the form element from the html

form.addEventListener('submit',async function (event) {
    event.preventDefault(); //so the browser will not reload the website
    
    let Formdata = new FormData(form); // to get the data from the form in a form data method
    Formdata = Object.fromEntries(Formdata); // converts the data to a key value form 
    parameters = {...parameters, ...Formdata}; //merges the parameters object with the form data object
    if(!validate_data()){ //to validate the data before sending it to the server
        //add popup
        return;
    }
    const response = await fetch("/api/product/update",{ //sends a fetch request to the server to update the parameters of the store in the database
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({_id: store_id, parameters})
    });
    let data = await response.json();
    if(response.ok){ //if the store saved successfully redirect to the menu page
        window.location.href = '/menu/';
        //add popup
    }
    else{
        //add popup
        return;
    }
    return;
});