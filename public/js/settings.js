// Remove sessionStorage dependency and replace with localStorage fallback or mock
function getToken() {
  try {
    const token = sessionStorage.getItem('supabase_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  } catch (error) {
    console.error('Authentication error:', error);
    window.location.href = '401.html';
    return null;
  }
}

function getUserData(key) {
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
  } catch (error) {
    console.warn('Storage not available for key:', key);
    return null;
  }
}

function setUserData(key, value) {
  try {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Could not store data for key:', key);
  }
}

// Notification Functions
function showError(message, duration = 4000) {
  const container = document.getElementById("errorContainer");
  const msg = document.getElementById("errorMessage");
  if (container && msg) {
    msg.textContent = message;
    container.classList.remove("hidden");
    setTimeout(() => container.classList.add("hidden"), duration);
  } else {
    console.error('Error notification elements not found:', message);
  }
}

function showSuccess(message, duration = 4000) {
  const container = document.getElementById("successContainer");
  const msg = document.getElementById("successMessage");
  if (container && msg) {
    msg.textContent = message;
    container.classList.remove("hidden");
    setTimeout(() => container.classList.add("hidden"), duration);
  } else {
    console.log('Success:', message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize form elements
  const oldPasswordInput = document.getElementById("oldPassword");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const accountForm = document.getElementById("accountForm");

  const requirements = {
    length: document.getElementById("req-length"),
    uppercase: document.getElementById("req-uppercase"),
    number: document.getElementById("req-number"),
    special: document.getElementById("req-special"),
  };

  // Load user data from storage
  loadUserInfo();

  // Initialize all functionality
  initializePasswordValidation();
  initializeFormHandlers();

  function loadUserInfo() {
    try {
      const name = getUserData('user_name');
      const email = getUserData('user_email');

      if (!name || !email) {
        showError('User information not found. Please log in again.');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
      }

      const usernameField = document.getElementById("username");
      const emailField = document.getElementById("email");

      if (usernameField) {
        usernameField.value = name;
      }
      
      if (emailField) {
        emailField.value = email;
      }

      console.log('User info loaded:', { name, email });
    } catch (error) {
      console.error('Error loading user info:', error);
      showError('Error loading user information');
    }
  }

  function initializePasswordValidation() {
    if (!passwordInput || !requirements.length) {
      console.warn('Password validation elements not found');
      return;
    }

    function resetPasswordValidationUI() {
      Object.values(requirements).forEach(req => {
        if (req) {
          req.classList.remove("text-green-600");
          req.classList.add("text-red-500");
          // Add icons for better visual feedback
          if (!req.querySelector('.requirement-icon')) {
            const icon = document.createElement('span');
            icon.className = 'requirement-icon text-red-500 mr-2';
            icon.innerHTML = '✗';
            req.insertBefore(icon, req.firstChild);
          }
        }
      });
    }

    function checkPasswordStrength(password) {
      let valid = true;
      const checks = [
        {
          test: password.length >= 8,
          element: requirements.length,
          message: 'At least 8 characters'
        },
        {
          test: /[A-Z]/.test(password),
          element: requirements.uppercase,
          message: 'At least 1 uppercase letter'
        },
        {
          test: /\d/.test(password),
          element: requirements.number,
          message: 'At least 1 number'
        },
        {
          test: /[!@#$%^&*]/.test(password),
          element: requirements.special,
          message: 'At least 1 special character (!@#$%^&*)'
        }
      ];

      checks.forEach(check => {
        if (check.element) {
          const icon = check.element.querySelector('.requirement-icon');
          if (check.test) {
            check.element.classList.replace("text-red-500", "text-green-600");
            if (icon) {
              icon.textContent = '✓';
              icon.className = 'requirement-icon text-green-600 mr-2';
            }
          } else {
            check.element.classList.replace("text-green-600", "text-red-500");
            if (icon) {
              icon.textContent = '✗';
              icon.className = 'requirement-icon text-red-500 mr-2';
            }
            valid = false;
          }
        }
      });

      // Update password field styling based on strength
      if (password.length > 0) {
        if (valid) {
          passwordInput.classList.remove('border-red-300');
          passwordInput.classList.add('border-green-300', 'bg-green-50');
        } else {
          passwordInput.classList.remove('border-green-300', 'bg-green-50');
          passwordInput.classList.add('border-red-300');
        }
      } else {
        passwordInput.classList.remove('border-red-300', 'border-green-300', 'bg-green-50');
      }

      return valid;
    }

    // Initialize validation UI
    resetPasswordValidationUI();

    // Add event listener for password input
    passwordInput.addEventListener("input", () => checkPasswordStrength(passwordInput.value));

    // Add event listener for confirm password
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener("input", () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length > 0) {
          if (password === confirmPassword) {
            confirmPasswordInput.classList.remove('border-red-300');
            confirmPasswordInput.classList.add('border-green-300', 'bg-green-50');
          } else {
            confirmPasswordInput.classList.remove('border-green-300', 'bg-green-50');
            confirmPasswordInput.classList.add('border-red-300');
          }
        } else {
          confirmPasswordInput.classList.remove('border-red-300', 'border-green-300', 'bg-green-50');
        }
      });
    }

    return { resetPasswordValidationUI, checkPasswordStrength };
  }

  function initializeFormHandlers() {
    if (!accountForm) {
      console.warn('Account form not found');
      return;
    }

    const { resetPasswordValidationUI, checkPasswordStrength } = initializePasswordValidation();

    accountForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const submitBtn = accountForm.querySelector('button[type="submit"]');
      const oldPassword = oldPasswordInput?.value?.trim() || '';
      const newPassword = passwordInput?.value?.trim() || '';
      const confirmedPassword = confirmPasswordInput?.value?.trim() || '';
      
      // Hide previous messages
      hideMessages();

      if (!oldPassword) {
        showError('Please enter your current password');
        return;
      }

      if (!newPassword) {
        showError('Please enter a new password');
        return;
      }

      if (!checkPasswordStrength(newPassword)) {
        showError('Your password does not meet the requirements');
        return;
      }

      if (newPassword !== confirmedPassword) {
        showError('The passwords do not match');
        return;
      }

      // Disable submit button and show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="w-4 h-4 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v6m0 0l4-4m-4 4L8 4"></path>
          </svg>
          Updating Password...
        `;
      }

      try {
        const token = getToken();
        const res = await fetch("http://localhost:5000/api/profile/change-password", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ oldPassword, newPassword })
        });

        if (res.status === 401) {
          window.location.href = "401.html";
          return;
        }
        if (res.status === 403) {
          window.location.href = "403.html";
          return;
        }
        if (res.status === 404) {
          window.location.href = "404.html";
          return;
        }

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || 'Failed to update password';
          
          // Highlight old password field if it's incorrect
          if (res.status === 401 && oldPasswordInput) {
            oldPasswordInput.classList.add('border-red-500', 'bg-red-50');
            oldPasswordInput.focus();
          }
          
          throw new Error(errorMessage);
        }

        // Success
        showSuccess('Password updated successfully!');
        showInlineMessage('profileSuccessMsg', 'Password updated successfully!', 'success');
        
        // Clear form and reset UI
        if (oldPasswordInput) oldPasswordInput.value = "";
        if (passwordInput) passwordInput.value = "";
        if (confirmPasswordInput) confirmPasswordInput.value = "";
        resetPasswordValidationUI();
        
        // Remove field styling
        [oldPasswordInput, passwordInput, confirmPasswordInput].forEach(field => {
          if (field) {
            field.classList.remove('border-red-300', 'border-green-300', 'bg-green-50', 'border-red-500', 'bg-red-50');
          }
        });

      } catch (err) {
        console.error("Password update error:", err);
        showError(err.message);
        showInlineMessage('profileMsg', err.message, 'error');
      } finally {
        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Update Account';
        }
      }
    });
  }

  function hideMessages() {
    ['profileMsg', 'profileSuccessMsg'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  function showInlineMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.classList.remove('hidden');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        el.classList.add('hidden');
      }, 5000);
    }
  }


  console.log('Settings page initialized');
});