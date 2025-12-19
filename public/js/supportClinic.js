// Remove sessionStorage dependency and replace with localStorage fallback or mock
function getToken() {
  try {
    const token = sessionStorage.getItem("supabase_token");
    if (!token) {
      throw new Error("No authentication token found");
    }
    return token;
  } catch (error) {
    console.error("Authentication error:", error);
    window.location.href = "401.html";
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
    console.error("Error notification elements not found:", message);
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
    console.log("Success:", message);
  }
}

// Form validation functions
function validateName(name) {
  return name && name.trim().length >= 2;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && emailRegex.test(email.trim());
}

function validateMessage(message) {
  return message && message.trim().length >= 10;
}

function showFieldError(fieldName, message) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (!field) return;

  // Remove existing error styling
  field.parentElement.classList.remove("border-red-500", "ring-red-400");
  field.parentElement.classList.add("border-red-500", "ring-red-400");

  // Show error message
  let errorEl = field.parentElement.parentElement.querySelector(".field-error");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "field-error text-red-500 text-xs mt-1";
    field.parentElement.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;

  // Remove error styling after 5 seconds
  setTimeout(() => {
    field.parentElement.classList.remove("border-red-500", "ring-red-400");
    field.parentElement.classList.add("border-blue-300");
    if (errorEl) errorEl.remove();
  }, 5000);
}

function clearAllFieldErrors() {
  // Remove all error styling
  document.querySelectorAll(".border-red-500").forEach((el) => {
    el.classList.remove("border-red-500", "ring-red-400");
    el.classList.add("border-blue-300");
  });

  // Remove all error messages
  document.querySelectorAll(".field-error").forEach((el) => el.remove());
}

// Load user info from backend
document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();

  try {
    console.log("Loading user data...");
    const results = await fetch("http://localhost:5000/student/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

    if (!results.ok) throw new Error("Failed to fetch user");

    const data = await results.json();
    const fullName = data.name;
    const mail = data.email;

    try {
      localStorage.setItem("email", mail);
    } catch (storageError) {
      console.warn("localStorage not available:", storageError);
    }

    // Auto-fill the form with user data
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');

    if (nameInput) {
      nameInput.value = fullName;
      nameInput.style.backgroundColor = "#f8fafc"; // Light gray to indicate pre-filled
    }
    if (emailInput) {
      emailInput.value = mail;
      emailInput.style.backgroundColor = "#f8fafc"; // Light gray to indicate pre-filled
    }

    console.log("User data loaded and form pre-filled:", {
      name: fullName,
      email: mail,
    });
    showSuccess("Form pre-filled with your account information");
  } catch (err) {
    console.error("Error loading user data:", err);
    showError("Failed to load user information. Please log in again.");
    setTimeout(() => (window.location.href = "login.html"), 2000);
  }

  // Initialize form functionality
  initializeForm();
});

// Initialize form with validation and submission handling
function initializeForm() {
  const form = document.getElementById("supportForm");
  if (!form) {
    console.error("Support form not found");
    return;
  }

  // Add real-time validation
  const nameInput = document.querySelector('input[name="name"]');
  const emailInput = document.querySelector('input[name="email"]');
  const messageInput = document.querySelector('textarea[name="message"]');

  if (nameInput) {
    nameInput.addEventListener("blur", () => {
      if (!validateName(nameInput.value)) {
        showFieldError(
          "name",
          "Please enter a valid name (at least 2 characters)"
        );
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      if (!validateEmail(emailInput.value)) {
        showFieldError("email", "Please enter a valid email address");
      }
    });
  }

  if (messageInput) {
    // Character counter
    const maxLength = 1000;
    let counterEl =
      messageInput.parentElement.parentElement.querySelector(".char-counter");
    if (!counterEl) {
      counterEl = document.createElement("div");
      counterEl.className = "char-counter text-xs text-gray-500 mt-1";
      messageInput.parentElement.parentElement.appendChild(counterEl);
    }

    const updateCounter = () => {
      const remaining = maxLength - messageInput.value.length;
      counterEl.textContent = `${remaining} characters remaining`;
      counterEl.className =
        remaining < 100
          ? "char-counter text-xs text-red-500 mt-1"
          : "char-counter text-xs text-gray-500 mt-1";
    };

    messageInput.addEventListener("input", updateCounter);
    messageInput.addEventListener("blur", () => {
      if (!validateMessage(messageInput.value)) {
        showFieldError(
          "message",
          "Please enter a message (at least 10 characters)"
        );
      }
    });

    // Set max length
    messageInput.setAttribute("maxlength", maxLength);
    updateCounter(); // Initial update
  }

  // Form submission handler
  form.addEventListener("submit", handleFormSubmission);
}

// Enhanced form submission handler
async function handleFormSubmission(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const submitBtn = form.querySelector('button[type="submit"]');

  // Get form values
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  // Clear previous errors
  clearAllFieldErrors();

  // Validate all fields
  let hasErrors = false;

  if (!validateName(name)) {
    showFieldError("name", "Please enter a valid name (at least 2 characters)");
    hasErrors = true;
  }

  if (!validateEmail(email)) {
    showFieldError("email", "Please enter a valid email address");
    hasErrors = true;
  }

  if (!validateMessage(message)) {
    showFieldError(
      "message",
      "Please enter a message (at least 10 characters)"
    );
    hasErrors = true;
  }

  if (hasErrors) {
    showError("Please fix the errors above and try again");
    return;
  }

  // Disable submit button and show loading state
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="w-4 h-4 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v6m0 0l4-4m-4 4L8 4"></path>
    </svg>
    Sending...
  `;

  try {
    // Add timestamp and additional info to the form data
    const enhancedData = new FormData();
    enhancedData.append("name", name);
    enhancedData.append("email", email);
    enhancedData.append("message", message);
    enhancedData.append("timestamp", new Date().toISOString());
    enhancedData.append("source", "MediConnect Support Form");
    enhancedData.append("user_agent", navigator.userAgent);

    const response = await fetch(form.action, {
      method: form.method,
      body: enhancedData,
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      // Show success message
      showSuccess(
        "Your message has been sent successfully! We'll get back to you within 1 hour."
      );

      // Reset form
      form.reset();

      // Clear any background colors from pre-filled fields
      document.querySelectorAll("input, textarea").forEach((field) => {
        field.style.backgroundColor = "";
      });

      // Show inline success message
      showInlineMessage(
        "success",
        " Message sent successfully! Check your email for confirmation."
      );
    } else {
      const data = await response.json();
      const errorMsg =
        data?.errors?.[0]?.message || "Something went wrong. Please try again.";

      showError(`Failed to send message: ${errorMsg}`);
      showInlineMessage("error", `❌ ${errorMsg}`);
    }
  } catch (error) {
    console.error("Form submission error:", error);
    const errorMsg =
      "Network error. Please check your connection and try again.";

    showError(errorMsg);
    showInlineMessage("error", `❌ ${errorMsg}`);
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Show inline form message
function showInlineMessage(type, message) {
  const formMessage = document.getElementById("formMessage");
  if (!formMessage) return;

  formMessage.classList.remove(
    "hidden",
    "bg-red-500",
    "bg-green-500",
    "text-red-100",
    "text-white"
  );

  if (type === "success") {
    formMessage.classList.add("bg-green-500", "text-white");
  } else {
    formMessage.classList.add("bg-red-500", "text-red-100");
  }

  formMessage.textContent = message;
  formMessage.classList.remove("hidden");

  // Auto-hide after 5 seconds
  setTimeout(() => {
    formMessage.classList.add("hidden");
  }, 5000);
}

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // Ctrl/Cmd + Enter to submit form
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const form = document.getElementById("supportForm");
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (form && submitBtn && !submitBtn.disabled) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  }

  // Escape to clear form
  if (e.key === "Escape") {
    const form = document.getElementById("supportForm");
    if (form && confirm("Clear the form?")) {
      form.reset();
      clearAllFieldErrors();
      showSuccess("Form cleared");
    }
  }
});

// Auto-save form data to prevent loss
function autoSaveFormData() {
  const form = document.getElementById("supportForm");
  if (!form) return;

  const formData = {
    name: form.querySelector('[name="name"]')?.value || "",
    email: form.querySelector('[name="email"]')?.value || "",
    message: form.querySelector('[name="message"]')?.value || "",
  };

  try {
    localStorage.setItem("support_form_draft", JSON.stringify(formData));
  } catch (error) {
    console.warn("Could not save form draft:", error);
  }
}

// Restore form data if available
function restoreFormData() {
  try {
    const saved = localStorage.getItem("support_form_draft");
    if (!saved) return;

    const formData = JSON.parse(saved);
    const form = document.getElementById("supportForm");
    if (!form) return;

    // Only restore if fields are empty (don't override backend data)
    const nameField = form.querySelector('[name="name"]');
    const emailField = form.querySelector('[name="email"]');
    const messageField = form.querySelector('[name="message"]');

    if (nameField && !nameField.value && formData.name) {
      nameField.value = formData.name;
    }
    if (emailField && !emailField.value && formData.email) {
      emailField.value = formData.email;
    }
    if (messageField && !messageField.value && formData.message) {
      messageField.value = formData.message;
      showSuccess("Draft message restored");
    }
  } catch (error) {
    console.warn("Could not restore form draft:", error);
  }
}

// Set up auto-save
document.addEventListener("DOMContentLoaded", () => {
  // Restore any saved draft after a short delay (to not override backend data)
  setTimeout(restoreFormData, 1000);

  // Auto-save every 30 seconds
  setInterval(autoSaveFormData, 30000);

  // Auto-save on form changes
  const form = document.getElementById("supportForm");
  if (form) {
    form.addEventListener("input", () => {
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(autoSaveFormData, 2000); // Debounce
    });
  }
});

// Clear draft when form is successfully submitted
window.addEventListener("beforeunload", () => {
  // Don't clear draft on page unload, only on successful submission
});

// Export functions for testing
window.validateName = validateName;
window.validateEmail = validateEmail;
window.validateMessage = validateMessage;
