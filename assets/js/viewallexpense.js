
  function formatShort(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toFixed(2);
  }

  async function loadExpenseSummary() {
    try {
      const res = await fetch('/api/expenses/summary');
      const data = await res.json();

      document.getElementById("total-amount").textContent = "₦" + formatShort(data.totalAmount);
      document.getElementById("transaction-count").textContent = formatShort(data.totalTransactions);
      document.getElementById("average-expense").textContent = "₦" + formatShort(data.averageExpense);
    } catch (err) {
      console.error("Error loading expenses summary:", err);
    }
  }

  loadExpenseSummary();

let allExpenses = []; // to be populated from server or API
let filteredExpenses = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const dateFromInput = document.getElementById("date-from");
const dateToInput = document.getElementById("date-to");
const resetBtn = document.getElementById("reset-filters");
const tbody = document.getElementById("expenses-data");
const noResults = document.getElementById("no-results");
const paginationDiv = document.getElementById("pagination");

function loadExpenses() {
  // Fetch from backend or pass through EJS
  fetch("/api/expenses/all") // You must create this route
    .then(res => res.json())
    .then(data => {
      allExpenses = data.expenses;
      populateCategoryOptions();
      applyFilters();
    })
    .catch(err => console.error("Error loading expenses:", err));
}

function populateCategoryOptions() {
  const categories = [...new Set(allExpenses.map(e => e.category))];
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const selectedCategory = categorySelect.value;
  const dateFrom = dateFromInput.value ? new Date(dateFromInput.value) : null;
  const dateTo = dateToInput.value ? new Date(dateToInput.value) : null;

  filteredExpenses = allExpenses.filter(exp => {
    const descMatch = exp.description.toLowerCase().includes(search);
    const catMatch = !selectedCategory || exp.category === selectedCategory;
    const dateMatch =
      (!dateFrom || new Date(exp.date) >= dateFrom) &&
      (!dateTo || new Date(exp.date) <= dateTo);
    return descMatch && catMatch && dateMatch;
  });

  currentPage = 1;
  renderExpenses();
  renderPagination();
}

function renderExpenses() {
  tbody.innerHTML = "";

  if (filteredExpenses.length === 0) {
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  paginated.forEach(exp => {
    const row = document.createElement("tr");

    const createdAt = new Date(exp.createdAt); // ✅ Convert string to Date
    const dateFormatted = createdAt.toLocaleDateString();

    row.innerHTML = `
      <td>${dateFormatted}</td>
      <td>${exp.description}</td>
      <td>${exp.category}</td>
      <td>₦${Number(exp.amount).toLocaleString()}</td>
    `;

    tbody.appendChild(row);
  });
}


function renderPagination() {
  paginationDiv.innerHTML = "";

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  if (totalPages <= 1) return;

  const createButton = (label, disabled, page) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener("click", () => {
      currentPage = page;
      renderExpenses();
      renderPagination();
    });
    return btn;
  };

  paginationDiv.appendChild(createButton("←", currentPage === 1, currentPage - 1));

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = i;
      renderExpenses();
      renderPagination();
    });
    paginationDiv.appendChild(btn);
  }

  paginationDiv.appendChild(createButton("→", currentPage === totalPages, currentPage + 1));
}

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  categorySelect.value = "";
  dateFromInput.value = "";
  dateToInput.value = "";
  applyFilters();
});

searchInput.addEventListener("input", applyFilters);
categorySelect.addEventListener("change", applyFilters);
dateFromInput.addEventListener("change", applyFilters);
dateToInput.addEventListener("change", applyFilters);

// Initialize
loadExpenses();