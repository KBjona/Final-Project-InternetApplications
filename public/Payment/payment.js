const mail = 'Jona10112010@gmail.com';
async function load_items() {
     const response = await fetch('api/cart/items',{ // send a fetch request to start the whole server load cart process
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail })
    });
}