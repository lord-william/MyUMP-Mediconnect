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

document.addEventListener("DOMContentLoaded", async () => {

  const token = sessionStorage.getItem('supabase_token');
  
  try {
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
    sessionStorage.setItem('user_name', fullName);

    localStorage.setItem('email', mail);

    document.getElementById("userName").textContent = `Welcome, ${fullName}`;
    document.getElementById("welcomeHeading").textContent = `Welcome to MediConnect, ${fullName}!`;

  } catch (err) {
    console.error(err);

   showError("Error loading user data.", "error");
  }
});
      