//Notification Functions
function showError(message, duration = 4000) {
    const container = document.getElementById("errorContainer");
    const msg = document.getElementById("errorMessage");
    msg.textContent = message;
    container.classList.remove("hidden");
    setTimeout(() => container.classList.add("hidden"), duration);
  }

  function showSuccess(message, duration = 4000) {
    const container = document.getElementById("successContainer");
    const msg = document.getElementById("successMessage");
    msg.textContent = message;
    container.classList.remove("hidden");
    setTimeout(() => container.classList.add("hidden"), duration);
  }
function getUserEmailFromURL() {
            // In a real application, this would extract from URL parameters or token
            const urlParams = new URLSearchParams(window.location.search);
            const email = urlParams.get('email') || urlParams.get('user') || 'user@example.com';
            return email;
        }

        // Set user email on page load
        document.addEventListener('DOMContentLoaded', function() {
            const userEmail = getUserEmailFromURL();
            document.getElementById('userEmail').textContent = userEmail;
        });

        // Toggle password visibility
        function togglePassword(fieldId) {
            const field = document.getElementById(fieldId);
            const eye = document.getElementById(fieldId + 'Eye');
            
            if (field.type === 'password') {
                field.type = 'text';
                eye.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                `;
            } else {
                field.type = 'password';
                eye.innerHTML = `
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                `;
            }
        }

        // Check password strength
        function checkPasswordStrength() {
            const password = document.getElementById('newPassword').value;
            const strengthBar = document.getElementById('strengthBar');
            const strengthText = document.getElementById('strengthText');
            
            let strength = 0;
            const requirements = {
                length: password.length >= 8,
                upper: /[A-Z]/.test(password),
                lower: /[a-z]/.test(password),
                number: /\d/.test(password),
                special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
            };
            
            // Update requirement indicators
            Object.keys(requirements).forEach(req => {
                const element = document.getElementById(`req-${req}`);
                const span = element.querySelector('span');
                if (requirements[req]) {
                    span.innerHTML = '✓';
                    span.className = 'w-4 h-4 mr-2 text-green-600';
                    element.className = 'flex items-center text-green-600';
                    strength++;
                } else {
                    span.innerHTML = '•';
                    span.className = 'w-4 h-4 mr-2';
                    element.className = 'flex items-center';
                }
            });
            
            // Update strength bar
            const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
            const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
            
            strengthBar.className = `password-strength ${strengthColors[strength - 1] || 'bg-gray-200'}`;
            strengthBar.style.width = `${(strength / 5) * 100}%`;
            strengthText.textContent = strength > 0 ? strengthLabels[strength - 1] : 'Password strength';
            strengthText.className = `text-xs mt-1 ${strength > 2 ? 'text-green-600' : strength > 0 ? 'text-orange-600' : 'text-gray-500'}`;
        }

        // Check password match
        function checkPasswordMatch() {
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const matchText = document.getElementById('matchText');
            
            if (confirmPassword === '') {
                matchText.textContent = '';
                matchText.className = 'text-xs mt-1';
            } else if (newPassword === confirmPassword) {
                matchText.textContent = '✓ Passwords match';
                matchText.className = 'text-xs mt-1 text-green-600';
            } else {
                matchText.textContent = '✗ Passwords do not match';
                matchText.className = 'text-xs mt-1 text-red-600';
            }
        }

        // Form submission handler
      document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const successMessage = document.getElementById('successMessage');
    const form = this;

    if (newPassword !== confirmPassword) {
        showError('New passwords do not match!');
        return;
    }

    if (newPassword.length < 8) {
        showError('New password must be at least 8 characters long!');
        return;
    }

    // Extract token from URL (Supabase includes it in the reset link)
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const access_token = urlParams.get('access_token');

    if (!access_token) {
        showError("Reset token missing. Please try the reset link again.");
        return;
    }

    try {
        const res = await fetch('http://localhost:5000/user/resetPassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token, newPassword })
        });

        const data = await res.json();

        if (!res.ok) {
            showError("Error: " + (data.error || "Failed to reset password"));
            return;
        }

        // Success UI
        form.style.opacity = '0.5';
        form.style.pointerEvents = 'none';
        
        setTimeout(() => {
            successMessage.classList.remove('hidden');
            successMessage.style.animation = 'fadeInUp 0.5s ease-out';
        }, 300);

    } catch (err) {
        console.error(err);
        showError("Something went wrong, please try again later.");
    }
});

        // Input focus effects
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.style.transform = 'scale(1.01)';
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.style.transform = 'scale(1)';
            });
        });