// Sample expense data (would normally come from a database)
const expenses = [
  {
    id: 1,
    date: "2025-05-10",
    description: "Grocery shopping",
    category: "food",
    amount: 85.47,
  },
  {
    id: 2,
    date: "2025-05-08",
    description: "Monthly rent payment",
    category: "housing",
    amount: 1200.0,
  },
  {
    id: 3,
    date: "2025-05-03",
    description: "Gas station",
    category: "transportation",
    amount: 45.23,
  },
  {
    id: 4,
    date: "2025-05-01",
    description: "Dinner at restaurant",
    category: "food",
    amount: 65.89,
  },
  {
    id: 5,
    date: "2025-04-28",
    description: "Internet bill",
    category: "utilities",
    amount: 79.99,
  },
  {
    id: 6,
    date: "2025-04-25",
    description: "Movie tickets",
    category: "entertainment",
    amount: 32.5,
  },
  {
    id: 7,
    date: "2025-04-20",
    description: "Pharmacy",
    category: "health",
    amount: 43.75,
  },
  {
    id: 8,
    date: "2025-04-18",
    description: "Clothing store",
    category: "shopping",
    amount: 128.95,
  },
  {
    id: 9,
    date: "2025-04-15",
    description: "Electricity bill",
    category: "utilities",
    amount: 112.34,
  },
  {
    id: 10,
    date: "2025-04-10",
    description: "Coffee shop",
    category: "food",
    amount: 12.45,
  },
  {
    id: 11,
    date: "2025-04-05",
    description: "Gym membership",
    category: "fitness",
    amount: 50.0,
  },
  {
    id: 12,
    date: "2025-04-01",
    description: "Office supplies",
    category: "work",
    amount: 35.78,
  },
  {
    id: 13,
    date: "2025-03-28",
    description: "Phone bill",
    category: "utilities",
    amount: 89.99,
  },
  {
    id: 14,
    date: "2025-03-25",
    description: "Books",
    category: "education",
    amount: 48.32,
  },
  {
    id: 15,
    date: "2025-03-20",
    description: "Car maintenance",
    category: "transportation",
    amount: 230.0,
  },
  {
    id: 16,
    date: "2025-03-15",
    description: "Streaming service",
    category: "entertainment",
    amount: 14.99,
  },
  {
    id: 17,
    date: "2025-03-10",
    description: "Lunch at work",
    category: "food",
    amount: 11.5,
  },
  {
    id: 18,
    date: "2025-03-05",
    description: "Public transit card",
    category: "transportation",
    amount: 75.0,
  },
  {
    id: 19,
    date: "2025-03-01",
    description: "Home insurance",
    category: "insurance",
    amount: 145.5,
  },
  {
    id: 20,
    date: "2025-02-28",
    description: "Pet supplies",
    category: "pets",
    amount: 67.8,
  },
];

// Sort expenses by date (ascending order by default)
expenses.sort((a, b) => new Date(a.date) - new Date(b.date));

// Constants
const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let filteredExpenses = [...expenses];

// DOM elements
const expensesTable = document.getElementById("expenses-data");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const dateFromInput = document.getElementById("date-from");
const dateToInput = document.getElementById("date-to");
const resetButton = document.getElementById("reset-filters");
const paginationDiv = document.getElementById("pagination");
const noResultsDiv = document.getElementById("no-results");
const totalAmountDiv = document.getElementById("total-amount");
const transactionCountDiv = document.getElementById("transaction-count");
const averageExpenseDiv = document.getElementById("average-expense");

// Populate category dropdown
function populateCategories() {
  const categories = [...new Set(expenses.map((expense) => expense.category))];
  categories.sort();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categorySelect.appendChild(option);
  });
}

// Format currency
function formatCurrency(amount) {
  return "$" + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Filter expenses based on search criteria
function filterExpenses() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categorySelect.value;
  const dateFrom = dateFromInput.value ? new Date(dateFromInput.value) : null;
  const dateTo = dateToInput.value ? new Date(dateToInput.value) : null;

  filteredExpenses = expenses.filter((expense) => {
    // Search term filter
    const matchesSearch =
      !searchTerm ||
      expense.description.toLowerCase().includes(searchTerm) ||
      expense.category.toLowerCase().includes(searchTerm);

    // Category filter
    const matchesCategory = !category || expense.category === category;

    // Date range filter
    const expenseDate = new Date(expense.date);
    const matchesDateFrom = !dateFrom || expenseDate >= dateFrom;
    const matchesDateTo = !dateTo || expenseDate <= dateTo;

    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  // Keep sort by date ascending
  filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Reset to first page and update display
  currentPage = 1;
  updateStatistics();
  renderExpenses();
  renderPagination();
}

// Update statistics
function updateStatistics() {
  const total = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const count = filteredExpenses.length;
  const average = count > 0 ? total / count : 0;

  totalAmountDiv.textContent = formatCurrency(total);
  transactionCountDiv.textContent = count;
  averageExpenseDiv.textContent = formatCurrency(average);
}

// Render expenses table
function renderExpenses() {
  expensesTable.innerHTML = "";

  if (filteredExpenses.length === 0) {
    noResultsDiv.style.display = "block";
    return;
  }

  noResultsDiv.style.display = "none";

  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Create rows
  paginatedExpenses.forEach((expense) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.className = "expense-date";
    dateCell.textContent = formatDate(expense.date);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = expense.description;

    const categoryCell = document.createElement("td");
    categoryCell.className = "expense-category";
    categoryCell.textContent = expense.category;

    const amountCell = document.createElement("td");
    amountCell.className = "amount";
    amountCell.textContent = formatCurrency(expense.amount);

    row.appendChild(dateCell);
    row.appendChild(descriptionCell);
    row.appendChild(categoryCell);
    row.appendChild(amountCell);

    expensesTable.appendChild(row);
  });
}

// Render pagination
function renderPagination() {
  paginationDiv.innerHTML = "";

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);

  if (totalPages <= 1) {
    return;
  }

  // Create "Previous" button
  const prevButton = document.createElement("button");
  prevButton.textContent = "←";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderExpenses();
      renderPagination();
    }
  });
  paginationDiv.appendChild(prevButton);

  // Create page number buttons
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.className = i === currentPage ? "active" : "";
    pageButton.addEventListener("click", () => {
      currentPage = i;
      renderExpenses();
      renderPagination();
    });
    paginationDiv.appendChild(pageButton);
  }

  // Create "Next" button
  const nextButton = document.createElement("button");
  nextButton.textContent = "→";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderExpenses();
      renderPagination();
    }
  });
  paginationDiv.appendChild(nextButton);
}

// Reset filters
function resetFilters() {
  searchInput.value = "";
  categorySelect.value = "";
  dateFromInput.value = "";
  dateToInput.value = "";

  filteredExpenses = [...expenses];
  currentPage = 1;

  updateStatistics();
  renderExpenses();
  renderPagination();
}

// Initialize
populateCategories();
updateStatistics();
renderExpenses();
renderPagination();

// Event listeners
searchInput.addEventListener("input", filterExpenses);
categorySelect.addEventListener("change", filterExpenses);
dateFromInput.addEventListener("change", filterExpenses);
dateToInput.addEventListener("change", filterExpenses);
resetButton.addEventListener("click", resetFilters);
