const tableBody = document.getElementById('lowStockTableBody');
const noResults = document.getElementById('noResults');
const filterForm = document.getElementById('filterForm');
const resetBtn = document.getElementById('resetFilters');
const totalCount = document.getElementById('totalCount');

let lowStockItems = [];
let currentSort = { field: 'quantity', ascending: true };

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

async function fetchLowStockItems() {
  try {
    const response = await fetch('http://localhost:5000/lowstock/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json',
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

    const result = await response.json();
    if (!response.ok) {
      console.error('Error fetching data:', result.error);
      showError('Error fetching low stock')
      return;
    }

    // Adjust property name from backend ('name' → 'item_name')
    lowStockItems = (result.lowStock || [])
      .filter(item => item.quantity <= item.stock_limit);

    applyFiltersAndSort();
  } catch (err) {
    console.error('Unexpected error fetching low stock:', err);
    showError('Unexpected Error fetching low stock')
  }
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return isNaN(date) ? 'Invalid date' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderTable(items) {
  if (!tableBody) return;

  tableBody.innerHTML = '';
  if (items.length === 0) {
    noResults?.classList.remove('hidden');
    totalCount.textContent = '0';
    return;
  }

  noResults?.classList.add('hidden');
  totalCount.textContent = items.length;

  items.forEach(item => {
    const tr = document.createElement('tr');
    tr.classList.add('border-b', 'hover:bg-gray-50');
    tr.innerHTML = `
      <td class="py-3 px-6 font-medium text-gray-900">${item.item_name}</td>
      <td class="py-3 px-6">${item.quantity}</td>
      <td class="py-3 px-6">${item.stock_limit}</td>
      <td class="py-3 px-6">${formatExpiryDate(item.expiry_date)}</td>
    `;
    tableBody.appendChild(tr);
  });
}

function applyFiltersAndSort() {
  if (!filterForm) return;

  const formData = new FormData(filterForm);
  let filtered = [...lowStockItems];

  const searchQuery = formData.get('search')?.trim().toLowerCase();
  if (searchQuery) {
    filtered = filtered.filter(item =>
      item.item_name.toLowerCase().includes(searchQuery)
    );
  }

  const quantityExactStr = formData.get('quantityExact')?.trim();
  if (quantityExactStr) {
    const quantityExact = parseInt(quantityExactStr, 10);
    if (!isNaN(quantityExact)) {
      filtered = filtered.filter(item => item.quantity === quantityExact);
    }
  }

  filtered.sort((a, b) => {
    const field = currentSort.field;

    if (field === 'expiry_date') {
      const dateA = a.expiry_date ? new Date(a.expiry_date) : new Date(0);
      const dateB = b.expiry_date ? new Date(b.expiry_date) : new Date(0);
      return currentSort.ascending ? dateA - dateB : dateB - dateA;
    }

    if (a[field] < b[field]) return currentSort.ascending ? -1 : 1;
    if (a[field] > b[field]) return currentSort.ascending ? 1 : -1;
    return 0;
  });

  renderTable(filtered);
}

function resetFilters() {
  filterForm?.reset();
  currentSort = { field: 'quantity', ascending: true };
  applyFiltersAndSort();
}

function setupSorting() {
  const headers = document.querySelectorAll('thead th[data-sort]');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.getAttribute('data-sort');

      if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending;
      } else {
        currentSort.field = field;
        currentSort.ascending = true;
      }

      applyFiltersAndSort();
      headers.forEach(h => h.classList.remove('underline'));
      header.classList.add('underline');
    });
  });
}

filterForm?.addEventListener('submit', e => {
  e.preventDefault();
  applyFiltersAndSort();
});

resetBtn?.addEventListener('click', resetFilters);

fetchLowStockItems();
setupSorting();
