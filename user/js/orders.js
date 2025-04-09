// Kiểm tra trạng thái đăng nhập
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    // Không tạo đơn hàng mẫu nữa
    loadOrders();
    setupEventListeners();
});

// Kiểm tra trạng thái đăng nhập
function checkLoginStatus() {
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !userEmail) {
        // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
        window.location.href = 'login.html';
        return;
    }
    
    // Cập nhật tên người dùng
    document.getElementById('user-name').textContent = userEmail;
    
    // Cập nhật số lượng sản phẩm trong giỏ hàng
    updateCartCount();
}

// Cập nhật số lượng sản phẩm trong giỏ hàng
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = cartCount;
}

// Thiết lập các sự kiện
function setupEventListeners() {
    // Sự kiện đăng xuất
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Sự kiện hủy đơn hàng
    document.getElementById('modal-cancel-order').addEventListener('click', function() {
        const orderId = this.getAttribute('data-order-id');
        if (orderId) {
            cancelOrder(orderId);
        }
    });
    
    // Sự kiện đặt lại đơn hàng
    document.getElementById('modal-reorder').addEventListener('click', function() {
        const orderId = this.getAttribute('data-order-id');
        if (orderId) {
            reorderItems(orderId);
        }
    });
}

// Đăng xuất
function logout() {
    // Xóa thông tin đăng nhập
    localStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('isLoggedIn');
    
    // Chuyển hướng về trang đăng nhập
    window.location.href = 'login.html';
}

// Format price
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "đ";
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'pending':
            return 'Chờ xác nhận';
        case 'shipping':
            return 'Đang giao';
        case 'delivered':
            return 'Đã nhận hàng';
        default:
            return 'Không xác định';
    }
}

// Get status class
function getStatusClass(status) {
    switch(status) {
        case 'pending':
            return 'status-pending';
        case 'shipping':
            return 'status-shipping';
        case 'delivered':
            return 'status-delivered';
        default:
            return '';
    }
}

// Generate timeline HTML
function generateTimeline(order) {
    let timelineHTML = '';
    
    // Tạo timeline dựa trên trạng thái đơn hàng
    const timelineItems = [
        {
            date: order.date,
            text: 'Đơn hàng đã được tạo',
            active: true
        }
    ];
    
    if (order.status === 'pending') {
        timelineItems.push({
            date: order.date,
            text: 'Đơn hàng đang chờ xác nhận',
            active: true
        });
    } else if (order.status === 'shipping') {
        timelineItems.push(
            {
                date: order.date,
                text: 'Đơn hàng đã được xác nhận',
                active: true
            },
            {
                date: new Date(new Date(order.date).getTime() + 24*60*60*1000).toISOString(),
                text: 'Đơn hàng đang được giao',
                active: true
            }
        );
    } else if (order.status === 'delivered') {
        timelineItems.push(
            {
                date: order.date,
                text: 'Đơn hàng đã được xác nhận',
                active: true
            },
            {
                date: new Date(new Date(order.date).getTime() + 24*60*60*1000).toISOString(),
                text: 'Đơn hàng đang được giao',
                active: true
            },
            {
                date: new Date(new Date(order.date).getTime() + 2*24*60*60*1000).toISOString(),
                text: 'Đơn hàng đã được giao thành công',
                active: true
            }
        );
    }
    
    timelineHTML = `
        <div class="order-timeline">
            <h4 class="timeline-title">Trạng thái đơn hàng</h4>
            <div class="timeline">
                ${timelineItems.map(item => `
                    <div class="timeline-item">
                        <div class="timeline-dot ${item.active ? 'active' : ''}"></div>
                        <div class="timeline-content">
                            <div class="timeline-date">${formatDate(item.date)}</div>
                            <div class="timeline-text">${item.text}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    return timelineHTML;
}

// Tải danh sách đơn hàng
function loadOrders() {
    // Hiển thị trạng thái đang tải
    showLoadingState();
    
    // Lấy thông tin người dùng
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    
    // Lấy danh sách đơn hàng từ localStorage
    let orders = [];
    try {
        const ordersString = localStorage.getItem('orders');
        if (ordersString) {
            orders = JSON.parse(ordersString);
            console.log(`Đã tìm thấy ${orders.length} đơn hàng trong localStorage`);
        } else {
            console.log("Không tìm thấy đơn hàng nào trong localStorage");
        }
    } catch (e) {
        console.error("Lỗi khi phân tích dữ liệu đơn hàng từ localStorage:", e);
        orders = [];
    }
    
    // Lọc đơn hàng theo email người dùng
    const userOrders = orders.filter(order => order.userEmail === userEmail);
    console.log(`Người dùng ${userEmail} có ${userOrders.length} đơn hàng`);
    
    // Phân loại đơn hàng theo trạng thái
    const ordersByStatus = {
        all: userOrders,
        pending: userOrders.filter(order => order.status === 'pending'),
        processing: userOrders.filter(order => order.status === 'processing'),
        shipping: userOrders.filter(order => order.status === 'shipping'),
        completed: userOrders.filter(order => order.status === 'completed'),
        cancelled: userOrders.filter(order => order.status === 'cancelled')
    };
    
    // Hiển thị đơn hàng theo từng tab
    Object.keys(ordersByStatus).forEach(status => {
        const container = document.getElementById(`${status}-orders`);
        if (container) {
            if (ordersByStatus[status].length > 0) {
                container.innerHTML = ordersByStatus[status].map(order => createOrderCardHTML(order)).join('');
            } else {
                container.innerHTML = createEmptyStateHTML(status);
            }
        }
    });
    
    // Thiết lập sự kiện cho các nút xem chi tiết
    setupOrderDetailButtons();
    
    // Hiển thị thông báo nếu không có đơn hàng nào
    if (userOrders.length === 0) {
        showToast('Bạn chưa có đơn hàng nào. Hãy mua sắm để tạo đơn hàng đầu tiên!', 'info');
    }
}

// Hiển thị trạng thái đang tải
function showLoadingState() {
    const containers = ['all', 'pending', 'processing', 'shipping', 'completed', 'cancelled'];
    containers.forEach(status => {
        const container = document.getElementById(`${status}-orders`);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="mt-3 text-muted">Đang tải đơn hàng...</p>
                </div>
            `;
        }
    });
}

// Tạo HTML cho thẻ đơn hàng
function createOrderCardHTML(order) {
    // Định dạng ngày
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    // Tính tổng số sản phẩm
    const totalItems = order.items.reduce((total, item) => total + item.quantity, 0);
    
    // Tạo HTML cho ảnh sản phẩm
    const itemsPreviewHTML = order.items.length > 0 
        ? order.items.slice(0, 3).map(item => `
            <img src="${item.image}" alt="${item.name}" class="order-item-preview-image">
        `).join('') + (order.items.length > 3 ? `<span class="more-items-count">+${order.items.length - 3}</span>` : '')
        : '<span class="no-items-preview">Không có sản phẩm</span>';
    
    // Tạo HTML cho trạng thái đơn hàng
    const statusHTML = createOrderStatusHTML(order.status);
    
    return `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div class="order-number">Đơn hàng #${order.id}</div>
                <div class="order-date">Đặt ngày: ${formattedDate}</div>
            </div>
            <div class="order-body">
                <div class="order-items-preview">
                    ${itemsPreviewHTML}
                </div>
                <div class="order-summary">
                    <div class="order-total">${formatCurrency(order.total)}</div>
                    <div class="order-status ${order.status}">${getStatusLabel(order.status)}</div>
                </div>
            </div>
            <div class="order-footer">
                <div class="order-actions">
                    <button class="btn btn-details view-order-details" data-order-id="${order.id}">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-cancel cancel-order" data-order-id="${order.id}">
                            <i class="fas fa-times"></i> Hủy đơn hàng
                        </button>
                    ` : ''}
                    ${order.status === 'completed' ? `
                        <button class="btn btn-reorder reorder-items" data-order-id="${order.id}">
                            <i class="fas fa-redo"></i> Đặt lại
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Tạo HTML cho trạng thái trống
function createEmptyStateHTML(status) {
    const statusLabels = {
        all: 'bất kỳ',
        pending: 'chờ xác nhận',
        processing: 'đang xử lý',
        shipping: 'đang giao',
        completed: 'đã giao',
        cancelled: 'đã hủy'
    };
    
    return `
        <div class="empty-state">
            <i class="fas fa-box-open empty-state-icon"></i>
            <p class="empty-state-text">Bạn chưa có đơn hàng ${statusLabels[status]} nào</p>
            <a href="../index.html#featured-products" class="btn-shop-now">
                <i class="fas fa-shopping-bag"></i> Mua sắm ngay
            </a>
        </div>
    `;
}

// Tạo HTML cho trạng thái đơn hàng
function createOrderStatusHTML(status) {
    const statuses = [
        { id: 'pending', label: 'Chờ xác nhận', icon: 'fa-clock' },
        { id: 'processing', label: 'Đang xử lý', icon: 'fa-cog' },
        { id: 'shipping', label: 'Đang giao', icon: 'fa-truck' },
        { id: 'completed', label: 'Đã giao', icon: 'fa-check-circle' },
        { id: 'cancelled', label: 'Đã hủy', icon: 'fa-times-circle' }
    ];
    
    // Xác định vị trí hiện tại trong timeline
    let currentIndex = statuses.findIndex(s => s.id === status);
    if (currentIndex === -1) currentIndex = 0;
    
    // Tạo HTML cho timeline
    let timelineHTML = '<div class="tracking-steps">';
    
    statuses.forEach((s, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isCancelled = status === 'cancelled' && index === currentIndex;
        
        timelineHTML += `
            <div class="tracking-step">
                <div class="tracking-icon ${isActive ? 'active' : ''} ${isCancelled ? 'cancelled' : ''}">
                    <i class="fas ${s.icon}"></i>
                </div>
                <div class="tracking-label ${isActive ? 'active' : ''} ${isCancelled ? 'cancelled' : ''}">
                    ${s.label}
                </div>
            </div>
        `;
    });
    
    timelineHTML += '</div>';
    
    // Thêm thanh tiến trình
    if (status !== 'cancelled') {
        const progressPercent = (currentIndex / (statuses.length - 1)) * 100;
        timelineHTML += `
            <div class="tracking-progress">
                <div class="tracking-progress-bar" style="width: ${progressPercent}%"></div>
            </div>
        `;
    }
    
    return timelineHTML;
}

// Thiết lập sự kiện cho các nút xem chi tiết
function setupOrderDetailButtons() {
    // Nút xem chi tiết
    document.querySelectorAll('.view-order-details').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            showOrderDetails(orderId);
        });
    });
    
    // Nút hủy đơn hàng
    document.querySelectorAll('.cancel-order').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                cancelOrder(orderId);
            }
        });
    });
    
    // Nút đặt lại
    document.querySelectorAll('.reorder-items').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            reorderItems(orderId);
        });
    });
}

// Hiển thị chi tiết đơn hàng
function showOrderDetails(orderId) {
    // Lấy thông tin đơn hàng từ localStorage
    let orders = [];
    try {
        const ordersString = localStorage.getItem('orders');
        if (ordersString) {
            orders = JSON.parse(ordersString);
        }
    } catch (e) {
        console.error("Lỗi khi phân tích dữ liệu đơn hàng từ localStorage:", e);
        orders = [];
    }
    
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showToast('Không tìm thấy thông tin đơn hàng', 'error');
        return;
    }
    
    // Định dạng ngày
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    // Cập nhật thông tin đơn hàng trong modal
    document.getElementById('modal-order-number').textContent = `Đơn hàng #${order.id}`;
    document.getElementById('modal-order-date').textContent = `Đặt ngày: ${formattedDate}`;
    document.getElementById('modal-order-status').textContent = getStatusLabel(order.status);
    document.getElementById('modal-order-status').className = `order-status ${order.status}`;
    
    // Cập nhật thông tin giao hàng
    document.getElementById('modal-shipping-name').textContent = order.shipping.name;
    document.getElementById('modal-shipping-phone').textContent = order.shipping.phone;
    document.getElementById('modal-shipping-address').textContent = order.shipping.address;
    document.getElementById('modal-shipping-note').textContent = order.shipping.note || 'Không có';
    
    // Cập nhật danh sách sản phẩm
    document.getElementById('modal-order-items').innerHTML = createOrderDetailItemsHTML(order.items);
    
    // Cập nhật tổng tiền
    document.getElementById('modal-subtotal').textContent = formatCurrency(order.subtotal);
    document.getElementById('modal-shipping-fee').textContent = formatCurrency(order.shippingFee);
    document.getElementById('modal-discount').textContent = formatCurrency(-order.discount);
    document.getElementById('modal-total').textContent = formatCurrency(order.total);
    
    // Cập nhật trạng thái đơn hàng
    document.getElementById('modal-tracking-steps').innerHTML = createOrderStatusHTML(order.status);
    
    // Hiển thị/ẩn nút hủy đơn hàng và đặt lại
    const cancelButton = document.getElementById('modal-cancel-order');
    const reorderButton = document.getElementById('modal-reorder');
    
    if (order.status === 'pending') {
        cancelButton.style.display = 'block';
        reorderButton.style.display = 'none';
    } else if (order.status === 'completed') {
        cancelButton.style.display = 'none';
        reorderButton.style.display = 'block';
    } else {
        cancelButton.style.display = 'none';
        reorderButton.style.display = 'none';
    }
    
    // Lưu ID đơn hàng hiện tại
    cancelButton.setAttribute('data-order-id', order.id);
    reorderButton.setAttribute('data-order-id', order.id);
    
    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}

// Tạo HTML cho danh sách sản phẩm trong chi tiết đơn hàng
function createOrderDetailItemsHTML(items) {
    if (!items || items.length === 0) {
        return '<p class="text-muted">Không có sản phẩm nào</p>';
    }
    
    return items.map(item => `
        <div class="order-details-item">
            <div class="order-details-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="order-details-item-details">
                <div class="order-details-item-name">${item.name}</div>
                <div class="order-details-item-price">${formatCurrency(item.price)}</div>
                <div class="order-details-item-quantity">Số lượng: ${item.quantity}</div>
            </div>
            <div class="order-details-item-total">
                ${formatCurrency(item.price * item.quantity)}
            </div>
        </div>
    `).join('');
}

// Hủy đơn hàng
function cancelOrder(orderId) {
    // Lấy danh sách đơn hàng từ localStorage
    let orders = [];
    try {
        const ordersString = localStorage.getItem('orders');
        if (ordersString) {
            orders = JSON.parse(ordersString);
        }
    } catch (e) {
        console.error("Lỗi khi phân tích dữ liệu đơn hàng từ localStorage:", e);
        orders = [];
    }
    
    // Tìm và cập nhật trạng thái đơn hàng
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'cancelled';
        
        // Lưu lại vào localStorage
        localStorage.setItem('orders', JSON.stringify(orders));
        
        showToast('Đơn hàng đã được hủy thành công', 'success');
        
        // Cập nhật lại danh sách đơn hàng
        loadOrders();
        
        // Đóng modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
        if (modal) {
            modal.hide();
        }
    } else {
        showToast('Không tìm thấy đơn hàng để hủy', 'error');
    }
}

// Đặt lại đơn hàng
function reorderItems(orderId) {
    // Lấy danh sách đơn hàng từ localStorage
    let orders = [];
    try {
        const ordersString = localStorage.getItem('orders');
        if (ordersString) {
            orders = JSON.parse(ordersString);
        }
    } catch (e) {
        console.error("Lỗi khi phân tích dữ liệu đơn hàng từ localStorage:", e);
        orders = [];
    }
    
    // Tìm đơn hàng
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showToast('Không tìm thấy thông tin đơn hàng', 'error');
        return;
    }
    
    // Lấy giỏ hàng hiện tại
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Thêm sản phẩm từ đơn hàng vào giỏ hàng
    order.items.forEach(item => {
        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
        
        if (existingItemIndex !== -1) {
            // Nếu đã có, tăng số lượng
            cart[existingItemIndex].quantity += item.quantity;
        } else {
            // Nếu chưa có, thêm mới
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            });
        }
    });
    
    // Lưu giỏ hàng mới vào localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Cập nhật số lượng sản phẩm trong giỏ hàng
    updateCartCount();
    
    showToast('Đã thêm sản phẩm vào giỏ hàng', 'success');
    
    // Đóng modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    if (modal) {
        modal.hide();
    }
    
    // Chuyển hướng đến trang giỏ hàng
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1500);
}

// Hiển thị thông báo
function showToast(message, type = 'info') {
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-top-right',
        timeOut: 3000
    };
    
    switch (type) {
        case 'success':
            toastr.success(message);
            break;
        case 'error':
            toastr.error(message);
            break;
        case 'warning':
            toastr.warning(message);
            break;
        default:
            toastr.info(message);
    }
}

// Định dạng tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Lấy nhãn trạng thái đơn hàng
function getStatusLabel(status) {
    const statusLabels = {
        pending: 'Chờ xác nhận',
        processing: 'Đang xử lý',
        shipping: 'Đang giao',
        completed: 'Đã giao',
        cancelled: 'Đã hủy'
    };
    
    return statusLabels[status] || 'Không xác định';
}

// Tạo đơn hàng mẫu nếu không có đơn hàng nào
function createSampleOrders() {
    // Không tạo đơn hàng mẫu nữa
    console.log("Không tạo đơn hàng mẫu, chỉ hiển thị đơn hàng thực tế");
    return;
} 