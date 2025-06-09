document.addEventListener("DOMContentLoaded", function () {
  // Initialize variables
  let salesData = JSON.parse(localStorage.getItem("salesData")) || [];
  let editingIndex = -1;
  const today = new Date().toISOString().split("T")[0];

  // Set today's date as default
  document.getElementById("saleDate").value = today;

  // Load existing sales data
  updateSalesTable();
  updateSummary();

  // Add event listeners
  document.getElementById("addSaleBtn").addEventListener("click", addSale);
  document.getElementById("resetFormBtn").addEventListener("click", resetForm);
  document
    .getElementById("searchInput")
    .addEventListener("input", filterSalesTable);
  document
    .getElementById("openSaleFormBtn")
    .addEventListener("click", openModal);

  // Modal functionality
  const modal = document.getElementById("saleFormModal");
  const closeModalBtn = document.querySelector(".close-modal");

  // Open modal function
  function openModal() {
    modal.style.display = "block";
    // If not in edit mode, reset form
    if (editingIndex === -1) {
      resetForm();
    }
  }

  // Close modal function
  function closeModal() {
    modal.style.display = "none";
  }

  // Close modal when clicking X
  closeModalBtn.addEventListener("click", closeModal);

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Function to add new sale
  function addSale() {
    const customerName = document.getElementById("customerName").value;
    const customerEmail = document.getElementById("customerEmail").value;
    const customerPhone = document.getElementById("customerPhone").value;
    const productName = document.getElementById("productName").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const unitPrice = parseFloat(document.getElementById("unitPrice").value);
    const saleDate = document.getElementById("saleDate").value;
    const paymentMethod = document.getElementById("paymentMethod").value;
    const status = document.getElementById("status").value;
    const notes = document.getElementById("notes").value;

    // Validate required fields
    if (
      !customerName ||
      !productName ||
      !quantity ||
      !unitPrice ||
      !saleDate ||
      !paymentMethod
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const saleRecord = {
      id: editingIndex >= 0 ? salesData[editingIndex].id : generateID(),
      customerName,
      customerEmail,
      customerPhone,
      productName,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      saleDate,
      paymentMethod,
      status,
      notes,
      timestamp: new Date().getTime(),
    };

    if (editingIndex >= 0) {
      // Update existing record
      salesData[editingIndex] = saleRecord;
      editingIndex = -1;
      document.getElementById("addSaleBtn").textContent = "Add Sale";
    } else {
      // Add new record
      salesData.push(saleRecord);
    }

    // Save to local storage
    localStorage.setItem("salesData", JSON.stringify(salesData));

    // Update UI
    updateSalesTable();
    updateSummary();
    resetForm();
    closeModal();
  }

  // Function to reset form
  function resetForm() {
    document.getElementById("customerName").value = "";
    document.getElementById("customerEmail").value = "";
    document.getElementById("customerPhone").value = "";
    document.getElementById("productName").value = "";
    document.getElementById("quantity").value = "1";
    document.getElementById("unitPrice").value = "";
    document.getElementById("saleDate").value = today;
    document.getElementById("paymentMethod").value = "";
    document.getElementById("status").value = "Completed";
    document.getElementById("notes").value = "";

    // Reset editing state
    editingIndex = -1;
    document.getElementById("addSaleBtn").textContent = "Add Sale";
  }

  // Function to generate a unique ID
  function generateID() {
    return "SALE-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  // Function to update sales table
  function updateSalesTable() {
    const tableBody = document.getElementById("salesTableBody");
    tableBody.innerHTML = "";

    if (salesData.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML =
        '<td colspan="10" style="text-align: center;">No sales records found</td>';
      tableBody.appendChild(row);
      return;
    }

    // Sort by date (newest first)
    salesData.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));

    salesData.forEach((sale, index) => {
      const row = document.createElement("tr");

      // Create status class
      let statusClass = "";
      if (sale.status === "Completed") statusClass = "status-completed";
      else if (sale.status === "Pending") statusClass = "status-pending";
      else if (sale.status === "Canceled") statusClass = "status-canceled";

      row.innerHTML = `
                        <td>${sale.id}</td>
                        <td>${formatDate(sale.saleDate)}</td>
                        <td>${sale.customerName}</td>
                        <td>${sale.productName}</td>
                        <td>${sale.quantity}</td>
                        <td>${sale.unitPrice.toFixed(2)}</td>
                        <td>${sale.total.toFixed(2)}</td>
                        <td><span class="status ${statusClass}">${
        sale.status
      }</span></td>
                        <td>${sale.paymentMethod}</td>
                        <td class="action-icons">
                            <span class="edit-icon" onclick="editSale(${index})"><i class="fas fa-edit"></i></span>
                            <span class="delete-icon" onclick="deleteSale(${index})"><i class="fas fa-trash"></i></span>
                        </td>
                    `;
      tableBody.appendChild(row);
    });
  }

  // Function to format date
  function formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  // Function to update summary
  function updateSummary() {
    const totalSalesCount = salesData.length;
    const totalRevenue = salesData.reduce((total, sale) => {
      return sale.status !== "Canceled" ? total + sale.total : total;
    }, 0);

    document.getElementById("totalSalesCount").textContent = totalSalesCount;
    document.getElementById(
      "totalRevenue"
    ).textContent = `$${totalRevenue.toFixed(2)}`;
  }

  // Function to filter sales table
  function filterSalesTable() {
    const searchTerm = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const tableBody = document.getElementById("salesTableBody");
    tableBody.innerHTML = "";

    const filteredData = salesData.filter((sale) => {
      return (
        sale.customerName.toLowerCase().includes(searchTerm) ||
        sale.productName.toLowerCase().includes(searchTerm) ||
        sale.id.toLowerCase().includes(searchTerm) ||
        sale.status.toLowerCase().includes(searchTerm) ||
        sale.paymentMethod.toLowerCase().includes(searchTerm)
      );
    });

    if (filteredData.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML =
        '<td colspan="10" style="text-align: center;">No matching records found</td>';
      tableBody.appendChild(row);
      return;
    }

    filteredData.forEach((sale, index) => {
      const row = document.createElement("tr");

      // Create status class
      let statusClass = "";
      if (sale.status === "Completed") statusClass = "status-completed";
      else if (sale.status === "Pending") statusClass = "status-pending";
      else if (sale.status === "Canceled") statusClass = "status-canceled";

      row.innerHTML = `
                        <td>${sale.id}</td>
                        <td>${formatDate(sale.saleDate)}</td>
                        <td>${sale.customerName}</td>
                        <td>${sale.productName}</td>
                        <td>${sale.quantity}</td>
                        <td>${sale.unitPrice.toFixed(2)}</td>
                        <td>${sale.total.toFixed(2)}</td>
                        <td><span class="status ${statusClass}">${
        sale.status
      }</span></td>
                        <td>${sale.paymentMethod}</td>
                        <td class="action-icons">
                            <span class="edit-icon" onclick="editSale(${salesData.indexOf(
                              sale
                            )})"><i class="fas fa-edit"></i></span>
                            <span class="delete-icon" onclick="deleteSale(${salesData.indexOf(
                              sale
                            )})"><i class="fas fa-trash"></span>
                        </td>
                    `;
      tableBody.appendChild(row);
    });
  }

  // Global functions for edit and delete (making them available to inline event handlers)
  window.editSale = function (index) {
    const sale = salesData[index];
    document.getElementById("customerName").value = sale.customerName;
    document.getElementById("customerEmail").value = sale.customerEmail || "";
    document.getElementById("customerPhone").value = sale.customerPhone || "";
    document.getElementById("productName").value = sale.productName;
    document.getElementById("quantity").value = sale.quantity;
    document.getElementById("unitPrice").value = sale.unitPrice;
    document.getElementById("saleDate").value = sale.saleDate;
    document.getElementById("paymentMethod").value = sale.paymentMethod;
    document.getElementById("status").value = sale.status;
    document.getElementById("notes").value = sale.notes || "";

    editingIndex = index;
    document.getElementById("addSaleBtn").textContent = "Update Sale";

    // Open the modal
    openModal();
  };

  window.deleteSale = function (index) {
    if (confirm("Are you sure you want to delete this sale record?")) {
      salesData.splice(index, 1);
      localStorage.setItem("salesData", JSON.stringify(salesData));
      updateSalesTable();
      updateSummary();

      // If currently editing this record, reset the form and close modal
      if (editingIndex === index) {
        resetForm();
        closeModal();
      } else if (editingIndex > index) {
        // Adjust editing index if necessary
        editingIndex--;
      }
    }
  };
});
