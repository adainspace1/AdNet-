// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Sidebar toggle functionality
  const sidebarToggle = document.querySelector(".bx-menu");
  const sidebar = document.querySelector(".sidebar");
  const content = document.querySelector(".content");

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");
      content.classList.toggle("expanded");
    });
  }

  // Theme toggle functionality
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("change", function () {
      document.body.classList.toggle("light-mode");
    });
  }

  // Role Management - First section
  const addRoleBtn = document.getElementById("addRoleBtn");
  const roleForm = document.getElementById("roleForm");
  const saveRoleBtn = document.getElementById("saveRoleBtn");
  const cancelRoleBtn = document.getElementById("cancelRoleBtn");
  const roleList = document.getElementById("roleList");

  if (addRoleBtn && roleForm && saveRoleBtn && cancelRoleBtn) {
    // Show form when Add Role button is clicked
    addRoleBtn.addEventListener("click", function () {
      roleForm.classList.remove("hidden");
    });

    // Hide form when Cancel button is clicked
    cancelRoleBtn.addEventListener("click", function () {
      roleForm.classList.add("hidden");
    });

    // Save role when Save button is clicked
    saveRoleBtn.addEventListener("click", function () {
      const roleName = document.getElementById("roleName").value.trim();
      const roleTasks = document.getElementById("roleTasks").value.trim();
      const roleImage = document.getElementById("roleImage").files[0];

      if (roleName === "" || roleTasks === "") {
        alert("Please fill all fields");
        return;
      }

      // Create new row for the table
      const newRow = document.createElement("tr");

      // Add profile image cell
      const imgCell = document.createElement("td");
      const img = document.createElement("img");
      img.src = roleImage ? URL.createObjectURL(roleImage) : "default.jpg";
      img.style.width = "40px";
      img.style.height = "40px";
      img.style.borderRadius = "50%";
      imgCell.appendChild(img);
      newRow.appendChild(imgCell);

      // Add role name cell
      const nameCell = document.createElement("td");
      nameCell.textContent = roleName;
      newRow.appendChild(nameCell);

      // Add tasks cell
      const tasksCell = document.createElement("td");
      tasksCell.textContent = roleTasks;
      newRow.appendChild(tasksCell);

      // Add actions cell with delete button
      const actionCell = document.createElement("td");
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Remove";
      deleteBtn.classList.add("btn", "delete-btn");
      deleteBtn.addEventListener("click", function () {
        roleList.removeChild(newRow);
      });
      actionCell.appendChild(deleteBtn);
      newRow.appendChild(actionCell);

      // Add the new row to the table
      roleList.appendChild(newRow);

      // Reset form and hide it
      document.getElementById("roleName").value = "";
      document.getElementById("roleTasks").value = "";
      document.getElementById("roleImage").value = "";
      roleForm.classList.add("hidden");
    });
  }

  // Event delegation for dynamically added elements
  document.addEventListener("click", function (e) {
    // Handle clicks on dynamically created delete buttons
    if (e.target && e.target.classList.contains("delete-btn")) {
      const row = e.target.closest("tr");
      if (row && row.parentNode) {
        row.parentNode.removeChild(row);
      }
    }

    // Handle clicks on dynamically created edit buttons
    if (e.target && e.target.classList.contains("edit-button")) {
      const row = e.target.closest("tr");
      // Implement edit functionality here
      console.log("Edit button clicked for row:", row);
    }

    // Handle clicks on dynamically created suspend buttons
    if (e.target && e.target.classList.contains("suspend-button")) {
      const row = e.target.closest("tr");
      // Implement suspend functionality here
      console.log("Suspend button clicked for row:", row);
      row.classList.toggle("suspended");
    }

    // Handle clicks on dynamically created remove buttons
    if (e.target && e.target.classList.contains("remove-button")) {
      const row = e.target.closest("tr");
      if (row && row.parentNode) {
        row.parentNode.removeChild(row);
      }
    }
  });
});
