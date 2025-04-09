// Variables
let cart = [];
let selectedPayment = null;
let discountCode = '';
let discountAmount = 0;

// Load cart data from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            if (!Array.isArray(cart)) {
                 console.warn('Cart data in localStorage is not an array, resetting.');
                 cart = [];
            }
        } catch (e) {
            console.error('Error parsing cart data from localStorage:', e);
            cart = [];
        }
    } else {
        cart = [];
    }
}

// Format currency
function formatCurrency(amount) {
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) {
      return '0 VND';
    }
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(numberAmount);
}

// Update order summary
function updateOrderSummary() {
    loadCart();
    
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const discountElement = document.getElementById('discount');
    const totalElement = document.getElementById('total');
    const cartItemsElement = document.getElementById('cart-items');
    
    if (!cartItemsElement || !subtotalElement || !shippingElement || !discountElement || !totalElement) {
        console.error("One or more summary elements not found!");
        return;
    }
    
    // Clear old cart items in summary
    cartItemsElement.innerHTML = '';
    
    // Calculate subtotal and display items
    let currentSubtotal = calculateSubtotal(cart);
    
    cart.forEach(item => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        // Add item to summary display
        const itemElement = document.createElement('div');
        itemElement.className = 'summary-cart-item';
        itemElement.innerHTML = `
            <img src="${item.image || 'images/default-product.png'}" alt="${item.name || 'Sản phẩm'}" class="summary-item-image">
            <div class="summary-item-details">
                <div class="summary-item-name">${item.name || 'Sản phẩm không tên'}</div>
                <div>SL: ${item.quantity || 0} x ${formatCurrency(item.price || 0)}</div>
            </div>
            <div class="summary-item-total">${formatCurrency(itemTotal)}</div>
        `;
        cartItemsElement.appendChild(itemElement);
    });
    
    // Calculate shipping
    const currentShipping = calculateShipping(currentSubtotal);
    
    // Calculate total (using global discountAmount)
    const currentTotal = currentSubtotal + currentShipping - discountAmount;
    
    // Update summary display
    subtotalElement.textContent = formatCurrency(currentSubtotal);
    shippingElement.textContent = formatCurrency(currentShipping);
    discountElement.textContent = `-${formatCurrency(discountAmount)}`;
    totalElement.textContent = formatCurrency(currentTotal);
}

// Update discount display
function updateDiscountDisplay() {
    const discountDisplay = document.getElementById('applied-discount');
    const appliedDiscountAmountElement = document.getElementById('applied-discount-amount');

    if (!discountDisplay) return;

    if (discountCode && discountAmount > 0) {
        discountDisplay.innerHTML = `
            <div class="alert alert-success d-flex justify-content-between align-items-center p-2">
                <span>Mã <strong>${discountCode}</strong> (-${formatCurrency(discountAmount)})</span>
                <button type="button" class="btn-close p-1" aria-label="Close" onclick="removeDiscount()"></button>
            </div>
        `;
        if (!appliedDiscountAmountElement) {
            const span = document.createElement('span');
            span.id = 'applied-discount-amount';
            span.style.display = 'none';
            discountDisplay.parentNode.insertBefore(span, discountDisplay.nextSibling);
        }
        document.getElementById('applied-discount-amount').textContent = discountAmount;

    } else {
        discountDisplay.innerHTML = '';
        if (appliedDiscountAmountElement) {
             appliedDiscountAmountElement.textContent = '0';
        }
    }
}

// Remove discount
function removeDiscount() {
    const discountInput = document.getElementById('discount-code');
    discountCode = '';
    discountAmount = 0;
    if(discountInput) discountInput.value = '';
    updateOrderSummary();
    updateDiscountDisplay();
    toastr.info('Đã xóa mã giảm giá.');
}

// Calculate subtotal
function calculateSubtotal(currentCart) {
    if (!Array.isArray(currentCart)) return 0;
    return currentCart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
}

// Calculate shipping
function calculateShipping(currentSubtotal) {
    return currentSubtotal > 500000 ? 0 : 30000;
}

// Process payment
function processPayment() {
    console.log('Processing payment...');

    const getInputValue = (id) => document.getElementById(id)?.value.trim() || '';
    const fullName = getInputValue('fullName');
    const email = getInputValue('email');
    const phone = getInputValue('phone');
    const address = getInputValue('address');
    const note = getInputValue('note');

    let isValid = true;
    const showError = (field, message) => {
        toastr.error(message);
        const inputEl = document.getElementById(field);
        if(inputEl) inputEl.focus();
        isValid = false;
    };

    if (!fullName) showError('fullName', 'Vui lòng nhập họ và tên.');
    else if (!email) showError('email', 'Vui lòng nhập email.');
    else if (!/^\S+@\S+\.\S+$/.test(email)) showError('email', 'Email không hợp lệ.');
    else if (!phone) showError('phone', 'Vui lòng nhập số điện thoại.');
    else if (!/^[0-9\s+-]+$/.test(phone)) showError('phone', 'Số điện thoại không hợp lệ.');
    else if (!address) showError('address', 'Vui lòng nhập địa chỉ giao hàng.');

    if (!isValid) return;

    const paymentMethodName = getSelectedPaymentMethodName();
    if (!paymentMethodName) {
         toastr.error('Vui lòng chọn phương thức thanh toán.');
         return;
    }

    loadCart();
    if (cart.length === 0) {
        toastr.warning('Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm để đặt hàng.');
        return;
    }

    const finalSubtotal = calculateSubtotal(cart);
    const finalShipping = calculateShipping(finalSubtotal);
    const finalTotal = finalSubtotal + finalShipping - discountAmount;

    const newOrderId = generateOrderId();

    const orderDetails = {
        id: newOrderId,
        date: Date.now(),
        status: 'pending',
        items: [...cart],
        subtotal: finalSubtotal,
        shipping: finalShipping,
        discount: discountAmount,
        discountCode: discountCode,
        total: finalTotal,
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: address,
        note: note,
        paymentMethod: paymentMethodName
    };

    console.log('Order details prepared:', orderDetails);

    finalizeOrder(orderDetails);
}

// Get selected payment method name
function getSelectedPaymentMethodName() {
    if (!selectedPayment) return null;
    
    switch(selectedPayment) {
        case 'momo': return 'Momo';
        case 'vnpay': return 'VNPay';
        case 'zalopay': return 'ZaloPay';
        case 'cod': return 'Thanh toán khi nhận hàng (COD)';
        default: return selectedPayment;
    }
}

// Apply discount code
function applyDiscount() {
    const discountInput = document.getElementById('discount-code');
    if (!discountInput) return;
    const code = discountInput.value.trim().toUpperCase();

    if (!code) {
        toastr.warning('Vui lòng nhập mã giảm giá.');
        return;
    }

    console.log(`Validating discount code: ${code}`);
    toastr.info('Đang kiểm tra mã giảm giá...');

    setTimeout(() => {
        let isValid = false;
        let tempDiscountAmount = 0;
        let message = 'Mã giảm giá không hợp lệ hoặc đã hết hạn.';

        if (code === 'GIAM10') {
            tempDiscountAmount = 10000;
            isValid = true;
            message = 'Áp dụng mã giảm giá thành công!';
        } else if (code === 'GIAM20K') {
            tempDiscountAmount = 20000;
            isValid = true;
             message = 'Áp dụng mã giảm giá thành công!';
        }

        if (isValid) {
            discountCode = code;
            discountAmount = tempDiscountAmount;
            toastr.success(message);
        } else {
            toastr.error(message);
            discountInput.value = discountCode;
        }
        
        updateOrderSummary();
        updateDiscountDisplay();
    }, 500);
}

// Generate a unique order ID
function generateOrderId() {
    const date = new Date();
    const timestamp = date.getTime();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${randomSuffix}`;
}

// Show QR code modal
function showQRModal(paymentMethod) {
    const modal = new bootstrap.Modal(document.getElementById('qrModal'));
    const qrCode = document.getElementById('qr-code');
    const paymentTitle = document.getElementById('payment-title');
    
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

// Calculate total
function calculateTotal() {
    return calculateSubtotal(cart) + calculateShipping(calculateSubtotal(cart)) - discountAmount;
}

// Add new order to localStorage
function addNewOrderToStorage(orderDetails) {
    try {
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        if (!Array.isArray(orders)) orders = [];
        orders.push(orderDetails);
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log('Order saved to localStorage:', orderDetails.id);
    } catch (e) {
        console.error('Error saving order to localStorage:', e);
        toastr.error('Đã xảy ra lỗi khi lưu đơn hàng. Vui lòng thử lại.');
    }
}

// Show invoice in Modal
function showInvoiceModal(order) {
    const modalElement = document.getElementById('invoiceModal');
    if (!modalElement) {
        console.error("Invoice modal element '#invoiceModal' not found.");
        toastr.error(`Lỗi hiển thị hóa đơn cho đơn hàng: ${order.id}.`);
        return;
    }

    const formattedDate = new Date(order.date).toLocaleDateString('vi-VN', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text || 'N/A';
    };

    setText('invoice-order-id', order.id);
    setText('invoice-date', formattedDate);
    setText('invoice-name', order.customerName);
    setText('invoice-email', order.customerEmail);
    setText('invoice-phone', order.customerPhone);
    setText('invoice-address', order.shippingAddress);

    const itemsTbody = document.getElementById('invoice-items');
    if (itemsTbody) {
         if (Array.isArray(order.items) && order.items.length > 0) {
            itemsTbody.innerHTML = order.items.map(item => `
                <tr>
                    <td>${item.name || 'Sản phẩm'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${formatCurrency(item.price || 0)}</td>
                    <td>${formatCurrency((item.price || 0) * (item.quantity || 0))}</td>
                </tr>
            `).join('');
         } else {
             itemsTbody.innerHTML = '<tr><td colspan="4">Không có thông tin sản phẩm.</td></tr>';
         }
    } else {
         console.warn("Invoice items table body '#invoice-items' not found.");
    }

    setText('invoice-subtotal', formatCurrency(order.subtotal));
    setText('invoice-shipping', formatCurrency(order.shipping));
    setText('invoice-discount', `-${formatCurrency(order.discount)}`);
    setText('invoice-total', formatCurrency(order.total));

    try {
        const invoiceModal = new bootstrap.Modal(modalElement);
        invoiceModal.show();
        console.log('Invoice modal shown for order:', order.id);
    } catch (e) {
        console.error('Error showing Bootstrap modal:', e);
        toastr.error('Lỗi hiển thị hóa đơn.');
    }
}

// Update cart count
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        loadCart();
        const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        cartCountElement.textContent = count > 0 ? count : '';
        cartCountElement.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Select payment method
function selectPaymentMethod(methodId) {
    selectedPayment = methodId;
    
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const selectedElement = document.getElementById(`${methodId}-option`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
    } else {
        console.warn(`Payment option element not found for ID: ${methodId}-option`);
    }
}

// Logout
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userEmail');
    window.location.href = 'login.html';
}

// Check login status and display user name
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    
    const loginNavItem = document.getElementById('login-nav-item');
    const userNavItem = document.getElementById('user-nav-item');
    const userNameElement = document.getElementById('user-name');
    
    if (isLoggedIn && userEmail) {
        if(loginNavItem) loginNavItem.style.display = 'none';
        if(userNavItem) userNavItem.style.display = 'flex';
        if(userNameElement) userNameElement.textContent = userEmail;
    } else {
        if(loginNavItem) loginNavItem.style.display = 'flex';
        if(userNavItem) userNavItem.style.display = 'none';
    }
}

// Function to handle the final steps after order details are ready
function finalizeOrder(orderDetails) {
    // Lấy email người dùng đang đăng nhập
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    
    // Thêm email người dùng vào đơn hàng
    orderDetails.userEmail = userEmail;
    
    // 8a. Save the new order to localStorage
    addNewOrderToStorage(orderDetails);

    // 8b. Clear the cart from localStorage and update UI
    localStorage.removeItem('cart');
    cart = []; // Reset local cart variable
    updateCartCount(); // Update cart icon
    updateOrderSummary(); // Clear the summary sidebar
    // Clear discount info as well
    removeDiscount(); // This also updates display and summary

    // Show ONLY the final success notification
    if (typeof toastr !== 'undefined') {
         toastr.success('Đặt hàng thành công!'); // Keep this single success message
    } else {
         alert('Đặt hàng thành công!'); // Fallback alert
    }

    // *** RE-ENABLE a call to showInvoiceModal ***
    showInvoiceModal(orderDetails);

    // *** REMOVE THE AUTOMATIC REDIRECTION ***
    // setTimeout(() => {
    //     console.log('Redirecting to orders page after successful order.');
    //     window.location.href = 'orders.html';
    // }, 3000); 

}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Payment page DOM loaded.');
    checkLoginStatus();
    updateOrderSummary();
    updateDiscountDisplay();
    updateCartCount();
    
    const placeOrderButton = document.querySelector('.btn-place-order');
    if (placeOrderButton) {
        placeOrderButton.addEventListener('click', processPayment);
        console.log('Event listener attached to Place Order button.');
    } else {
        console.error('Place Order button (.btn-place-order) not found!');
    }

    const applyDiscountButton = document.querySelector('.btn-apply-discount');
    if (applyDiscountButton) {
        applyDiscountButton.addEventListener('click', applyDiscount);
        console.log('Event listener attached to Apply Discount button.');
    } else {
         console.warn('Apply Discount button (.btn-apply-discount) not found.');
    }

    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            const methodId = this.id.replace('-option', '');
            selectPaymentMethod(methodId);
            console.log(`Payment method selected: ${methodId}`);
        });
    });

    const returnHomeButton = document.querySelector('#invoiceModal .btn-primary');
    if (returnHomeButton && returnHomeButton.textContent.includes('Về trang chủ')) { 
        returnHomeButton.addEventListener('click', () => {
            console.log('Return to Home button clicked.');
            window.location.href = '../index.html';
        });
    }
    
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            closeButton: true,
            progressBar: true,
            positionClass: "toast-top-right",
            timeOut: 3500,
            preventDuplicates: true,
            newestOnTop: true
        };
        console.log('Toastr configured.');
    } else {
        console.warn('Toastr library not found.');
    }
}); 