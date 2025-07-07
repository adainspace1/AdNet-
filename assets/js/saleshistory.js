// Sample data for demonstration

let filteredData = [...sampleData];
let currentPage = 1;
const rowsPerPage = 10;
let salesChart = null;

// DOM elements
const salesTableBody = document.getElementById("sales-table-body");
const pagination = document.getElementById("pagination");
const applyFiltersBtn = document.getElementById("apply-filters");
const resetFiltersBtn = document.getElementById("reset-filters");
const exportCsvBtn = document.getElementById("export-csv");
const uploadBtn = document.getElementById("upload-btn");
const fileUpload = document.getElementById("file-upload");
const chartType = document.getElementById("chart-type");

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
  // Set default date values (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  document.getElementById("date-to").value = formatDateForInput(today);
  document.getElementById("date-from").value =
    formatDateForInput(thirtyDaysAgo);

  // Initialize data
  refreshData();

  // Set up event listeners
  applyFiltersBtn.addEventListener("click", applyFilters);
  resetFiltersBtn.addEventListener("click", resetFilters);
  exportCsvBtn.addEventListener("click", exportToCsv);
  chartType.addEventListener("change", updateChart);

  uploadBtn.addEventListener("click", function () {
    fileUpload.click();
  });

  fileUpload.addEventListener("change", function (e) {
    if (e.target.files.length) {
      const file = e.target.files[0];
      if (file.name.endsWith(".csv")) {
        parseCSV(file);
      } else if (file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
        alert("Excel support requires additional libraries.");
      }
    }
  });
});

// Apply filters to the data
function applyFilters() {
  const dateFrom = document.getElementById("date-from").value;
  const dateTo = document.getElementById("date-to").value;
  const category = document.getElementById("category-filter").value;
  const rep = document.getElementById("rep-filter").value;
  const customer = document
    .getElementById("customer-search")
    .value.toLowerCase();
  const minAmount =
    parseFloat(document.getElementById("min-amount").value) || 0;
  const maxAmount =
    parseFloat(document.getElementById("max-amount").value) ||
    Number.MAX_SAFE_INTEGER;

  filteredData = sampleData.filter((sale) => {
    // Date filter
    const saleDate = new Date(sale.date);
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
    const toDate = dateTo ? new Date(dateTo) : new Date();
    toDate.setHours(23, 59, 59, 999); // End of the day

    const dateMatch = saleDate >= fromDate && saleDate <= toDate;

    // Other filters
    const categoryMatch =
      !category || sale.category.toLowerCase().includes(category.toLowerCase());
    const repMatch =
      !rep || sale.salesRep.toLowerCase().includes(rep.toLowerCase());
    const customerMatch =
      !customer || sale.customer.toLowerCase().includes(customer);
    const amountMatch = sale.amount >= minAmount && sale.amount <= maxAmount;

    return (
      dateMatch && categoryMatch && repMatch && customerMatch && amountMatch
    );
  });

  currentPage = 1;
  refreshData();
}

// Reset all filters
function resetFilters() {
  document.getElementById("date-from").value = "";
  document.getElementById("date-to").value = "";
  document.getElementById("category-filter").value = "";
  document.getElementById("rep-filter").value = "";
  document.getElementById("customer-search").value = "";
  document.getElementById("min-amount").value = "";
  document.getElementById("max-amount").value = "";

  filteredData = [...sampleData];
  currentPage = 1;
  refreshData();
}

// Refresh data display
function refreshData() {
  displayTable();
  displayPagination();
  updateSummary();
  updateChart();
}

// Display table data
function displayTable() {
  salesTableBody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, filteredData.length);

  for (let i = start; i < end; i++) {
    const sale = filteredData[i];
    const row = document.createElement("tr");

    row.innerHTML = `
                    <td>${sale.orderId}</td>
                    <td>${formatDate(sale.date)}</td>
                    <td>${sale.customer}</td>
                    <td>${sale.product}</td>
                    <td>${sale.category}</td>
                    <td>${sale.salesRep}</td>
                    <td>$${sale.amount.toFixed(2)}</td>
                    <td>${getStatusBadge(sale.status)}</td>
                `;

    salesTableBody.appendChild(row);
  }
}

// Format status with appropriate styling
function getStatusBadge(status) {
  const colors = {
    Completed: "background-color: #d1fae5; color: #065f46",
    Pending: "background-color: #fef3c7; color: #92400e",
    Processing: "background-color: #dbeafe; color: #1e40af",
    Shipped: "background-color: #e0e7ff; color: #3730a3",
  };

  const style = colors[status] || "background-color: #f3f4f6; color: #1f2937";
  return `<span style="${style}; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">${status}</span>`;
}

// Display pagination controls
function displayPagination() {
  pagination.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "&laquo;";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      refreshData();
    }
  });
  pagination.appendChild(prevButton);

  // Page buttons
  const maxButtons = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.toggle("active", i === currentPage);
    pageButton.addEventListener("click", () => {
      currentPage = i;
      refreshData();
    });
    pagination.appendChild(pageButton);
  }

  // Next button
  const nextButton = document.createElement("button");
  nextButton.innerHTML = "&raquo;";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      refreshData();
    }
  });
  pagination.appendChild(nextButton);
}

// Update summary statistics
function updateSummary() {
  const totalSales = filteredData.reduce((sum, sale) => sum + sale.amount, 0);
  const orderCount = filteredData.length;
  const avgValue = orderCount > 0 ? totalSales / orderCount : 0;

  // Calculate top category
  const categoryCounts = {};
  filteredData.forEach((sale) => {
    categoryCounts[sale.category] = (categoryCounts[sale.category] || 0) + 1;
  });

  let topCategory = "-";
  let maxCount = 0;

  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topCategory = category;
    }
  }

  document.getElementById("total-sales").textContent = `$${totalSales.toFixed(
    2
  )}`;
  document.getElementById("order-count").textContent = orderCount;
  document.getElementById("avg-value").textContent = `$${avgValue.toFixed(2)}`;
  document.getElementById("top-category").textContent = topCategory;
}

// Update the chart
function updateChart() {
  const ctx = document.getElementById("sales-chart").getContext("2d");
  const type = document.getElementById("chart-type").value;

  // Group data by the selected time period
  const groupedData = {};

  filteredData.forEach((sale) => {
    const date = new Date(sale.date);
    let key;

    if (type === "monthly") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    } else if (type === "quarterly") {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      key = `${date.getFullYear()}-Q${quarter}`;
    } else {
      // yearly
      key = `${date.getFullYear()}`;
    }

    if (!groupedData[key]) {
      groupedData[key] = {
        sales: 0,
        orders: 0,
      };
    }

    groupedData[key].sales += sale.amount;
    groupedData[key].orders += 1;
  });

  // Format labels and prepare datasets
  const sortedKeys = Object.keys(groupedData).sort();
  const labels = sortedKeys.map((key) => {
    if (type === "monthly") {
      const [year, month] = key.split("-");
      const date = new Date(year, parseInt(month) - 1, 1);
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } else if (type === "quarterly") {
      return key; // Already formatted as YYYY-QN
    } else {
      return key; // Just year
    }
  });

  const salesData = sortedKeys.map((key) => groupedData[key].sales);
  const orderData = sortedKeys.map((key) => groupedData[key].orders);

  // Destroy previous chart if it exists
  if (salesChart) {
    salesChart.destroy();
  }

  // Create new chart
  salesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Sales Amount ($)",
          data: salesData,
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          label: "Number of Orders",
          data: orderData,
          type: "line",
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 2,
          tension: 0.1,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: {
            display: true,
            text: "Sales Amount ($)",
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: "Number of Orders",
          },
        },
      },
    },
  });
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

// Export data to CSV
function exportToCsv() {
  // Create CSV content
  let csvContent =
    "Order ID,Date,Customer,Product,Category,Sales Rep,Amount,Status\n";

  filteredData.forEach((sale) => {
    csvContent +=
      [
        sale.orderId,
        sale.date,
        `"${sale.customer}"`,
        `"${sale.product}"`,
        sale.category,
        `"${sale.salesRep}"`,
        sale.amount,
        sale.status,
      ].join(",") + "\n";
  });

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute("download", "sales_history.csv");
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Parse CSV file
function parseCSV(file) {
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function (results) {
      if (results.data && results.data.length > 0) {
        // Check if CSV has the expected structure
        const firstRow = results.data[0];
        const requiredFields = [
          "orderId",
          "date",
          "customer",
          "product",
          "category",
          "salesRep",
          "amount",
          "status",
        ];
        const hasRequiredFields = requiredFields.every((field) =>
          Object.keys(firstRow).find(
            (key) =>
              key.toLowerCase().replace(/[^a-z0-9]/g, "") ===
              field.toLowerCase()
          )
        );

        if (hasRequiredFields) {
          // Map CSV data to our data structure
          const mappedData = results.data.map((row) => {
            // Find the actual field names in the CSV that match our required fields
            const fieldMap = {};
            for (const reqField of requiredFields) {
              const actualField = Object.keys(row).find(
                (key) =>
                  key.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                  reqField.toLowerCase()
              );
              if (actualField) {
                fieldMap[reqField] = actualField;
              }
            }

            return {
              orderId: row[fieldMap.orderId] || "",
              date: row[fieldMap.date] || "",
              customer: row[fieldMap.customer] || "",
              product: row[fieldMap.product] || "",
              category: row[fieldMap.category] || "",
              salesRep: row[fieldMap.salesRep] || "",
              amount: parseFloat(row[fieldMap.amount]) || 0,
              status: row[fieldMap.status] || "Completed",
            };
          });

          // Replace sample data with imported data
          filteredData = mappedData;
          sampleData.length = 0;
          sampleData.push(...mappedData);

          // Update the UI
          refreshData();
          alert(`Successfully imported ${mappedData.length} sales records.`);
        } else {
          alert(
            "CSV file format is not compatible. Please ensure it contains the required columns."
          );
        }
      } else {
        alert("No data found in the CSV file.");
      }
    },
    error: function (error) {
      console.error("Error parsing CSV:", error);
      alert("Error parsing CSV file. Please check the format and try again.");
    },
  });
}
