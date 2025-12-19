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


const form = document.getElementById("tipForm");
const submitBtn = document.getElementById("submitBtn");
const tipsContainer = document.getElementById("tipsContainer");

// Store all tips globally for filtering
let allTips = [];

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateTipCount(count) {
  const tipCountEl = document.getElementById("tipCount");
  if (tipCountEl) {
    tipCountEl.textContent = `${count} tip${count !== 1 ? 's' : ''}`;
  }
}

async function loadTips() {
  if (!tipsContainer) {
    console.error('Tips container not found');
    return;
  }

  tipsContainer.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading tips...</span>
    </div>
  `;

  try {
    console.log('Loading health tips...');
    const res = await fetch("http://localhost:5000/api/load", {
      method: "GET",
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

    const tips = await res.json();

    if (!res.ok) throw new Error(tips.message || "Error fetching tips");

    console.log('Tips loaded from backend:', tips);
    
    // Store all tips globally for filtering
    allTips = tips || [];
    window.allTips = allTips;
    
    renderTips(allTips);

  } catch (error) {
    console.error("Error loading tips:", error);
    tipsContainer.innerHTML = "<p class='text-red-500 text-center py-8'>Failed to load health tips. Please try again later.</p>";
    showError("Failed to load health tips from server");
  }
}

function renderTips(tips) {
  if (!tipsContainer) return;
  
  // Update tip counter
  updateTipCount(tips ? tips.length : 0);
  
  if (!tips || tips.length === 0) {
    tipsContainer.innerHTML = "<p class='text-gray-500 text-center py-8'>No health tips found. Try adjusting your search or filter.</p>";
    return;
  }

  tipsContainer.innerHTML = "";
  
  // Sort tips by date (newest first)
  const sortedTips = [...tips].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedTips.forEach(tip => {
    const div = document.createElement("div");
    div.className = "relative border border-gray-200 bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow";
    div.dataset.id = tip.id;

    const createdDate = tip.date ? new Date(tip.date).toLocaleDateString() : 'Unknown date';

    div.innerHTML = `
      <div class="pr-20">
        <h3 class="text-xl font-semibold text-green-700 mb-2">${escapeHtml(tip.title)}</h3>
        <div class="flex items-center gap-4 mb-3">
          <p class="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">${escapeHtml(tip.category)}</p>
          <p class="text-xs text-gray-500">${createdDate}</p>
        </div>
        <p class="whitespace-pre-wrap text-gray-700 leading-relaxed">${escapeHtml(tip.message)}</p>
      </div>
      <div class="absolute top-4 right-4 flex flex-col gap-2">
        <button class="edit-btn bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
          <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          Edit
        </button>
        <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
          <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
          Delete
        </button>
      </div>
    `;

    tipsContainer.appendChild(div);
  });

  // Attach event listeners
  document.querySelectorAll(".edit-btn").forEach(btn => 
    btn.addEventListener("click", onEditClick)
  );
  
  document.querySelectorAll(".delete-btn").forEach(btn => 
    btn.addEventListener("click", e => {
      const id = e.target.closest("div[data-id]").dataset.id;
      onDeleteClick(id);
    })
  );

  console.log('Tips rendered:', tips.length, 'items');
}

function onEditClick(e) {
  const tipDiv = e.target.closest("div[data-id]");
  const id = tipDiv.dataset.id;
  const title = tipDiv.querySelector("h3").textContent;
  
  // Extract category from the styled element
  const categoryEl = tipDiv.querySelector(".text-blue-600");
  const category = categoryEl ? categoryEl.textContent : "";
  
  const message = tipDiv.querySelector("p.whitespace-pre-wrap").textContent;

  // Populate form fields
  const titleInput = document.getElementById("title");
  const categoryInput = document.getElementById("category");
  const messageInput = document.getElementById("message");

  if (titleInput) titleInput.value = title;
  if (categoryInput) categoryInput.value = category;
  if (messageInput) messageInput.value = message;

  // Update button state
  if (submitBtn) {
    submitBtn.innerHTML = `
      <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
      </svg>
      Update Tip
    `;
    submitBtn.disabled = false;
    submitBtn.dataset.editId = id;
    submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    submitBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
  }

  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Focus on title field
  if (titleInput) titleInput.focus();

  showSuccess("Ready to edit tip - make your changes and click 'Update Tip'");
}

async function onDeleteClick(id) {
  try {
    // Use custom showConfirm
    const confirmed = await showConfirm("Are you sure you want to delete this tip? This action cannot be undone.");
    if (!confirmed) return;

    // Find the tip element and show loading state
    const tipDiv = document.querySelector(`div[data-id="${id}"]`);
    if (tipDiv) {
      tipDiv.style.opacity = '0.5';
      tipDiv.style.pointerEvents = 'none';
    }

    try {
      const res = await fetch(`http://localhost:5000/api/del/${id}`, {
        method: "DELETE",
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showSuccess("Health tip deleted successfully");
      loadTips(); // Reload from backend

    } catch (fetchError) {
      console.warn('Backend delete failed, removing locally:', fetchError);
      
      // Remove from mock data if using it
      const tipIndex = mockTips.findIndex(tip => tip.id === id);
      if (tipIndex > -1) {
        mockTips.splice(tipIndex, 1);
        renderTips(mockTips);
      }
      
      showError("Deleted locally - backend connection failed");
    }

  } catch (error) {
    console.error("Error deleting tip:", error);
    showError("Error deleting tip");
    
    // Restore tip element
    if (tipDiv) {
      tipDiv.style.opacity = '1';
      tipDiv.style.pointerEvents = 'auto';
    }
  }
}

function resetForm() {
  if (form) form.reset();
  if (submitBtn) {
    submitBtn.innerHTML = `
      <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
      Submit Tip
    `;
    submitBtn.disabled = false;
    submitBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
    submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    delete submitBtn.dataset.editId;
  }
}

// Form submission handler
if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const titleEl = document.getElementById("title");
    const categoryEl = document.getElementById("category");
    const messageEl = document.getElementById("message");

    const title = titleEl?.value.trim() || '';
    const category = categoryEl?.value.trim() || '';
    const message = messageEl?.value.trim() || '';
    const date = new Date().toISOString();

    // Validation
    if (!title || !category || !message) {
      showError("Please fill in all fields.");
      return;
    }

    if (title.length < 3) {
      showError("Title must be at least 3 characters long.");
      return;
    }

    if (message.length < 10) {
      showError("Message must be at least 10 characters long.");
      return;
    }

    const isEdit = !!submitBtn?.dataset.editId;
    const url = isEdit
      ? `http://localhost:5000/api/updatetip/${submitBtn.dataset.editId}`
      : "http://localhost:5000/api/addtip";

    const method = isEdit ? "PUT" : "POST";

    // Disable submit button during request
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = isEdit ? "Updating..." : "Submitting...";
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ title, category, message, date })
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
      if (!res.ok) throw new Error(data.message);

      showSuccess(isEdit ? "Health tip updated successfully!" : "Health tip added successfully!");
      resetForm();
      loadTips(); // Reload from backend

    } catch (fetchError) {
      console.warn('Backend operation failed, handling locally:', fetchError);
      
      // Handle locally for demo purposes
      if (isEdit) {
        const tipIndex = mockTips.findIndex(tip => tip.id === submitBtn.dataset.editId);
        if (tipIndex > -1) {
          mockTips[tipIndex] = { 
            ...mockTips[tipIndex], 
            title, 
            category, 
            message, 
            date 
          };
        }
        showSuccess("Health tip updated locally!");
      } else {
        const newTip = {
          id: Date.now().toString(),
          title,
          category,
          message,
          date
        };
        mockTips.unshift(newTip);
        showSuccess("Health tip added locally!");
      }
      
      renderTips(mockTips);
      resetForm();
      showError("Changes saved locally - backend connection failed");
    } finally {
      // Always re-enable the submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        if (!submitBtn.dataset.editId) {
          submitBtn.innerHTML = `
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Submit Tip
          `;
        }
      }
    }

  });
}

// Make functions globally available
window.showConfirm = showConfirm;
window.loadTips = loadTips;
window.renderTips = renderTips;
window.updateTipCount = updateTipCount;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing health tips...');
  loadTips();
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Escape to cancel edit mode
    if (e.key === 'Escape' && submitBtn?.dataset.editId) {
      resetForm();
      showSuccess('Edit cancelled');
    }
    
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (form && !submitBtn?.disabled) {
        form.dispatchEvent(new Event('submit'));
      }
    }
  });
  
  console.log('Health tips management initialized');
});