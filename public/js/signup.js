 // ✅ Notification functions
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

  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const requirements = {
    length: document.getElementById("length"),
    uppercase: document.getElementById("uppercase"),
    number: document.getElementById("number"),
    special: document.getElementById("special"),
  };

  function checkPasswordStrength(value) {
    let valid = true;

    if (value.length >= 8) {
      requirements.length.classList.replace("text-red-500", "text-green-600");
    } else {
      requirements.length.classList.replace("text-green-600", "text-red-500");
      valid = false;
    }

    if (/[A-Z]/.test(value)) {
      requirements.uppercase.classList.replace("text-red-500", "text-green-600");
    } else {
      requirements.uppercase.classList.replace("text-green-600", "text-red-500");
      valid = false;
    }

    if (/\d/.test(value)) {
      requirements.number.classList.replace("text-red-500", "text-green-600");
    } else {
      requirements.number.classList.replace("text-green-600", "text-red-500");
      valid = false;
    }

    if (/[!@#$%^&*]/.test(value)) {
      requirements.special.classList.replace("text-red-500", "text-green-600");
    } else {
      requirements.special.classList.replace("text-green-600", "text-red-500");
      valid = false;
    }

    passwordInput.classList.toggle("border-green-500", valid);
    passwordInput.classList.toggle("border-red-500", !valid);

    return valid;
  }

  passwordInput.addEventListener("input", () => checkPasswordStrength(passwordInput.value));

  document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const name = document.getElementById("name").value.trim();
    const emailError = document.getElementById("emailError");
    emailError.textContent = "";

    if (!email.endsWith("@ump.ac.za")) {
      showError("Only University of Mpumalanga emails (@ump.ac.za) are allowed.");
      return;
    }

    if (!checkPasswordStrength(password)) {
      showError("Your password does not meet the requirements.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await res.json();

      if (res.ok) {
        showSuccess("Signup successful! Check your email to verify your account.");
        setTimeout(() => (window.location.href = "login.html"), 3000);
      } else {
        showError("Signup failed: " + result.error);
      }
    } catch (err) {
      console.error(err);
      showError("Something went wrong. Please try again.");
    }
  });