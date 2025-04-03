// Kiểm tra trạng thái đăng nhập
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        // Nếu đã đăng nhập, chuyển hướng về trang chủ
        window.location.href = '../index.html';
    }
}

// Xử lý đăng nhập
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Kiểm tra thông tin đăng nhập
    if (!username || !password) {
        toastr.error('Vui lòng nhập đầy đủ thông tin đăng nhập');
        return;
    }
    
    // Lấy danh sách người dùng từ localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Tìm người dùng
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Đăng nhập thành công
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', user.username);
        
        toastr.success('Đăng nhập thành công!');
        
        // Chuyển hướng về trang chủ sau 1 giây
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000);
    } else {
        // Đăng nhập thất bại
        toastr.error('Tên đăng nhập hoặc mật khẩu không đúng');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    
    // Cấu hình toastr
    toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: 3000
    };
}); 