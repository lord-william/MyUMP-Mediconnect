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

let appointments = [];
let allAppointments = [];
let currentSort = { field: 'date', ascending: true };

const API_BASE = "http://localhost:5000"; // change to your backend URL


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

// Confirmation modal function
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const messageEl = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    if (!modal || !messageEl || !yesBtn || !noBtn) {
      console.warn('Confirm modal elements not found, using browser confirm');
      resolve(confirm(message));
      return;
    }

    messageEl.textContent = message;
    modal.classList.remove('hidden');

    const handleYes = () => {
      modal.classList.add('hidden');
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
      resolve(true);
    };

    const handleNo = () => {
      modal.classList.add('hidden');
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
      resolve(false);
    };

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleNo();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

// Fetch from backend with mock data fallback
async function loadAppointments() {
  try {
    console.log('Loading appointments...');
    const res = await fetch(`${API_BASE}/appointments/list`, {
      method: 'GET',
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      }
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

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.error || "Unknown error loading appointments");
    }

    appointments = result.appointments || [];
    allAppointments = [...appointments]; // Store original appointments
    console.log('Appointments loaded from backend:', appointments);
    renderTable(appointments);

  } catch (err) {
    console.error("Error loading appointments:", err);
    appointments = [];
    showError("Failed to load appointments. Please try again later.");
    renderTable(appointments);
  }
}

function formatTime(time) {
  if (!time) return '';
  
  // Check if time is already in interval format (e.g., "10:00 - 11:00")
  if (time.includes(' - ')) {
    return time; // Already formatted as interval
  }
  
  // Convert single time to interval (e.g., "10:00" -> "10:00 - 11:00")
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const nextHour = hour + 1;
  
  const startTime = `${hours}:${minutes}`;
  const endTime = `${nextHour.toString().padStart(2, '0')}:${minutes}`;
  
  return `${startTime} - ${endTime}`;
}

function formatDiagnosis(diagnosis) {
  if (!diagnosis) return '—';

  try {
    const parsed = typeof diagnosis === 'string' ? JSON.parse(diagnosis) : diagnosis;

    if (Array.isArray(parsed)) {
      // If diagnosis is an array of objects
      return parsed.map((d, i) => {
        if (typeof d === 'object') {
          return (
            `<div style="max-width: 900px; word-wrap: break-word; margin-bottom: 10px;"><strong style="color: #555555;">Diagnosis ${i + 1}:</strong><br>` +
            Object.entries(d)
              .map(([key, value]) => `• <strong style="color: grey;">${key}:</strong> ${value}`)
              .join('<br>') +
            `</div>`
          );
        } else {
          return `<div style="max-width: 900px; word-wrap: break-word; margin-bottom: 10px;">• ${d}</div>`;
        }
      }).join('');
    } else if (typeof parsed === 'object') {
      // If diagnosis is a single object
      return (
        `<div style="max-width: 900px; word-wrap: break-word; margin-bottom: 10px;">` +
        Object.entries(parsed)
          .map(([key, value]) => `• <strong style="color: grey;">${key}:</strong> ${value}`)
          .join('<br>') +
        `</div>`
      );
    }

    return `<div style="max-width: 900px; word-wrap: break-word; margin-bottom: 10px;">${parsed.toString()}</div>`;
  } catch (e) {
    return `<div style="max-width: 900px; word-wrap: break-word; margin-bottom: 10px;">${diagnosis}</div>`;
  }
}

function renderTable(data) {
  const tableBody = document.getElementById('appointmentsTableBody');
  if (!tableBody) {
    console.error('Appointments table body not found');
    return;
  }

  tableBody.innerHTML = '';

  const sortedData = data.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA - dateTimeB;
  });

  sortedData.forEach(apt => {
    const statusColor = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-orange-100 text-orange-800'
    };

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="py-3 px-4 font-medium">${apt.date || '—'}</td>
      <td class="py-3 px-4 font-medium">${formatTime(apt.time)}</td>
      <td class="py-3 px-4">${apt.user_name || '—'}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-1 text-xs font-semibold rounded ${statusColor[apt.status] || ''}">${apt.status || 'unknown'}</span>
      </td>
      <td class="py-3 px-4">${apt.symptoms || '—'}</td>
      <td class="py-3 px-4 align-top">${formatDiagnosis(apt.diagnosis)}</td>
      <td class="py-3 px-4 space-x-2">
        <button onclick="changeStatus('${apt.id}', 'cancelled')" class="text-red-600 hover:underline text-xs">Cancel</button>
        <button onclick="changeStatus('${apt.id}', 'completed')" class="text-green-600 hover:underline text-xs">Complete</button>
        <button onclick="changeStatus('${apt.id}', 'no-show')" class="text-yellow-600 hover:underline text-xs">No-Show</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  console.log('Table rendered with', sortedData.length, 'appointments');
}

function applyFilters() {
  const date = document.getElementById('filterDate')?.value || '';
  const time = document.getElementById('filterTime')?.value || '';
  const student = document.getElementById('filterStudent')?.value?.trim().toLowerCase() || '';
  const status = document.getElementById('filterStatus')?.value || '';

  const filtered = allAppointments.filter(apt => {
    // Date filter
    const matchesDate = !date || apt.date === date;
    
    // Time filter - check if appointment time matches the interval exactly
    let matchesTime = true;
    if (time) {
      const aptTime = apt.time || '';
      // Format appointment time to interval if it's not already
      const formattedAptTime = formatTime(aptTime);
      // Match exact time interval
      matchesTime = formattedAptTime === time;
    }
    
    // Student filter - search by both name and surname
    let matchesStudent = true;
    if (student) {
      const userName = (apt.user_name || '').toLowerCase();
      // Split search term by spaces to search for multiple words
      const searchTerms = student.split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length > 0) {
        // Check if all search terms are found in the user name
        matchesStudent = searchTerms.every(term => userName.includes(term));
      }
    }
    
    // Status filter
    const matchesStatus = !status || apt.status === status;

    return matchesDate && matchesTime && matchesStudent && matchesStatus;
  });

  console.log('Filters applied:', { date, time, student, status });
  console.log('Filtered results:', filtered.length, 'appointments');
  
  appointments = filtered; // Update current appointments
  renderTable(filtered);
  showSuccess(`Found ${filtered.length} matching appointment${filtered.length !== 1 ? 's' : ''}`);
}

function clearFilters() {
  const filterDate = document.getElementById('filterDate');
  const filterTime = document.getElementById('filterTime');
  const filterStudent = document.getElementById('filterStudent');
  const filterStatus = document.getElementById('filterStatus');

  if (filterDate) filterDate.value = '';
  if (filterTime) filterTime.value = '';
  if (filterStudent) filterStudent.value = '';
  if (filterStatus) filterStatus.value = '';

  appointments = [...allAppointments]; // Restore all appointments
  renderTable(appointments);
  showSuccess('Filters cleared');
}

async function changeStatus(id, newStatus) {
  try {
    const apt = appointments.find(a => String(a.id) === String(id));
    if (!apt) {
      showError('Appointment not found.');
      return;
    }

    // Confirmation dialog
    const actionMessages = {
      'cancelled': `Are you sure you want to cancel the appointment for ${apt.user_name}?`,
      'completed': `Mark ${apt.user_name}'s appointment as completed?`,
      'no-show': `Mark ${apt.user_name}'s appointment as no-show?`
    };

    const confirmed = await showConfirm(actionMessages[newStatus] || `Change status to ${newStatus}?`);
    if (!confirmed) return;

    try {
      // Try to update via backend
      const res = await fetch(`${API_BASE}/appointments/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ id, status: newStatus })
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

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Unknown error");
      }

      showSuccess(`Appointment status changed to "${newStatus}".`);

    } catch (fetchError) {
      console.warn('Backend update failed, updating locally only:', fetchError);
      showError('Updated locally - backend connection failed');
    }

    // Update locally regardless of backend response
    appointments = appointments.map(apt =>
      String(apt.id) === String(id) ? { ...apt, status: newStatus } : apt
    );
    
    // Re-render the table
    renderTable(appointments);

  } catch (err) {
    console.error("Error updating status:", err);
    showError("Error updating appointment status");
  }
}

// Make functions globally available
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.changeStatus = changeStatus;
window.loadAppointments = loadAppointments;
window.renderTable = renderTable;

// Initial load
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing appointments...');
  loadAppointments();
  
  // Set up periodic refresh (every 30 seconds)
  setInterval(loadAppointments, 30000);
  
  console.log('Appointment management initialized');
});