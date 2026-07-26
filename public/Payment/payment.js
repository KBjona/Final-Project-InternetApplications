import { pop_up } from '../General-files/notifications-errors.js';

class Item {
    constructor(name,cost,quantity){ //basic constructor 
        this.name = name;
        this.cost = cost;
        this.quantity = quantity;
    }
    static item_to_entity(item) { // a "constructor" with the item
        return new Item(item.name, item.cost, item.quantity);
    }

    put_into_list(list,i) {
        const list_item = document.createElement('li'); // creates the list item
        list_item.className = 'product';

        const top_div = document.createElement('div'); // creates the top div
        top_div.className = 'top-div';

        const bottom_div = document.createElement('div'); // creates the bottom div
        bottom_div.className = 'bottom-div';

        const name_span = document.createElement('span'); // creates the name span
        name_span.className = 'product-name';
        name_span.textContent = this.name;

        const price_span = document.createElement('span'); // creates the cost span
        price_span.className = 'product-price';
        price_span.textContent = `${this.cost}$`;

        const qty_span = document.createElement('span'); // creates the quantity span
        qty_span.dataset.index = i; // creates an index for the index of the array (just for optimization to make the lookup O(1))
        qty_span.className = 'product-quantity';
        qty_span.textContent = this.quantity;

        const plus_qty = document.createElement('button'); // creates the plus button
        plus_qty.className = 'change-quantity';
        plus_qty.onclick = () => change_item_qty(plus_qty,1);
        plus_qty.textContent = '+';

        const minus_qty = document.createElement('button'); // creates the minus button
        minus_qty.className = 'change-quantity';
        minus_qty.onclick = () => change_item_qty(minus_qty,-1);
        minus_qty.textContent = '\u2212';
        
        top_div.append(name_span, price_span); // puts the name and price in the top div together
        bottom_div.append(plus_qty, qty_span, minus_qty); // puts the plus, minus and quantity in the bottom div together
        list_item.append(top_div, bottom_div); // puts the top div and the bottom div in the list item together
        list.append(list_item); // puts the list item in the list
    }
}

let mail = '';
const sccn = "1234-1234-1234-1234";

document.getElementById('purchase-button').addEventListener('click', openPayment);
document.getElementById('close-payment-btn').addEventListener('click', closePayment);
document.getElementById('SCCN').addEventListener('click', useSavedCard);
load_items();

let cart_items = [];

async function load_mail(){
    const response = await fetch('api/auth/me'); //request user information from cookies
    if(!response.ok) return; 

    const data = await response.json(); //read the information as json
    
    if(!data.loggedIn) return;

    mail = data.user.mail; // update mail
}

async function load_items() {
    await load_mail();
    if(mail == '') return;

    const list = document.getElementById("products-list"); // gets the list element
    const t_price = document.getElementById("total-price"); // gets the total price element

    if (!list) {
        return;
    }
    const response = await fetch('api/cart/items', { // send a fetch request to start the whole load cart process
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail })
    });
    const response_json = await response.json(); // stores the response

    if (!response.ok) { //if the response status is not good we can't get the items so we return;
        return;
    }
    const items_arr = response_json.items;  // takes the items array

    const items_len = items_arr.length;
    if (!t_price) {
        return;
    }
    if (items_len == 0) { //to check if the list is empty there is nothing to put in the cart
        t_price.textContent = '0$';
        return;
    }
    //initializes the current item and total
    let c_item = null;
    let total_cost = 0;
 
    list.dataset.is_empty = 'F';
    cart_items = [];
    for (let i = 0; i < items_len; i++) { // creates an item element for each element and creates his html tags and puts it in the list
        c_item = Item.item_to_entity(items_arr[i]);
        total_cost += c_item.cost*c_item.quantity;
        cart_items.push(c_item);
        c_item.put_into_list(list,i);
    } 
    t_price.textContent = `${total_cost.toFixed(2)}$`;; //change the placeholder to the real cost
}

function change_item_qty(element,num){
    const p_element = element.parentElement; //get to the parent element in order to get to the quantity span of this specific item
    if(!p_element){
        return;
    }
    const quantity = p_element.querySelector('.product-quantity');
    const total_price = document.getElementById("total-price");
    if(!quantity || !total_price){ //to ensure that you can change the quantity and total price accordingly
        return;
    }

    const i = quantity.dataset.index;
    if(parseInt(quantity.textContent) == 0 && num == -1){ // to make sure that the quantity isn't negative
        return;
    }
    
    quantity.textContent = parseInt(quantity.textContent) + num;// adds or removes and item and change the quantity accordingly
    cart_items[i].quantity += num;
    const c_total_price = parseFloat((total_price.textContent).slice(0,-1)); // to remove the dollar at the end of the string and parse it to float
    total_price.textContent = `${(c_total_price+(num)*(cart_items[i].cost)).toFixed(2)}$`;


    const gp_element = p_element.parentElement;
    if(parseInt(quantity.textContent) > 0 && gp_element){
        const name = gp_element.querySelector('.product-name');
        if(!name) return; // if we couldn't get them we won't remove the effect
        name.classList.remove("line-through");
    }

    if(parseInt(quantity.textContent) == 0 && num == -1 && gp_element){ // if there was only one but now zero it will add a line through the name and price (just for aesthetics) 
        const name = gp_element.querySelector('.product-name');
        if(!name) return; // if we couldn't get them we won't apply the effect
        name.classList.add("line-through");
    }
}

async function delete_cart_items(element){
    element.disabled = true;
    const items_list = document.getElementById("products-list");
    const t_price = document.getElementById("total-price"); // gets the total price element
    if(!items_list || !t_price || items_list.dataset.is_empty == 'T'){ // if we couldn't get the items list or it is already empty we can return
        return;
    }
    const response = await fetch('api/cart/delete', { // send a fetch request to start the whole delete cart's items process
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail })
    });
    if(!response.ok){ // if it couldn't delete successfully
        element.disabled = false;
        return;
    }
    items_list.innerHTML=''; //removes the html items' elements
    cart_items = []; //clears the cart items
    items_list.dataset.is_empty = 'T';  //adds the is empty attributes so it wont have to send a request every time to the db
    t_price.textContent = '0$';
    element.disabled = false;
}

async function update_items_quantity(element){
    element.disabled = true;
    const items = cart_items;
    console.log(cart_items);
    const response = await fetch('api/cart/update', { // send a fetch request to start the whole load cart process
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail, items })
    });

    if(response.ok) console.log("It worked");
    element.disabled = false;
}

function openPayment(){
    const modal = document.getElementById("payment-modal");
    if(modal)
        modal.classList.remove("hidden"); // makes the modal visiable to see the payment area.
}

async function closePayment(){
    const modal = document.getElementById("payment-modal");
    if(modal)
        modal.classList.add("hidden"); // hides the modal.
}



function useSavedCard(){
    const cc_field = document.getElementById("paymentInformation");
    if(cc_field)
        cc_field.value = sccn; // update credit card number field to saved card number

}