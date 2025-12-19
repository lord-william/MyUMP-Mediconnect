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
  // Update navbar
  document.getElementById('userName').textContent = fullName;
}
loadStaffProfile();
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
  if (!sessionStorage.getItem('supabase_token')) {
  window.location.replace('landing.html');
}


document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();

  // 1️⃣ Clear all session/local storage
  sessionStorage.clear();
  localStorage.clear();

  // 2️⃣ Redirect using location.replace instead of href
  //    This prevents the back button from going to the previous page
  window.location.replace("landing.html");
});
// Fetch count of low stock items (quantity <= stock_limit)
  async function fetchLowStockCount() {
    try {
      const response = await fetch('http://localhost:5000/clinic/low',{
        method: 'GET',
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem('supabase_token')}`
         }
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

      const results = await response.json();
      const data = results.low;


      // Filter low stock client-side
      const lowStockItems = data.filter(item => item.quantity <= item.stock_limit);

      // Update count in DOM
      const countElem = document.getElementById('lowStockCount');
      if (countElem) {
        countElem.textContent = lowStockItems.length;
      }
    } catch (err) {
      showError('Unexpected error fetching low stock:', err);
    }
  }

  // Redirect to full low stock list page on button click
  document.addEventListener('DOMContentLoaded', () => {
    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        window.location.href = 'low-stock.html'; // Update this path as needed
      });
    }

    // Initial fetch of low stock count
    fetchLowStockCount();
  });


  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  // Profile dropdown toggle
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
  });

  // Close dropdown on outside click
  window.addEventListener('click', () => {
    if (!profileDropdown.classList.contains('hidden')) {
      profileDropdown.classList.add('hidden');
    }
  });

  // Modal open/close helpers
  function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
  }
  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  }

  // Tab switching for appointments modal
  function switchAppointmentTab(tabName, event) {
    document.querySelectorAll('#appointmentsModal .tab-content').forEach(tab => {
      tab.classList.add('hidden');
    });
    document.getElementById(`appointments-${tabName}`).classList.remove('hidden');

    // Reset tab button styles
    document.querySelectorAll('#appointmentsModal .tab-btn').forEach(btn => {
      btn.classList.remove('border-yellow-400', 'text-navy-900');
      btn.classList.add('text-gray-600', 'hover:text-navy-900');
    });

    // Highlight active tab button
    event.currentTarget.classList.add('border-yellow-400', 'text-navy-900');
    event.currentTarget.classList.remove('text-gray-600', 'hover:text-navy-900');
  }

