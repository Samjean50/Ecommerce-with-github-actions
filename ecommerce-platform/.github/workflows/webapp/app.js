const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
if (document.getElementById('products')) {
    fetch(`${API_URL}/cart/products`)
    .then(res => res.json())
    .then(products => {
        const container = document.getElementById('products');
        products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
            <h3>${p.name}</h3>
            <p>Price: $${p.price}</p>
            <button onclick="addToCart('${p.name}', 1)">Add to Cart</button>
        `;
        container.appendChild(div);
        });
    });
}

if (document.getElementById('cart')) {
    fetch(`${API_URL}/cart`)
    .then(res => res.json())
    .then(data => {
        const cart = data.cart;
        const container = document.getElementById('cart');
        if (cart.length === 0) {
        container.innerText = 'Cart is empty';
        } else {
        cart.forEach(item => {
            const div = document.createElement('div');
            div.innerText = `${item.product} (x${item.quantity})`;
            container.appendChild(div);
        });
        }
    });

    document.getElementById('checkoutBtn').addEventListener('click', () => {
    fetch(`${API_URL}/cart/checkout`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
        alert(data.message);
        location.reload();
        });
    });
}
});

function addToCart(product, quantity) {
fetch(`${API_URL}/cart/add`, {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json'
    },
    body: JSON.stringify({ product, quantity })
})
.then(res => res.json())
.then(data => {
    alert(data.message);
});
}