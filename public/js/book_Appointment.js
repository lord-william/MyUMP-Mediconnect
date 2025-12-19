let currentUser = null;
const fullNameInput = document.getElementById("fullName");
const timeSlotSelect = document.getElementById("timeSlotSelect");

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

// Load user
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = sessionStorage.getItem("supabase_token");
    const res = await fetch('http://localhost:5000/book/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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

    const user = await res.json();
    if (!res.ok) throw new Error(user.message);

    currentUser = user;
    fullNameInput.value = user.user_metadata?.name || "Student";
  } catch (error) {
    console.error(error);
    showError("Please log in first.", "error");
    window.location.href = "login.html";
  }
});

// Generate time slots
function generateHourlySlots(startHour = 9, endHour = 16) {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push(`${start} - ${end}`);
  }
  return slots;
}

console.log(generateHourlySlots());


 // Run once when page loads
  window.addEventListener("DOMContentLoaded", () => {
    const datePicker = document.getElementById("datePicker");

    // Today's date
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    datePicker.setAttribute("min", todayStr);

    // Max date (30 days ahead)
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split("T")[0];
    datePicker.setAttribute("max", maxDateStr);
  });

  // Keep this for loading slots
  window.loadSlots = async function () {
    const date = document.getElementById("datePicker").value;
    const timeSlotSelect = document.getElementById("timeSlotSelect");

    // Reset slots
    timeSlotSelect.innerHTML = '<option value="">-- Select a Time Slot --</option>';
    const slots = generateHourlySlots();

    for (const time of slots) {
      try {
        const res = await fetch(`http://localhost:5000/book/slots?date=${date}&time=${time}`,{
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem("supabase_token")}` }
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

        const option = document.createElement("option");
        option.value = time;
        option.textContent = `${time} ${data.length >= 4 ? '(Full)' : ''}`;
        option.disabled = data.length >= 4;
        timeSlotSelect.appendChild(option);
      } catch (error) {
        showError(error);
      }
    }
  };
// Submit booking
document.getElementById("bookingForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const date = document.getElementById("datePicker").value;
  const time = timeSlotSelect.value;
  if (!date || !time) return showError("Please select both date and time.", "warning");
  try {
    const token = sessionStorage.getItem("supabase_token");

    // Get latest diagnosis
    const diagRes = await fetch('http://localhost:5000/book/diagnosis', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (diagRes.status === 401) {
      window.location.href = "401.html";
      return;
    }
    if (diagRes.status === 403) {
      window.location.href = "403.html";
      return;
    }
    if (diagRes.status === 404) {
      window.location.href = "404.html";
      return;
    }
    const diag = await diagRes.json();

    const bookingRes = await fetch('http://localhost:5000/book/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
       },
      body: JSON.stringify({
        user_id: currentUser.id,
        user_name: currentUser.user_metadata?.name || "Student",
        date,
        time,
        symptoms: diag.symptoms,
        diagnosis: diag.diagnosis,
        email: currentUser.email
      })
    });
    if (bookingRes.status === 401) {
      window.location.href = "401.html";
      return;
    }
    if (bookingRes.status === 403) {
      window.location.href = "403.html";
      return;
    }
    if (bookingRes.status === 404) {
      window.location.href = "404.html";
      return;
    }

    const bookingData = await bookingRes.json();
    if (!bookingRes.ok) throw new Error(bookingData.message);

    document.getElementById("confirmation").classList.remove("hidden");
  } catch (error) {
  
    showError(error.message, "error");
  }
});
