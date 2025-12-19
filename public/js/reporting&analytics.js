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

function clearStorage() {
  try {
    sessionStorage.clear();
    localStorage.clear();
  } catch (error) {
    console.warn("Storage clearing failed:", error);
  }
}

// Check authentication
if (!getToken()) {
  window.location.replace("landing.html");
}

// Logout functionality
document.addEventListener("DOMContentLoaded", function () {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearStorage();
      window.location.replace("landing.html");
    });
  }
});

let appointments = [];
let inventory = [];

const charts = {
  appointments: null,
  status: null,
  diagnosis: null,
  inventory: null,
};

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

// Convert JSON array to CSV string
function convertToCSV(arr) {
  if (!arr.length) return "";
  const keys = Object.keys(arr[0]);
  const header = keys.join(",") + "\n";
  const rows = arr
    .map((obj) =>
      keys
        .map((k) => `"${(obj[k] ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  return header + rows;
}

// Download helper
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// Export CSV function - Fixed
function exportToCSV(type) {
  try {
    let data = type === "appointments" ? appointments : inventory;
    if (!data.length) {
      showError(`No ${type} data to export`);
      return;
    }
    const csv = convertToCSV(data);
    downloadFile(csv, `${type}.csv`, "text/csv");
    showSuccess(`${type} CSV exported successfully`);
  } catch (error) {
    console.error("Export CSV error:", error);
    showError("Error exporting CSV file");
  }
}

// Load jsPDF and autotable plugin dynamically
function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf && window.jspdf.jsPDF) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => {
      const plugin = document.createElement("script");
      plugin.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js";
      plugin.onload = resolve;
      plugin.onerror = reject;
      document.body.appendChild(plugin);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
//Export PDF function
async function exportToPDF(type) {
  try {
    let data = type === "appointments" ? appointments : inventory;
    if (!data.length) {
      showError(`No ${type} data to export`);
      return;
    }

    await loadJsPDF();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Load logo
    const logo = new Image();
    logo.src = "media/logo2.png";
    await new Promise((resolve) => (logo.onload = resolve));

    // Header info
    const reportTitle =
      type.charAt(0).toUpperCase() + type.slice(1) + " Report";
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = pageWidth - logoWidth - 10;
    const logoY = 2;

    // Drawing header
    doc.setFontSize(16);
    doc.text(reportTitle, 10, 15);
    doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);

    //Defining table structure dynamically
    let columns = [];
    if (type === "appointments") {
      columns = [
        { header: "Patient Name", key: "user_name" },
        { header: "Date", key: "date" },
        { header: "Time", key: "time" },
        { header: "Status", key: "status" },
        { header: "Symptoms", key: "symptoms" },
      ];
    } else if (type === "inventory") {
      columns = [
        { header: "Item Name", key: "item_name" },
        { header: "Quantity", key: "quantity" },
        { header: "Stock Limit", key: "stock_limit" },
        { header: "Expiry Date", key: "expiry_date" },
        { header: "Category", key: "category" },
        { header: "Created At", key: "created_at" },
      ];
    }

    // Build table data
    const head = [columns.map((col) => col.header)];
    const body = data.map((obj) => columns.map((col) => obj[col.key] ?? ""));

    // Table setup
    doc.autoTable({
      head,
      body,
      startY: 28,
      margin: { top: 28 },
      didDrawPage: function () {
        doc.setFontSize(16);
        doc.text(reportTitle, 10, 15);
        doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);
      },
    });

    doc.save(`${type}.pdf`);
    showSuccess(`${type} PDF exported successfully`);
  } catch (error) {
    console.error("Export PDF error:", error);
    showError("Error exporting PDF file");
  }
}

// Fetch functions with better error handling
async function fetchAppointments() {
  try {
    console.log("Fetching appointments...");
    const response = await fetch("http://localhost:5000/report/appointments", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    appointments = result.data || [];
    console.log("Appointments loaded:", appointments);
    return appointments;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    showError("Failed to load appointments data. Please try again later.");
    appointments = [];
    return appointments;
  }
}

async function fetchInventory() {
  try {
    console.log("Fetching inventory...");
    const response = await fetch("http://localhost:5000/report/inventory", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    inventory = result.data || [];
    console.log("Inventory loaded:", inventory);
    return inventory;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    showError("Failed to load inventory data. Please try again later.");
    inventory = [];
    return inventory;
  }
}

// Update top stats
function updateStats() {
  const totalAppointments = appointments.length;
  const totalPatients = new Set(appointments.map((apt) => apt.user_name)).size;
  const inventoryValue = inventory.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const totalAppEl = document.getElementById("totalAppointments");
  const inventoryEl = document.getElementById("inventoryValue");
  const totalPatientsEl = document.getElementById("totalPatients");

  if (totalAppEl) totalAppEl.textContent = totalAppointments;
  if (inventoryEl) inventoryEl.textContent = inventoryValue;
  if (totalPatientsEl) totalPatientsEl.textContent = totalPatients;

  console.log("Stats updated:", {
    totalAppointments,
    totalPatients,
    inventoryValue,
  });
}

// Populate appointments table
function populateAppointmentsTable() {
  const tbody = document.getElementById("appointmentsTableBody");
  if (!tbody) {
    console.error("Appointments table body not found");
    return;
  }

  tbody.innerHTML = "";

  appointments.forEach((apt) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="p-3">${apt.user_name || "—"}</td>
      <td class="p-3">${apt.date || "—"}</td>
      <td class="p-3">${apt.time || "—"}</td>
      <td class="p-3">${apt.status || "—"}</td>
      <td class="p-3">${apt.symptoms || "—"}</td>
    `;
    tbody.appendChild(row);
  });

  console.log(
    "Appointments table populated with",
    appointments.length,
    "records"
  );
}

// Populate inventory table
function populateInventoryTable() {
  const tbody = document.getElementById("inventoryTableBody");
  if (!tbody) {
    console.error("Inventory table body not found");
    return;
  }

  tbody.innerHTML = "";

  inventory.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="p-3">${item.item_name || "—"}</td>
      <td class="p-3">${item.quantity || "0"}</td>
      <td class="p-3">${item.expiry_date || "—"}</td>
      <td class="p-3">${item.category || "—"}</td>
      <td class="p-3">${item.created_at?.split("T")[0] || "—"}</td>
    `;
    tbody.appendChild(row);
  });

  console.log("Inventory table populated with", inventory.length, "records");
}

// Charts
function createAppointmentsChart() {
  const ctx = document.getElementById("appointmentsChart");
  if (!ctx) {
    console.error("Appointments chart canvas not found");
    return;
  }

  if (charts.appointments) charts.appointments.destroy();

  const grouped = {};
  appointments.forEach((apt) => {
    if (apt.date) {
      grouped[apt.date] = (grouped[apt.date] || 0) + 1;
    }
  });

  const labels = Object.keys(grouped).sort();
  const data = labels.map((date) => grouped[date]);

  charts.appointments = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Appointments",
          data,
          borderColor: "#1e3a8a",
          fill: true,
          backgroundColor: "rgba(30, 58, 138, 0.2)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  console.log("Appointments chart created");
}

function createStatusChart() {
  const ctx = document.getElementById("statusChart");
  if (!ctx) {
    console.error("Status chart canvas not found");
    return;
  }

  if (charts.status) charts.status.destroy();

  const counts = appointments.reduce((acc, curr) => {
    if (curr.status) {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
    }
    return acc;
  }, {});

  charts.status = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: [
            "#3b82f6",
            "#22c55e",
            "#f97316",
            "#ef4444",
            "#a855f7",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  console.log("Status chart created");
}

/// Diagnosis Chart
async function loadAndRenderDiagnosisChart() {
  try {
    console.log("Loading diagnosis chart...");
    let data = [];

    // Fetch from backend
    const response = await fetch("http://localhost:5000/report/diagnosis", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      data = result.data || [];
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("Diagnosis data:", data);

    if (!data.length) {
      console.warn("No diagnosis data available");
      return;
    }

    // ✅ Extract only the top condition (top_disease) from the diagnosis JSON
    const counts = data.reduce((acc, item) => {
      let condition = "Unknown";

      if (item.diagnosis) {
        if (typeof item.diagnosis === "string") {
          try {
            const parsed = JSON.parse(item.diagnosis);
            if (parsed.top_disease) {
              condition = parsed.top_disease.trim();
            }
          } catch (err) {
            // fallback if it's just plain text
            condition = item.diagnosis.trim();
          }
        } else if (
          typeof item.diagnosis === "object" &&
          item.diagnosis.top_disease
        ) {
          condition = item.diagnosis.top_disease.trim();
        }
      }

      acc[condition] = (acc[condition] || 0) + 1;
      return acc;
    }, {});

    // Sort by frequency and take top 10
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const labels = sorted.map(([condition]) => condition);
    const chartData = sorted.map(([, count]) => count);

    const ctx = document.getElementById("diagnosisChart");
    if (!ctx) {
      console.error("Diagnosis chart canvas not found");
      return;
    }

    if (charts.diagnosis) charts.diagnosis.destroy();

    charts.diagnosis = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Number of Diagnoses",
            data: chartData,
            backgroundColor: "#6366f1",
            borderRadius: 4,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { autoSkip: false },
            title: {
              display: true,
              text: "Diagnosis Condition",
              font: { size: 14, weight: "bold" },
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Count",
              font: { size: 14, weight: "bold" },
            },
            ticks: { stepSize: 1 },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.parsed.y} patient${ctx.parsed.y !== 1 ? "s" : ""}`,
            },
          },
        },
      },
    });

    console.log("Diagnosis chart created");
  } catch (error) {
    console.error("Error creating diagnosis chart:", error);
    showError("Error creating diagnosis chart");
  }
}

function createInventoryChart() {
  const ctx = document.getElementById("inventoryChart");
  if (!ctx) {
    console.error("Inventory chart canvas not found");
    return;
  }

  if (charts.inventory) charts.inventory.destroy();

  const totalItems = inventory.length;
  const lowStockItemsCount = inventory.filter(
    (item) => item.quantity <= (item.stock_limit || 0)
  ).length;
  const normalStockItemsCount = totalItems - lowStockItemsCount;

  charts.inventory = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Low Stock", "Normal Stock"],
      datasets: [
        {
          data: [lowStockItemsCount, normalStockItemsCount],
          backgroundColor: ["#f43f5e", "#16a34a"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              return `${label}: ${value} item${value !== 1 ? "s" : ""}`;
            },
          },
        },
      },
    },
  });

  console.log("Inventory chart created");
}

// Initialize dates
function initializeDates() {
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 30);

  const startDateEl = document.getElementById("startDate");
  const endDateEl = document.getElementById("endDate");

  if (startDateEl) startDateEl.value = past.toISOString().split("T")[0];
  if (endDateEl) endDateEl.value = today.toISOString().split("T")[0];
}

// Filter logic - Fixed
function generateReports() {
  try {
    console.log("Generating reports...");
    const reportType = document.getElementById("reportType").value;
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);

    console.log("Filter criteria:", { reportType, startDate, endDate });

    const isWithinDateRange = (dateStr) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= startDate && date <= endDate;
    };

    let filteredAppointments = appointments;
    let filteredInventory = inventory;

    // Apply date filtering
    if (
      document.getElementById("startDate").value &&
      document.getElementById("endDate").value
    ) {
      filteredAppointments = appointments.filter((a) =>
        isWithinDateRange(a.date)
      );
      filteredInventory = inventory.filter((i) =>
        isWithinDateRange(i.created_at)
      );
    }

    console.log("Filtered data:", {
      appointments: filteredAppointments.length,
      inventory: filteredInventory.length,
    });

    // Update UI based on report type
    if (reportType === "appointments" || reportType === "all") {
      renderAppointmentsFromData(filteredAppointments);
      createAppointmentsChartFromData(filteredAppointments);
      createStatusChartFromData(filteredAppointments);
    }

    if (reportType === "inventory" || reportType === "all") {
      renderInventoryFromData(filteredInventory);
      createInventoryChartFromData(filteredInventory);
    }

    // Update stats with filtered data
    updateStatsFromData(filteredAppointments, filteredInventory);

    showSuccess("Reports generated successfully");
  } catch (error) {
    console.error("Error generating reports:", error);
    showError("Error generating reports");
  }
}

// Update stats from filtered data
function updateStatsFromData(filteredAppointments, filteredInventory) {
  const totalAppointments = filteredAppointments.length;
  const totalPatients = new Set(
    filteredAppointments.map((apt) => apt.user_name)
  ).size;
  const inventoryValue = filteredInventory.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const totalAppEl = document.getElementById("totalAppointments");
  const inventoryEl = document.getElementById("inventoryValue");
  const totalPatientsEl = document.getElementById("totalPatients");

  if (totalAppEl) totalAppEl.textContent = totalAppointments;
  if (inventoryEl) inventoryEl.textContent = inventoryValue;
  if (totalPatientsEl) totalPatientsEl.textContent = totalPatients;
}

// Render functions from filtered data
function renderAppointmentsFromData(data) {
  const tbody = document.getElementById("appointmentsTableBody");
  if (!tbody) return;

  tbody.innerHTML = data
    .map(
      (a) => `
    <tr>
      <td class="p-3">${a.user_name || "—"}</td>
      <td class="p-3">${a.date || "—"}</td>
      <td class="p-3">${a.time || "—"}</td>
      <td class="p-3">${a.status || "—"}</td>
      <td class="p-3">${a.symptoms || "—"}</td>
    </tr>
  `
    )
    .join("");
}

function renderInventoryFromData(data) {
  const tbody = document.getElementById("inventoryTableBody");
  if (!tbody) return;

  tbody.innerHTML = data
    .map(
      (i) => `
    <tr>
      <td class="p-3">${i.item_name || "—"}</td>
      <td class="p-3">${i.quantity || "0"}</td>
      <td class="p-3">${i.expiry_date || "—"}</td>
      <td class="p-3">${i.category || "—"}</td>
      <td class="p-3">${i.created_at?.split("T")[0] || "—"}</td>
    </tr>
  `
    )
    .join("");
}

// Chart generation from filtered data
function createAppointmentsChartFromData(data) {
  const ctx = document.getElementById("appointmentsChart");
  if (!ctx) return;

  if (charts.appointments) charts.appointments.destroy();

  const grouped = {};
  data.forEach((apt) => {
    if (apt.date) {
      grouped[apt.date] = (grouped[apt.date] || 0) + 1;
    }
  });

  const labels = Object.keys(grouped).sort();
  const counts = labels.map((d) => grouped[d]);

  charts.appointments = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Appointments",
          data: counts,
          borderColor: "#1e3a8a",
          fill: true,
          backgroundColor: "rgba(30, 58, 138, 0.2)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function createStatusChartFromData(data) {
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  if (charts.status) charts.status.destroy();

  const counts = data.reduce((acc, cur) => {
    if (cur.status) {
      acc[cur.status] = (acc[cur.status] || 0) + 1;
    }
    return acc;
  }, {});

  charts.status = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: [
            "#3b82f6",
            "#22c55e",
            "#f97316",
            "#ef4444",
            "#a855f7",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function createInventoryChartFromData(data) {
  const ctx = document.getElementById("inventoryChart");
  if (!ctx) return;

  if (charts.inventory) charts.inventory.destroy();

  const total = data.length;
  const low = data.filter((i) => i.quantity <= (i.stock_limit || 0)).length;
  const normal = total - low;

  charts.inventory = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Low Stock", "Normal Stock"],
      datasets: [
        {
          data: [low, normal],
          backgroundColor: ["#f43f5e", "#16a34a"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              return `${label}: ${value} item${value !== 1 ? "s" : ""}`;
            },
          },
        },
      },
    },
  });
}

// Main initialization function
async function initializeDashboard() {
  try {
    console.log("Initializing dashboard...");

    initializeDates();

    // Fetch data from backend (with mock data fallback)
    await fetchAppointments();
    await fetchInventory();

    console.log("Data loaded:", {
      appointments: appointments.length,
      inventory: inventory.length,
    });

    // Update UI
    updateStats();
    populateAppointmentsTable();
    populateInventoryTable();

    // Create charts
    await loadAndRenderDiagnosisChart();
    createAppointmentsChart();
    createStatusChart();
    createInventoryChart();

    console.log("Dashboard initialized successfully");
    showSuccess("Dashboard loaded successfully");
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    showError("Error loading dashboard data");
  }
}

// Make functions globally available
window.exportToPDF = exportToPDF;
window.exportToCSV = exportToCSV;
window.generateReports = generateReports;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing dashboard...");
  initializeDashboard();
});
