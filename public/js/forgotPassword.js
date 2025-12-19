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

document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const successMessage = document.getElementById('successMessage');
    const form = this;
    sessionStorage.setItem('resetEmail', email);
    
    if (email) {
        try {
            const res = await fetch('http://localhost:5000/user/forgotPassword', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email }) 
            });

            if (!res.ok) {
                const errorData = await res.json();
                showError("Error: " + (errorData.error || "Failed to send reset email"));
                return;
            }
        } catch (err) {
            console.error(err);
            showError("Something went wrong, please try again later.");
            return;
        }

        // Hide form and show success message
        form.style.opacity = '0.5';
        form.style.pointerEvents = 'none';
        
        setTimeout(() => {
            successMessage.classList.remove('hidden');
            successMessage.style.animation = 'fadeInUp 0.5s ease-out';
        }, 300);
    }
});

// Email input focus effects
const emailInput = document.getElementById('email');
emailInput.addEventListener('focus', function() {
    this.parentElement.style.transform = 'scale(1.02)';
});

emailInput.addEventListener('blur', function() {
    this.parentElement.style.transform = 'scale(1)';
});
