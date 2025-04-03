// Kiểm tra trạng thái đăng nhập
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    const loginNavItem = document.getElementById('login-nav-item');
    const userNavItem = document.getElementById('user-nav-item');
    const userNameElement = document.getElementById('user-name');

    if (isLoggedIn && userName) {
        loginNavItem.style.display = 'none';
        userNavItem.style.display = 'block';
        userNameElement.textContent = userName;
    } else {
        loginNavItem.style.display = 'block';
        userNavItem.style.display = 'none';
        // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
        window.location.href = 'login.html';
    }
}

// Đăng xuất
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
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

// Load orders
function loadOrders() {
    const ordersContainer = document.getElementById('orders-container');
    
    // Lấy danh sách đơn hàng từ localStorage
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Nếu không có đơn hàng nào, hiển thị thông báo
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-box-open"></i>
                <h3>Bạn chưa có đơn hàng nào</h3>
                <p>Hãy mua sắm và tạo đơn hàng đầu tiên của bạn</p>
                <a href="../index.html" class="btn btn-shopping">Mua sắm ngay</a>
            </div>
        `;
        return;
    }
    
    // Sắp xếp đơn hàng theo thời gian mới nhất
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Hiển thị danh sách đơn hàng
    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Đơn hàng #${order.id}</div>
                    <div class="order-date">${formatDate(order.date)}</div>
                </div>
                <div class="order-status ${getStatusClass(order.status)}">
                    ${getStatusText(order.status)}
                </div>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.name}" class="order-item-image">
                        <div class="order-item-details">
                            <div class="order-item-name">${item.name}</div>
                            <div class="order-item-price">${formatPrice(item.price)}</div>
                            <div class="order-item-quantity">Số lượng: ${item.quantity}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-summary">
                <div>Tổng tiền:</div>
                <div class="order-total">${formatPrice(order.total)}</div>
            </div>
            ${generateTimeline(order)}
            <div class="order-actions">
                <button class="btn btn-order-detail" onclick="viewOrderDetail('${order.id}')">
                    <i class="fas fa-eye"></i> Xem chi tiết
                </button>
            </div>
        </div>
    `).join('');
}

// Xem chi tiết đơn hàng
function viewOrderDetail(orderId) {
    // Lấy thông tin đơn hàng từ localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        // Hiển thị thông tin chi tiết đơn hàng
        alert(`Chi tiết đơn hàng #${orderId}\n\n` +
              `Ngày đặt: ${formatDate(order.date)}\n` +
              `Trạng thái: ${getStatusText(order.status)}\n` +
              `Tổng tiền: ${formatPrice(order.total)}\n\n` +
              `Địa chỉ giao hàng: ${order.shippingAddress || 'Chưa có thông tin'}\n` +
              `Phương thức thanh toán: ${order.paymentMethod || 'Chưa có thông tin'}`);
    }
}

// Kiểm tra trạng thái đăng nhập khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadOrders();
}); 