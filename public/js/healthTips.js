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


// Load user data
document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();
  
  try {
    console.log('Loading user data...');
    // Call backend with JWT
    const results = await fetch('http://localhost:5000/student/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (results.status === 401) {
      window.location.href = "401.html";
      return;
    }
    if (results.status === 403) {
      window.location.href = "403.html";
      return;
    }
    if (results.status === 404) {
      window.location.href = "404.html";
      return;
    }

    if (!results.ok) {
      throw new Error("Failed to fetch user");
    }

    const data = await results.json();
    const fullName = data.name;
    const mail = data.email;

    try {
      localStorage.setItem('email', mail);
    } catch (storageError) {
      console.warn('localStorage not available:', storageError);
    }

    const userNameEl = document.getElementById("userName");
    if (userNameEl) {
      userNameEl.textContent = `${fullName}`;
    }

    console.log('User data loaded:', { name: fullName, email: mail });

  } catch (err) {
    console.error("Error loading user data:", err);
    showError("Failed to load user information. Please log in again.");
    setTimeout(() => window.location.href = 'login.html', 2000);
  }

  // Load tips after user data
  loadTips();
});

// Store all tips globally for filtering
let allTips = [];

async function loadTips() {
  const container = document.getElementById("tipsContainer");
  if (!container) {
    console.error('Tips container not found');
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading health tips...</span>
    </div>
  `;

  const token = getToken();
  
  try {
    console.log('Loading health tips...');
    const response = await fetch('http://localhost:5000/student/health/tips', {
      method: 'GET',
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
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
    const data = results.tips;

    console.log('Tips loaded from backend:', data);
    
    // Store all tips globally for filtering
    allTips = data || [];
    window.allTips = allTips;
    
    renderTips(allTips);

  } catch (error) {
    console.error("Error loading tips:", error);
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-red-500 mb-4">Failed to load health tips. Please try again later.</p>
        <button onclick="loadTips()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    `;
    showError("Failed to load health tips from server");
  }
}

function renderTips(data) {
  const container = document.getElementById("tipsContainer");
  if (!container) return;

  container.innerHTML = "";
  
  // Update the tip counter
  updateTipCounter(data ? data.length : 0);

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-600 mb-2">No Health Tips Found</h3>
        <p class="text-gray-500">Try adjusting your search or filter criteria.</p>
      </div>
    `;
    return;
  }

  // Sort tips by date (newest first)
  const sortedTips = [...data].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });

  // Create category color mapping
  const categoryColors = {
    'General Health': 'border-blue-500 bg-blue-50',
    'Nutrition': 'border-green-500 bg-green-50',
    'Fitness': 'border-orange-500 bg-orange-50',
    'Mental Health': 'border-purple-500 bg-purple-50',
    'Sleep': 'border-indigo-500 bg-indigo-50',
    'Study Tips': 'border-yellow-500 bg-yellow-50',
    'Prevention': 'border-red-500 bg-red-50',
    'Emergency': 'border-red-600 bg-red-50'
  };

  sortedTips.forEach((tip, index) => {
    const colorClass = categoryColors[tip.category] || 'border-gray-500 bg-gray-50';
    const createdDate = tip.date ? new Date(tip.date).toLocaleDateString() : '';
    
    const card = document.createElement("div");
    card.className = `tip-card ${colorClass} border-l-4 shadow-md hover:shadow-lg px-6 py-5 rounded-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1`;
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-xl font-bold text-gray-800 leading-tight">${escapeHtml(tip.title)}</h3>
        ${createdDate ? `<span class="text-xs text-gray-500 ml-4 flex-shrink-0">${createdDate}</span>` : ''}
      </div>
      <div class="flex items-center mb-3">
        <span class="inline-block bg-white bg-opacity-70 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full border">
          <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
          </svg>
          ${escapeHtml(tip.category)}
        </span>
      </div>
      <p class="text-gray-700 leading-relaxed text-sm">${escapeHtml(tip.message)}</p>
      <div class="mt-4 flex items-center text-xs text-gray-500">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Click to view full details
      </div>
    `;

    // Add click handler for tip expansion
    card.addEventListener('click', () => showTipModal(tip));
    
    container.appendChild(card);
  });

  // Add animation class
  const style = document.createElement('style');
  style.textContent = `
    .tip-card {
      animation: slideInUp 0.6s ease-out forwards;
      opacity: 0;
    }
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  console.log('Tips rendered:', sortedTips.length, 'items');
  showSuccess(`Loaded ${sortedTips.length} health tips`);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showTipModal(tip) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('tipModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'tipModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-90vh overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h2 id="modalTitle" class="text-2xl font-bold text-gray-800 pr-8"></h2>
            <button id="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div id="modalCategory" class="mb-4"></div>
          <div id="modalContent" class="text-gray-700 leading-relaxed"></div>
          <div id="modalDate" class="mt-6 text-sm text-gray-500"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Add close handlers
    document.getElementById('closeModal').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
      }
    });
  }

  // Populate modal with tip data
  document.getElementById('modalTitle').textContent = tip.title;
  document.getElementById('modalCategory').innerHTML = `
    <span class="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
      ${escapeHtml(tip.category)}
    </span>
  `;
  document.getElementById('modalContent').textContent = tip.message;
  
  const modalDate = document.getElementById('modalDate');
  if (tip.date) {
    const formattedDate = new Date(tip.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    modalDate.textContent = `Published: ${formattedDate}`;
  } else {
    modalDate.textContent = '';
  }

  // Show modal
  modal.classList.remove('hidden');
}

// Update tip counter
function updateTipCounter(count) {
  const counter = document.getElementById("tipCounter");
  if (counter) {
    counter.textContent = `${count} tip${count !== 1 ? 's' : ''}`;
  }
}

// Refresh function
function refreshTips() {
  loadTips();
}

// Make functions globally available
window.loadTips = loadTips;
window.refreshTips = refreshTips;
window.renderTips = renderTips;
window.updateTipCounter = updateTipCounter;

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // R key to refresh
  if (e.key === 'r' || e.key === 'R') {
    if (!e.target.matches('input, textarea')) {
      refreshTips();
    }
  }
});