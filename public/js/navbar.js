// js/navbar.js
document.addEventListener("DOMContentLoaded", async () => {
  const profileBtn = document.getElementById("profileBtn");
  const userNameElement = document.getElementById("userName");
  const welcomeHeading = document.getElementById("welcomeHeading");

  // If no navbar exists on this page, safely return
  if (!profileBtn) return;

  // Checking authentication token
  const token = sessionStorage.getItem("supabase_token");
  if (!token) {
    console.warn("No token found — redirecting to landing.");
    window.location.replace("landing.html");
    return;
  }

  // If user name already cached in session, using it immediately
  const cachedName = sessionStorage.getItem("user_name");
  if (cachedName) {
    updateNavbarName(cachedName);
  }

  try {
    // Fetch the user details from backend
    const response = await fetch("http://localhost:5000/student/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) return (window.location.href = "401.html");
    if (response.status === 403) return (window.location.href = "403.html");
    if (response.status === 404) return (window.location.href = "404.html");
    if (!response.ok) throw new Error("Failed to fetch user info");

    const data = await response.json();
    const fullName = data.name || "Student";
    const email = data.email || "";

    sessionStorage.setItem("user_name", fullName);
    localStorage.setItem("email", email);

    updateNavbarName(fullName);
  } catch (err) {
    console.error("Error fetching user:", err);
  }

  // Function to update UI everywhere
  function updateNavbarName(fullName) {
    const nameParts = fullName.trim().split(" ");
    const initials =
      nameParts.length >= 2
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase();

    profileBtn.textContent = initials;
  }
});
