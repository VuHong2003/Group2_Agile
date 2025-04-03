// Variables
let cart = [];
let selectedPayment = null;
let orderId = '';
let discountCode = '';
let discountAmount = 0;

// Load cart data from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Update order summary
function updateOrderSummary() {
    loadCart();
    
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const discountElement = document.getElementById('discount');
    const totalElement = document.getElementById('total');
    const cartItemsElement = document.getElementById('cart-items');
    
    // Clear cart items
    cartItemsElement.innerHTML = '';
    
    // Calculate subtotal
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        
        // Add item to summary
        const itemElement = document.createElement('div');
        itemElement.className = 'summary-item';
        itemElement.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>${formatCurrency(item.price * item.quantity)}</span>
        `;
        cartItemsElement.appendChild(itemElement);
    });
    
    // Calculate shipping (free for orders over 500,000 VND)
    const shipping = subtotal > 500000 ? 0 : 30000;
    
    // Calculate total
    const total = subtotal + shipping - discountAmount;
    
    // Update summary
    subtotalElement.textContent = formatCurrency(subtotal);
    shippingElement.textContent = formatCurrency(shipping);
    discountElement.textContent = formatCurrency(discountAmount);
    totalElement.textContent = formatCurrency(total);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPayment = method;
    
    // Update UI
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.getElementById(`${method}-option`).classList.add('selected');
}

// Apply discount code
function applyDiscount() {
    const discountInput = document.getElementById('discount-code');
    const code = discountInput.value.trim().toUpperCase();
    
    if (!code) {
        toastr.error('Vui lòng nhập mã giảm giá');
        return;
    }
    
    // Simulate API call to validate discount code
    toastr.info('Đang kiểm tra mã giảm giá...');
    
    setTimeout(() => {
        // Mock discount codes
        if (code === 'DRAGON10') {
            discountCode = code;
            discountAmount = 100000; // 100,000 VND
            toastr.success('Áp dụng mã giảm giá thành công!');
        } else if (code === 'DRAGON20') {
            discountCode = code;
            discountAmount = 200000; // 200,000 VND
            toastr.success('Áp dụng mã giảm giá thành công!');
        } else {
            toastr.error('Mã giảm giá không hợp lệ');
            discountCode = '';
            discountAmount = 0;
        }
        
        updateOrderSummary();
        updateDiscountDisplay();
    }, 1000);
}

// Update discount display
function updateDiscountDisplay() {
    const discountDisplay = document.getElementById('applied-discount');
    
    if (discountCode) {
        discountDisplay.innerHTML = `
            <div class="alert alert-success">
                Mã giảm giá <strong>${discountCode}</strong> đã được áp dụng
                <button type="button" class="btn-close float-end" onclick="removeDiscount()"></button>
            </div>
        `;
    } else {
        discountDisplay.innerHTML = '';
    }
}

// Remove discount
function removeDiscount() {
    discountCode = '';
    discountAmount = 0;
    document.getElementById('discount-code').value = '';
    updateOrderSummary();
    updateDiscountDisplay();
    toastr.info('Đã xóa mã giảm giá');
}

// Generate order ID
function generateOrderId() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `ORD${year}${month}${day}${random}`;
}

// Show QR code modal
function showQRModal(paymentMethod) {
    const modal = new bootstrap.Modal(document.getElementById('qrModal'));
    const qrCode = document.getElementById('qr-code');
    const paymentTitle = document.getElementById('payment-title');
    
    // Set QR code image based on payment method
    switch (paymentMethod) {
        case 'momo':
            qrCode.src = 'https://via.placeholder.com/200x200?text=Momo+QR';
            paymentTitle.textContent = 'Quét mã QR Momo';
            break;
        case 'vnpay':
            qrCode.src = 'https://via.placeholder.com/200x200?text=VNPay+QR';
            paymentTitle.textContent = 'Quét mã QR VNPay';
            break;
        case 'zalopay':
            qrCode.src = 'https://via.placeholder.com/200x200?text=ZaloPay+QR';
            paymentTitle.textContent = 'Quét mã QR ZaloPay';
            break;
    }
    
    modal.show();
}

// Close QR code modal
function closeQRModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('qrModal'));
    modal.hide();
}

// Show invoice
function showInvoice() {
    // Save order to localStorage
    const order = {
        id: orderId,
        date: new Date().toISOString(),
        items: cart,
        total: calculateTotal(),
        status: 'Đã xác nhận',
        paymentMethod: selectedPayment
    };
    
    // Get existing orders or initialize empty array
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Show invoice modal
    const modal = new bootstrap.Modal(document.getElementById('invoiceModal'));
    modal.show();
    
    // Update invoice details
    document.getElementById('invoice-order-id').textContent = orderId;
    document.getElementById('invoice-date').textContent = new Date().toLocaleDateString('vi-VN');
    document.getElementById('invoice-name').textContent = document.getElementById('fullName').value;
    document.getElementById('invoice-email').textContent = document.getElementById('email').value;
    document.getElementById('invoice-phone').textContent = document.getElementById('phone').value;
    document.getElementById('invoice-address').textContent = document.getElementById('address').value;
    
    // Update invoice items
    const invoiceItems = document.getElementById('invoice-items');
    invoiceItems.innerHTML = '';
    
    cart.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.price * item.quantity)}</td>
        `;
        invoiceItems.appendChild(row);
    });
    
    // Update invoice totals
    document.getElementById('invoice-subtotal').textContent = formatCurrency(calculateSubtotal());
    document.getElementById('invoice-shipping').textContent = formatCurrency(calculateShipping());
    document.getElementById('invoice-discount').textContent = formatCurrency(discountAmount);
    document.getElementById('invoice-total').textContent = formatCurrency(calculateTotal());
}

// Calculate subtotal
function calculateSubtotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Calculate shipping
function calculateShipping() {
    return calculateSubtotal() > 500000 ? 0 : 30000;
}

// Calculate total
function calculateTotal() {
    return calculateSubtotal() + calculateShipping() - discountAmount;
}

// Process payment
function processPayment() {
    if (!selectedPayment) {
        toastr.error('Vui lòng chọn phương thức thanh toán');
        return;
    }

    const form = document.getElementById('shipping-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Generate order ID
    orderId = generateOrderId();

    // Simulate payment process
    toastr.info('Đang xử lý thanh toán...');
    
    setTimeout(() => {
        switch (selectedPayment) {
            case 'momo':
            case 'vnpay':
            case 'zalopay':
                showQRModal(selectedPayment);
                // Simulate successful payment after 5 seconds
                setTimeout(() => {
                    closeQRModal();
                    toastr.success('Thanh toán thành công!');
                    showInvoice();
                }, 5000);
                break;
            case 'cod':
                toastr.success('Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm.');
                showInvoice();
                break;
        }
    }, 2000);
}

// Return to home page while maintaining login state
function returnToHome() {
    // Lưu trạng thái đăng nhập vào localStorage
    localStorage.setItem('isLoggedIn', 'true');
    // Chuyển hướng về trang chủ
    window.location.href = '../index.html';
}

// Kiểm tra trạng thái đăng nhập và hiển thị tên người dùng
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName') || 'Người dùng';
    
    const loginNavItem = document.getElementById('login-nav-item');
    const userNavItem = document.getElementById('user-nav-item');
    const userNameElement = document.getElementById('user-name');
    
    if (isLoggedIn) {
        loginNavItem.style.display = 'none';
        userNavItem.style.display = 'block';
        userNameElement.textContent = userName;
    } else {
        loginNavItem.style.display = 'block';
        userNavItem.style.display = 'none';
    }
}

// Hàm đăng xuất
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    updateOrderSummary();
    updateDiscountDisplay();
    
    // Configure toastr
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: 3000
    };
}); 