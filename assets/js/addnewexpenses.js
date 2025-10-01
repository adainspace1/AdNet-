// Bar Chart
const barCtx = document.getElementById("barChart").getContext("2d");
const barChart = new Chart(barCtx, {
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

// Line Chart
const lineCtx = document.getElementById("lineChart").getContext("2d");
const lineChart = new Chart(lineCtx, {
  type: "line",
  data: {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Monthly Expense",
        data: [650, 590, 800, 810, 1200, 1100, 900, 750, 720, 780, 890, 700],
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        borderColor: "#007bff",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
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

// Get modal elements
const modal = document.getElementById("expenseForm");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelExpense");
const saveBtn = document.getElementById("saveExpense");
const expenseForm = document.getElementById("expenseForm");

// Open modal when Add Expense button is clicked
addExpenseBtn.addEventListener("click", () => {
  modal.style.display = "flex";
  // Set today's date as default
  document.getElementById("expenseDate").valueAsDate = new Date();
});

// Close modal functions
function closeModal() {
  modal.style.display = "none";
  expenseForm.reset();
}

// Close modal when X button is clicked
closeModalBtn.addEventListener("click", closeModal);

// Close modal when Cancel button is clicked
cancelBtn.addEventListener("click", closeModal);

// Close modal when clicking outside the modal content
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Handle form submission
saveBtn.addEventListener("click", () => {
  // Check if form is valid
  if (!expenseForm.checkValidity()) {
    expenseForm.reportValidity();
    return;
  }

  // Get form values
  const description = document.getElementById("expenseDescription").value;
  const amount = document.getElementById("expenseAmount").value;
  const category = document.getElementById("expenseCategory").value;
  const date = document.getElementById("expenseDate").value;

  // Format date for display (YYYY/MM/DD)
  const formattedDate = date.replace(/-/g, "/");

  // Create new table row
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
        <td>${formattedDate}</td>
        <td>${description}</td>
        <td>${category}</td>
        <td>$${parseFloat(amount).toFixed(2)}</td>
        <td><span class="status pending">Pending</span></td>
    `;

  // Add new row to the top of the table
  const tableBody = document.querySelector("tbody");
  tableBody.insertBefore(newRow, tableBody.firstChild);

  // Update total expenses
  updateTotals(parseFloat(amount));

  // Close modal
  closeModal();
});

// Function to update totals
function updateTotals(amount) {
  // Update total expenses
  const totalExpensesElement = document.querySelector(
    ".summary-card:first-child .amount"
  );
  const currentTotal = parseFloat(
    totalExpensesElement.textContent.replace("$", "")
  );
  totalExpensesElement.textContent = `$${(currentTotal + amount).toFixed(2)}`;

  // Update total transactions
  const totalTransactionsElement = document.querySelector(
    ".summary-card:nth-child(3) .amount"
  );
  const currentTransactions = parseInt(totalTransactionsElement.textContent);
  totalTransactionsElement.textContent = currentTransactions + 1;
}
