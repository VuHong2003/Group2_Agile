// Cart data structure
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Format price
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "đ";
}

// Update cart display
function updateCart() {
    const cartContainer = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const totalElement = document.getElementById('total');
    const cartCountElement = document.querySelector('.cart-count');

    // Update cart count in navigation
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = totalItems;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Giỏ hàng trống</h3>
                <p>Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                <a href="../index.html" class="btn btn-continue-shopping">Tiếp tục mua sắm</a>
            </div>
        `;
        subtotalElement.textContent = '0đ';
        shippingElement.textContent = '0đ';
        totalElement.textContent = '0đ';
        return;
    }

    let subtotal = 0;
    cartContainer.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="cart-item">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    </div>
                    <div class="col-md-3">
                        <h3 class="cart-item-title">${item.name}</h3>
                        <p class="cart-item-price">${formatPrice(item.price)}</p>
                    </div>
                    <div class="col-md-3">
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
                            <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <p class="cart-item-price">${formatPrice(itemTotal)}</p>
                    </div>
                    <div class="col-md-2">
                        <button class="remove-btn" onclick="removeItem(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const shipping = subtotal > 500000 ? 0 : 30000;
    const total = subtotal + shipping;

    subtotalElement.textContent = formatPrice(subtotal);
    shippingElement.textContent = shipping === 0 ? 'Miễn phí' : formatPrice(shipping);
    totalElement.textContent = formatPrice(total);
}

// Update quantity
function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) return;
    cart[index].quantity = parseInt(newQuantity);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    toastr.success('Đã cập nhật số lượng sản phẩm');
}

// Remove item
function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    toastr.success('Đã xóa sản phẩm khỏi giỏ hàng');
}

// Checkout
function checkout() {
    // Check if cart is empty
    if (cart.length === 0) {
        toastr.error('Giỏ hàng của bạn đang trống');
        return;
    }
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Direct redirect to payment page
    window.location.href = 'payment.html';
}

// Kiểm tra trạng thái đăng nhập
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    const loginNavItem = document.getElementById('login-nav-item');
    const userNavItem = document.getElementById('user-nav-item');
    const userNameElement = document.getElementById('user-name');

    if (isLoggedIn && userEmail) {
        loginNavItem.style.display = 'none';
        userNavItem.style.display = 'block';
        userNameElement.textContent = userEmail;
    } else {
        loginNavItem.style.display = 'block';
        userNavItem.style.display = 'none';
    }
}

// Đăng xuất
function logout() {
    localStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('userEmail');
    window.location.href = 'login.html';
}

// Save cart and redirect
function saveCartAndRedirect(event) {
    // Check if cart is empty
    if (cart.length === 0) {
        event.preventDefault();
        toastr.error('Giỏ hàng của bạn đang trống');
        return false;
    }
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Allow the link to navigate
    return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    updateCart();
}); 