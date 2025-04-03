// Function to handle form submission
function handleSubmit(event) {
    event.preventDefault();
    
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(elem => {
        elem.style.display = 'none';
    });

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let isValid = true;

    // Validate full name
    if (fullName.length < 2) {
        document.getElementById('fullNameError').textContent = 'Họ tên phải có ít nhất 2 ký tự';
        document.getElementById('fullNameError').style.display = 'block';
        isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Vui lòng nhập địa chỉ email hợp lệ';
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
    }

    // Validate password
    if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Mật khẩu xác nhận không khớp';
        document.getElementById('confirmPasswordError').style.display = 'block';
        isValid = false;
    }

    if (isValid) {
        // Show loading state
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Đang xử lý...';
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            // Lưu thông tin người dùng vào localStorage
            localStorage.setItem('userName', fullName);
            localStorage.setItem('userEmail', email);
            
            // Show success message
            submitBtn.innerHTML = 'Đăng ký thành công!';
            submitBtn.classList.add('btn-success');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }, 1500);
    }

    return false;
}

// Real-time password matching validation
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('confirmPassword').addEventListener('input', function() {
        const password = document.getElementById('password').value;
        const confirmPasswordError = document.getElementById('confirmPasswordError');
        
        if (this.value !== password) {
            confirmPasswordError.textContent = 'Mật khẩu xác nhận không khớp';
            confirmPasswordError.style.display = 'block';
        } else {
            confirmPasswordError.style.display = 'none';
        }
    });
}); 