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
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Kiểm tra thông tin đăng nhập
    if (!email || !password) {
        toastr.error('Vui lòng nhập đầy đủ thông tin đăng nhập');
        return;
    }
    
    // Hiển thị thông báo đăng nhập thành công và chuyển hướng
    // Trong thực tế, bạn cần kết nối với backend để xác thực thông tin đăng nhập
    toastr.success('Đăng nhập thành công!', 'Thành công', {
        timeOut: 1500,
        onHidden: function() {
            // Lưu trạng thái đăng nhập nếu người dùng chọn "Ghi nhớ đăng nhập"
            if (rememberMe) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
            } else {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userEmail', email);
            }
            
            // Chuyển hướng về trang chủ
            window.location.href = '../index.html';
        }
    });
    
    return false;
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