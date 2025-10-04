document.addEventListener("DOMContentLoaded", async () => {
  async function loadChartData() {
    try {
      console.log("📊 Fetching chart data...");
      const res = await fetch("/api/expenses/chart-data");
      console.log("🌐 Response status:", res.status);
      const data = await res.json();
      console.log("📦 Chart data received:", data);

      if (!data.categoryLabels) {
        console.warn("⚠️ No category labels found");
        return;
      }

      // 🟦 BAR CHART — Expenses by Category
      const barCtx = document.getElementById("barChart").getContext("2d");
      if (window.barChart && typeof window.barChart.destroy === "function") {
        console.log("🧹 Destroying previous bar chart");
        window.barChart.destroy();
      }
      window.barChart = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: data.categoryLabels,
          datasets: [
            {
              label: "Expenses by Category",
              data: data.categoryData,
              backgroundColor: "#007bff",
              borderColor: "#007bff",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true },
            x: { grid: { display: false } },
          },
        },
      });
      console.log("✅ Bar chart rendered");

      // 🟩 LINE CHART — Monthly Expenses
      const lineCtx = document.getElementById("lineChart").getContext("2d");
      if (window.lineChart && typeof window.lineChart.destroy === "function") {
        console.log("🧹 Destroying previous line chart");
        window.lineChart.destroy();
      }
      window.lineChart = new Chart(lineCtx, {
        type: "line",
        data: {
          labels: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
          ],
          datasets: [
            {
              label: "Monthly Expenses",
              data: data.monthlyData,
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
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true },
            x: { grid: { display: false } },
          },
        },
      });
      console.log("✅ Line chart rendered");
    } catch (err) {
      console.error("❌ Failed to load chart data:", err);
    }
  }

  await loadChartData();
});


// Get modal elements
const modal = document.getElementById("expenseForm");
const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelExpense");
const saveBtn = document.getElementById("saveExpense");

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
