// Authentication
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

// Notification Functions
function showError(message, duration = 4000) {
  const container = document.getElementById("errorContainer");
  const msg = document.getElementById("errorMessage");
  if (container && msg) {
    msg.textContent = message;
    container.classList.remove("hidden");
    setTimeout(() => container.classList.add("hidden"), duration);
  } else {
    console.error('Error:', message);
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

// Toggle password visibility
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.type = field.type === 'password' ? 'text' : 'password';
  }
}

// Password strength validation
function validatePasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password)
  };
  
  // Update UI for each check
  updateCheckmark('lengthCheck', checks.length);
  updateCheckmark('uppercaseCheck', checks.uppercase);
  updateCheckmark('lowercaseCheck', checks.lowercase);
  updateCheckmark('numberCheck', checks.number);
  
  // Calculate strength
  const passedChecks = Object.values(checks).filter(Boolean).length;
  let strength = 0;
  let strengthText = '';
  let strengthColor = '';
  
  if (passedChecks === 0) {
    strength = 0;
    strengthText = '-';
    strengthColor = 'bg-gray-300';
  } else if (passedChecks === 1) {
    strength = 25;
    strengthText = 'Weak';
    strengthColor = 'bg-red-500';
  } else if (passedChecks === 2) {
    strength = 50;
    strengthText = 'Fair';
    strengthColor = 'bg-orange-500';
  } else if (passedChecks === 3) {
    strength = 75;
    strengthText = 'Good';
    strengthColor = 'bg-yellow-500';
  } else if (passedChecks === 4) {
    strength = 100;
    strengthText = 'Strong';
    strengthColor = 'bg-green-500';
  }
  
  // Update strength bar
  const strengthBar = document.getElementById('strengthBar');
  const strengthTextEl = document.getElementById('strengthText');
  
  if (strengthBar) {
    strengthBar.style.width = `${strength}%`;
    strengthBar.className = `h-2 rounded-full transition-all duration-300 ${strengthColor}`;
  }
  
  if (strengthTextEl) {
    strengthTextEl.textContent = strengthText;
    strengthTextEl.className = `text-xs font-medium ${strengthColor.replace('bg-', 'text-')}`;
  }
  
  return checks;
}

function updateCheckmark(elementId, isValid) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const svg = element.querySelector('svg');
  const span = element.querySelector('span');
  
  if (isValid) {
    svg.classList.remove('text-gray-400');
    svg.classList.add('text-green-500');
    svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
    span.classList.add('text-green-600');
  } else {
    svg.classList.remove('text-green-500');
    svg.classList.add('text-gray-400');
    svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
    span.classList.remove('text-green-600');
  }
}

// Decode JWT token to get user email
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Load staff profile information (same as student profile)
function loadStaffProfile() {
  try {
    console.log('Loading staff profile...');
    
    // Load user data from storage (same as student profile)
    const name = sessionStorage.getItem('user_name') || sessionStorage.getItem('name') || localStorage.getItem('name');
    const email = sessionStorage.getItem('user_email') || sessionStorage.getItem('email') || localStorage.getItem('email');

    if (!name && !email) {
      showError('User information not found. Please log in again.');
      setTimeout(() => window.location.href = 'landing.html', 2000);
      return;
    }

    // Update profile display
    updateProfileDisplay({
      name: name || 'Staff Member',
      email: email || 'Not available'
    });
    
    console.log('✓ Staff profile loaded from storage');

  } catch (error) {
    console.error('Error loading staff profile:', error);
    showError('Failed to load profile information. Please log in again.');
    setTimeout(() => window.location.href = 'landing.html', 2000);
  }
}

// Helper function to update profile display
function updateProfileDisplay(userData) {
  const fullName = userData.name || userData.full_name || userData.username || 'Clinic Staff';
  const email = userData.email || 'staff@mediconnect.com';
  
  document.getElementById('profileName').textContent = fullName;
  document.getElementById('profileEmail').textContent = email;
  document.getElementById('fullName').value = fullName;
  document.getElementById('email').value = email;
  
  // Update initials
  const initials = getInitials(fullName);
  document.getElementById('profileInitials').textContent = initials;
  
  // Update navbar
  document.getElementById('userName').textContent = fullName;
  document.getElementById('profileBtn').textContent = initials;
}

// Get initials from name
function getInitials(name) {
  if (!name) return 'CS';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Change password using the same API as student profile
async function changePassword(oldPassword, newPassword) {
  try {
    console.log('Changing password...');
    const token = getToken();
    
    const response = await fetch('http://localhost:5000/api/profile/change-password', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword,
        newPassword
      })
    });

    if (response.status === 401) {
      window.location.href = "401.html";
      return;
    }
    if (response.status === 403) {
      window.location.href = "403.html";
      return;
    }
    if (response.status === 404) {
      window.location.href = "404.html";
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || 'Failed to update password';
      
      // Highlight current password field if it's incorrect
      if (response.status === 401) {
        const currentPasswordInput = document.getElementById('currentPassword');
        if (currentPasswordInput) {
          currentPasswordInput.classList.add('border-red-500', 'bg-red-50');
          currentPasswordInput.focus();
        }
      }
      
      throw new Error(errorMessage);
    }

    // Success
    showSuccess('Password changed successfully! Please login again with your new password.');
    
    // Reset form
    resetForm();
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = 'landing.html';
    }, 3000);

  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
}

// Reset form
function resetForm() {
  const form = document.getElementById('changePasswordForm');
  if (form) {
    form.reset();
  }
}

// Form submission handler
document.addEventListener('DOMContentLoaded', function() {
  console.log('Staff profile page initialized');
  
  // Load profile information
  loadStaffProfile();
  
  // Profile dropdown functionality
  const profileBtn = document.getElementById("profileBtn");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
        profileDropdown.classList.add("hidden");
      }
    });
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (error) {
        console.warn('Storage clearing failed:', error);
      }
      window.location.replace("landing.html");
    });
  }

  // Password change form
  const form = document.getElementById('changePasswordForm');
  const submitBtn = document.getElementById('submitBtn');
  const newPasswordInput = document.getElementById('newPassword');
  
  // Add real-time password validation
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', (e) => {
      validatePasswordStrength(e.target.value);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentPasswordInput = document.getElementById('currentPassword');
      const newPasswordInput = document.getElementById('newPassword');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      
      const oldPassword = currentPasswordInput.value.trim();
      const newPassword = newPasswordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();
      
      // Clear previous error styling
      [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
        if (input) {
          input.classList.remove('border-red-500', 'bg-red-50');
        }
      });

      // Validation
      if (!oldPassword || !newPassword || !confirmPassword) {
        showError('Please fill in all password fields.');
        return;
      }

      // Validate password strength
      const checks = validatePasswordStrength(newPassword);
      if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number) {
        showError('Password must meet all requirements: 8+ characters, uppercase, lowercase, and number.');
        if (newPasswordInput) {
          newPasswordInput.classList.add('border-red-500', 'bg-red-50');
          newPasswordInput.focus();
        }
        return;
      }

      if (newPassword !== confirmPassword) {
        showError('New passwords do not match.');
        if (confirmPasswordInput) {
          confirmPasswordInput.classList.add('border-red-500', 'bg-red-50');
          confirmPasswordInput.focus();
        }
        return;
      }

      if (oldPassword === newPassword) {
        showError('New password must be different from current password.');
        if (newPasswordInput) {
          newPasswordInput.classList.add('border-red-500', 'bg-red-50');
          newPasswordInput.focus();
        }
        return;
      }

      // Disable submit button
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="w-5 h-5 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Updating...
        `;
      }

      try {
        await changePassword(oldPassword, newPassword);
      } catch (error) {
        showError(error.message || 'Failed to change password. Please check your current password and try again.');
      } finally {
        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Update Password
          `;
        }
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Escape to clear form
    if (e.key === 'Escape') {
      resetForm();
    }
  });
});

// Make functions globally available
window.togglePassword = togglePassword;
window.resetForm = resetForm;
