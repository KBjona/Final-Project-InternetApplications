class Item {
    constructor(item) {
        this.name = item.name;
        this.cost = item.cost;
        this.quantity = item.quantity;
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

const mail = 'Jona10112010@gmail.com';

let cart_items = [];

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

}



async function load_items() {
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
        c_item = new Item(items_arr[i]);
        total_cost += c_item.cost*c_item.quantity;
        cart_items.push(c_item);
        c_item.put_into_list(list,i);
    } 
    t_price.textContent = `${total_cost}$`; //change the placeholder to the real cost
}

async function delete_cart_items(element){
    element.disabled = true;
    const items_list = document.getElementById("products-list");
    if(!items_list || items_list.dataset.is_empty == 'T'){ // if we couldn't get the items list or it is already empty we can return
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
    element.disabled = false;

}