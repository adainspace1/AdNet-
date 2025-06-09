// Transaction Management
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editIndex = -1;

// Add or update transaction
function addOrUpdateTransaction() {
  let itemName = document.getElementById("itemName").value;
  let purchasePrice = parseFloat(
    document.getElementById("purchasePrice").value
  );
  let sellingPrice = parseFloat(document.getElementById("sellingPrice").value);
  let quantity = parseInt(document.getElementById("quantity").value);

  if (
    !itemName ||
    isNaN(purchasePrice) ||
    isNaN(sellingPrice) ||
    isNaN(quantity)
  ) {
    alert("Please fill all fields correctly.");
    return;
  }

  let totalCost = purchasePrice * quantity;
  let totalRevenue = sellingPrice * quantity;
  let profitLoss = totalRevenue - totalCost;
  let timestamp = new Date().toLocaleString();

  if (editIndex === -1) {
    transactions.push({
      itemName,
      purchasePrice,
      sellingPrice,
      quantity,
      totalCost,
      totalRevenue,
      profitLoss,
      timestamp,
    });
  } else {
    transactions[editIndex] = {
      itemName,
      purchasePrice,
      sellingPrice,
      quantity,
      totalCost,
      totalRevenue,
      profitLoss,
      timestamp,
    };
    editIndex = -1;
    document.getElementById("addUpdateBtn").innerText = "Add Transaction";
  }

  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateTable();
  clearForm();
}

// Update transactions table
function updateTable() {
  let tableBody = document.getElementById("transactionTable");
  tableBody.innerHTML = "";
  let totalRevenue = 0,
    totalCost = 0;

  transactions.forEach((t, index) => {
    totalRevenue += t.totalRevenue;
    totalCost += t.totalCost;

    let row = `<tr>
            <td>${t.itemName}</td>
            <td>${t.purchasePrice}</td>
            <td>${t.sellingPrice}</td>
            <td>${t.quantity}</td>
            <td>${t.totalCost}</td>
            <td>${t.totalRevenue}</td>
            <td style="color: ${
              t.profitLoss >= 0 ? "green" : "red"
            }; font-weight: bold;">${t.profitLoss}</td>
            <td>${t.timestamp}</td>
            <td>
                <button onclick="editTransaction(${index})" style="background-color: #007bff; color: white;">Edit</button>
                <button onclick="deleteTransaction(${index})" style="background-color: #dc3545; color: white;">Del</button>
            </td>
        </tr>`;
    tableBody.innerHTML += row;
  });

  document.getElementById("totalRevenue").innerText = totalRevenue;
  document.getElementById("totalCost").innerText = totalCost;
  document.getElementById("grossProfit").innerText = totalRevenue - totalCost;
}

// Delete transaction
function deleteTransaction(index) {
  transactions.splice(index, 1);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateTable();
}

// Edit transaction
function editTransaction(index) {
  let t = transactions[index];
  document.getElementById("itemName").value = t.itemName;
  document.getElementById("purchasePrice").value = t.purchasePrice;
  document.getElementById("sellingPrice").value = t.sellingPrice;
  document.getElementById("quantity").value = t.quantity;

  editIndex = index;
  document.getElementById("addUpdateBtn").innerText = "Update Transaction";
}

// Clear all transactions
function clearTransactions() {
  if (confirm("Are you sure you want to delete all transactions?")) {
    transactions = [];
    localStorage.removeItem("transactions");
    updateTable();
  }
}

// Export transactions to CSV
function exportToCSV() {
  if (transactions.length === 0) {
    alert("No transactions to export.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent +=
    "Item,Purchase Price,Selling Price,Quantity,Total Cost,Total Revenue,Profit/Loss,Timestamp\n";

  transactions.forEach((t) => {
    csvContent += `${t.itemName},${t.purchasePrice},${t.sellingPrice},${t.quantity},${t.totalCost},${t.totalRevenue},${t.profitLoss},${t.timestamp}\n`;
  });

  let encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "transaction_records.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Clear form inputs
function clearForm() {
  document.getElementById("itemName").value = "";
  document.getElementById("purchasePrice").value = "";
  document.getElementById("sellingPrice").value = "";
  document.getElementById("quantity").value = "";
}

// Toggle notification dropdown
function toggleNotificationDropdown() {
  const dropdown = document.getElementById("notificationDropdown");
  dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
}

// Toggle profile dropdown
function toggleDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
}

// Close dropdowns when clicking outside
document.addEventListener("click", function (e) {
  const notificationDropdown = document.getElementById("notificationDropdown");
  const notification = document.querySelector(".notification");
  const profileDropdown = document.getElementById("profileDropdown");
  const profile = document.querySelector(".profile");

  if (!notification.contains(e.target)) {
    notificationDropdown.style.display = "none";
  }

  if (!profile.contains(e.target)) {
    profileDropdown.style.display = "none";
  }
});

// Initialize table on page load
document.addEventListener("DOMContentLoaded", function () {
  updateTable();

  // Setup chart (placeholder for Chart.js implementation)
  const ctx = document.querySelector(".activity-chart").getContext("2d");
  // Here you can add your Chart.js implementation
  // Example:
  /*
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Activity',
                data: [65, 59, 80, 81, 56, 55, 40],
                borderColor: '#007bff',
                tension: 0.1
            }]
        }
    });
    */
});




function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(sec => sec.style.display = 'none'); // Hide all
  document.getElementById(sectionId).style.display = 'block'; // Show selected
}


function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(sec => sec.style.display = 'none');
  document.getElementById(sectionId).style.display = 'block';

  const buttons = document.querySelectorAll("nav button");
  buttons.forEach(btn => btn.classList.remove("active-tab"));
  const clickedButton = [...buttons].find(btn =>
    btn.getAttribute("onclick").includes(sectionId)
  );
  if (clickedButton) clickedButton.classList.add("active-tab");
}
