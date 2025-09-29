// =========================
// Bar Chart (Static Categories)
// =========================
function renderBarChart() {
  const barCtx = document.getElementById("barChart").getContext("2d");

  // ✅ Prevent duplication if chart already exists
  if (barCtx.chart) {
    barCtx.chart.destroy();
  }

  barCtx.chart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: [
        "Supplies",
        "Transport",
        "Software",
        "Marketing",
        "Events",
        "Services",
        "Testing",
      ],
      datasets: [
        {
          label: "Expenses by Category",
          data: [302.75, 110.0, 299.97, 454.99, 465.75, 450.0, 85.0],
          backgroundColor: "#007bff",
          borderColor: "#007bff",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            drawBorder: false,
          },
        },
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
        },
      },
    },
  });
}

// =========================
// Line Chart (Monthly)
// =========================
function renderLineChart() {
  const lineCtx = document.getElementById("lineChart").getContext("2d");

  // ✅ Prevent duplication if chart already exists
  if (lineCtx.chart) {
    lineCtx.chart.destroy();
  }

  lineCtx.chart = new Chart(lineCtx, {
    type: "bar",
    data: {
      labels: [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec",
      ],
      datasets: [
        {
          label: "Monthly Expense",
          data: [650, 590, 800, 810, 1200, 1100, 900, 750, 720, 780, 890, 700],
          backgroundColor: "rgba(0, 123, 255, 0.7)",
          borderColor: "#007bff",
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "#031224",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "#007bff",
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { display: true, drawBorder: false },
          ticks: { color: "#495057" },
        },
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: "#495057" },
        },
      },
      animation: {
        duration: 1500,
        easing: "easeOutBounce",
      },
    },
  });
}

// ✅ Initialize charts once
renderBarChart();
renderLineChart();


// =========================
// Modal + Expense Form
// =========================
const modal = document.getElementById("expenseForm");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelExpense");
const saveBtn = document.getElementById("saveExpense");
const expenseForm = document.getElementById("expenseForm");

// Open modal
addExpenseBtn.addEventListener("click", () => {
  modal.style.display = "flex";
  document.getElementById("expenseDate").valueAsDate = new Date();
});

// Close modal functions
function closeModal() {
  modal.style.display = "none";
  expenseForm.reset();
}

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Handle form submission
saveBtn.addEventListener("click", () => {
  if (!expenseForm.checkValidity()) {
    expenseForm.reportValidity();
    return;
  }

  const description = document.getElementById("expenseDescription").value;
  const amount = document.getElementById("expenseAmount").value;
  const category = document.getElementById("expenseCategory").value;
  const date = document.getElementById("expenseDate").value;

  const formattedDate = date.replace(/-/g, "/");

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
        <td>${formattedDate}</td>
        <td>${description}</td>
        <td>${category}</td>
        <td>$${parseFloat(amount).toFixed(2)}</td>
        <td><span class="status pending">Pending</span></td>
    `;

  const tableBody = document.querySelector("tbody");
  tableBody.insertBefore(newRow, tableBody.firstChild);

  updateTotals(parseFloat(amount));

  closeModal();
});

// Update totals
function updateTotals(amount) {
  const totalExpensesElement = document.querySelector(
    ".summary-card:first-child .amount"
  );
  const currentTotal = parseFloat(
    totalExpensesElement.textContent.replace("$", "")
  );
  totalExpensesElement.textContent = `$${(currentTotal + amount).toFixed(2)}`;

  const totalTransactionsElement = document.querySelector(
    ".summary-card:nth-child(3) .amount"
  );
  const currentTransactions = parseInt(totalTransactionsElement.textContent);
  totalTransactionsElement.textContent = currentTransactions + 1;
}
