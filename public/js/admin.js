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

let users = [];
let filteredUsers = [];
let currentEditUserId = null;

async function fetchUsers() {
  try {
    const res = await fetch('http://localhost:5000/admin/users', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem("supabase_token")}`
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

    const data = await res.json();

    if (!res.ok) {
      console.error('Error fetching users:', data.message || data.error);
      return;
    }

    // Adjust if backend wraps users in "inserted" key
    const userList = data.inserted?.users || data.users || [];

    users = userList.map(u => ({
      ...u,
      avatar: u.user_metadata?.name
        ? u.user_metadata.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : u.email[0].toUpperCase(),
      name: u.user_metadata?.name || u.email,
      role: u.user_metadata?.role || 'student',
      status: u.user_metadata?.status || 'inactive',
      lastActive: u.last_sign_in_at || 'Unknown'
    }));

    filteredUsers = [...users];
    updateStats();
    renderUsers();
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

function updateStats() {
  const total = users.length;
  const admins = users.filter(u => u.role === 'admin').length;
  const staffs = users.filter(u => u.role === 'staff').length;
  const students = users.filter(u => u.role === 'student').length;

  document.getElementById('totalUsers').textContent = total;
  document.getElementById('adminCount').textContent = admins;
  document.getElementById('staffCount').textContent = staffs;
  document.getElementById('studentCount').textContent = students;
}

function getRoleBadgeClass(role) {
  switch (role) {
    case 'admin': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'staff': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'student': return 'bg-white/20 text-white border-white/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

function getStatusBadgeClass(status) {
  return status === 'active'
    ? 'bg-green-500/20 text-green-300 border-green-500/30'
    : 'bg-gray-500/20 text-gray-300 border-gray-500/30';
}

function renderUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) {
    console.error('Users table body not found');
    return;
  }

  tbody.innerHTML = '';

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-400">
          No users found
        </td>
      </tr>
    `;
    return;
  }

  filteredUsers.forEach(user => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-white/5 transition-colors';
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full flex items-center justify-center text-navy-900 font-semibold text-sm mr-3">
            ${user.avatar}
          </div>
          <span class="text-white font-medium">${user.name}</span>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-300">${user.email}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role)}">
          ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(user.status)}">
          ${user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-300">${user.lastActive}</td>
      <td class="px-6 py-4 whitespace-nowrap flex space-x-2">
        <button onclick="openRoleModal('${user.id}')" class="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors">
          Change Role
        </button>
        <button onclick="toggleUserStatus('${user.id}')" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors">
          ${user.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
        <button onclick="showDeleteModal('${user.email}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors">
  Delete
</button>


      </td>
    `;
    tbody.appendChild(row);
  });
}


function filterUsers() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const roleFilter = document.getElementById('roleFilter').value;

  filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
                          user.email.toLowerCase().includes(searchTerm);
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  renderUsers();
}

function openRoleModal(userId) {
  const user = users.find(u => u.id === userId);
  currentEditUserId = userId;
  document.getElementById('modalUserName').textContent = user.name;
  document.getElementById('newRoleSelect').value = user.role;
  document.getElementById('roleModal').classList.remove('hidden');
}

function closeRoleModal() {
  document.getElementById('roleModal').classList.add('hidden');
  currentEditUserId = null;
}

async function confirmRoleChange() {
  const newRole = document.getElementById('newRoleSelect').value;
  const user = users.find(u => u.id === currentEditUserId);

  try {
    const res = await fetch('http://localhost:5000/admin/role', {
      method: 'POST',
      headers: { "Content-Type": "application/json",
        'Authorization': `Bearer ${sessionStorage.getItem("supabase_token")}`
       },
      body: JSON.stringify({ email: user.email, newRole })
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

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error);

    user.role = newRole;
    showToast(`${user.name}'s role changed to ${newRole}`);
    updateStats();
    renderUsers();
    closeRoleModal();
  } catch (error) {
    console.error('Error updating role:', error);
    showToast('Failed to change role', 'error');
  }
}

async function toggleUserStatus(userId) {
  const user = users.find(u => u.id === userId);
  const newStatus = user.status === 'active' ? 'inactive' : 'active';

  try {
    const res = await fetch('http://localhost:5000/admin/status', {
      method: 'POST',
      headers: { "Content-Type": "application/json",
        'Authorization': `Bearer ${sessionStorage.getItem("supabase_token")}`
       },
      body: JSON.stringify({ email: user.email, newStatus })
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

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error);

    user.status = newStatus;
    showToast(`${user.name} ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    renderUsers();
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Failed to change status', 'error');
  }
}
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
let userToDeleteEmail = null;
const modal = document.getElementById('deleteModal');
const modalContent = modal.querySelector('div'); // inner modal box

function showDeleteModal(email) {
  userToDeleteEmail = email;

  modal.classList.remove('pointer-events-none', 'opacity-0');
  modalContent.classList.remove('scale-90');
  modalContent.classList.add('scale-100');
}

function hideDeleteModal() {
  modal.classList.add('opacity-0');
  modalContent.classList.add('scale-90');

  // Wait for transition to complete before hiding pointer events
  setTimeout(() => {
    modal.classList.add('pointer-events-none');
  }, 300); // match the CSS transition duration
}

// Cancel button
document.getElementById('cancelDelete').addEventListener('click', hideDeleteModal);

// Confirm button
document.getElementById('confirmDelete').addEventListener('click', async () => {
  hideDeleteModal();
  if (userToDeleteEmail) {
    await deleteUser(userToDeleteEmail);
    userToDeleteEmail = null;
  }
});

// Close modal when clicking outside the modal content
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    hideDeleteModal();
    userToDeleteEmail = null;
  }
});



async function deleteUser(email) {
  // Ask for confirmation

  try {
    const res = await fetch('http://localhost:5000/admin/delete', {
      method: 'DELETE',
      headers: { "Content-Type": "application/json",
        'Authorization': `Bearer ${sessionStorage.getItem("supabase_token")}`
       },
      body: JSON.stringify({ email })
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

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete user');

    // Remove user from filteredUsers array so table updates immediately
    filteredUsers = filteredUsers.filter(user => user.email !== email);

    renderUsers(); // Re-render table

    showToast('User deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting user:', error);
    showToast(`Failed to delete user: ${error.message}`, 'error');
  }
}


function addNewUser() {
  document.getElementById('addUserModal').classList.remove('hidden');
}

function closeAddUserModal() {
  document.getElementById('addUserModal').classList.add('hidden');
  document.getElementById('addUserForm').reset();
}
function handleAddUserSubmit(e) {
  e.preventDefault();
  
  // TODO: Implement add user backend call
  console.log("Add user form submitted");
}

document.getElementById("addUserForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("newUserName").value.trim();
    const email = document.getElementById("newUserEmail").value.trim();
    const role = document.getElementById("newUserRole").value;
    
    // Error display element
    let errorDiv = document.getElementById("emailError");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = "emailError";
        errorDiv.style.color = "red";
        errorDiv.style.fontSize = "14px";
        document.getElementById("newUserEmail").parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = "";

    // Email validation
    if (!email.endsWith("@ump.ac.za")) {
        errorDiv.textContent = "Only University of Mpumalanga emails (@ump.ac.za) are allowed.";
        return;
    }

    // Send data to backend
    try {
        const response = await fetch("http://localhost:5000/admin/add-user", {
            method: "POST",
            headers: { "Content-Type": "application/json",
                authorization: `Bearer ${sessionStorage.getItem("supabase_token")}`
             },
            body: JSON.stringify({ name, email, role })
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

        const result = await response.json();

        if (!response.ok) {
            errorDiv.textContent = result.error || "Something went wrong.";
            return;
        }

        closeAddUserModal();
        document.getElementById("addUserForm").reset();

    } catch (err) {
        errorDiv.textContent = "Server error. Please try again.";
    }
});


function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  toast.className = type === 'error'
    ? 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 z-50'
    : 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 z-50';

  toastMessage.textContent = message;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.transform = 'translateY(100%)';
    toast.style.opacity = '0';
  }, 3000);
}

// Expose globally
window.showDeleteModal = showDeleteModal;
window.hideDeleteModal = hideDeleteModal;
window.deleteUser = deleteUser;
window.fetchUsers = fetchUsers;
window.filterUsers = filterUsers;
window.openRoleModal = openRoleModal;
window.closeRoleModal = closeRoleModal;
window.confirmRoleChange = confirmRoleChange;
window.toggleUserStatus = toggleUserStatus;
window.addNewUser = addNewUser;
window.closeAddUserModal = closeAddUserModal;
window.handleAddUserSubmit = handleAddUserSubmit;
window.showToast = showToast;
window.renderUsers = renderUsers;
window.updateStats = updateStats;

// Init
document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();

  const addUserForm = document.getElementById('addUserForm');
  if (addUserForm) {
    addUserForm.addEventListener('submit', handleAddUserSubmit);
  }

  const roleModal = document.getElementById('roleModal');
  if (roleModal) {
    roleModal.addEventListener('click', function (e) {
      if (e.target === this) closeRoleModal();
    });
  }

  const addUserModal = document.getElementById('addUserModal');
  if (addUserModal) {
    addUserModal.addEventListener('click', function (e) {
      if (e.target === this) closeAddUserModal();
    });
  }
});
document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault(); // Prevent default link behavior

  // Remove all session/local storage related to the user
  sessionStorage.removeItem('supabase_token'); // JWT
  localStorage.removeItem('email');          // optional stored email

  // Redirect to landing page
  window.location.href = "landing.html";
});
