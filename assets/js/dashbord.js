// Sidebar dropdown functionality
document
  .getElementById("dropdown-btn")
  ?.addEventListener("click", function (event) {
    event.preventDefault();
    let dropdown = document.getElementById("dropdown-menu");
    dropdown.style.display =
      dropdown.style.display === "flex" ? "none" : "flex";
  });

// Dropdown links functionality
document.querySelectorAll(".dropdown-link").forEach((item) => {
  item.addEventListener("click", function (event) {
    event.preventDefault();
    let submenu = this.nextElementSibling;
    submenu.style.display =
      submenu.style.display === "block" ? "none" : "block";
  });
});

// Close sidebar when clicking outside
document.addEventListener("click", function (event) {
  let sidebar = document.getElementById("sidebar");
  let dropdownMenu = document.getElementById("dropdown-menu");

  if (!sidebar.contains(event.target)) {
    sidebar.classList.add("hidden");
    dropdownMenu.style.display = "none";
    document
      .querySelectorAll(".submenu")
      .forEach((submenu) => (submenu.style.display = "none"));
  }
});

// Toggle sidebar function
function toggleSidebar() {
  let sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("hidden");
}

// Notification dropdown functionality
function toggleNotificationDropdown() {
  const dropdown = document.getElementById("notificationDropdown");
  dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
}

// Close notification dropdown when clicking outside
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("notificationDropdown");
  const notification = document.querySelector(".notification");
  if (notification && !notification.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

const notificationToggle = document.getElementById("notificationToggle");
const notificationDropdown = document.getElementById("notificationDropdown");
const profileToggle = document.getElementById("profileToggle");
const profileDropdown = document.getElementById("profileDropdown");

// Toggle Notification Dropdown
notificationToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  notificationDropdown.style.display =
    notificationDropdown.style.display === "flex" ? "none" : "flex";
  profileDropdown.style.display = "none";
});

// Toggle Profile Dropdown
profileToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  profileDropdown.style.display =
    profileDropdown.style.display === "flex" ? "none" : "flex";
  notificationDropdown.style.display = "none";
});

// Close dropdowns when clicking outside
window.addEventListener("click", () => {
  notificationDropdown.style.display = "none";
  profileDropdown.style.display = "none";
});
// Profile dropdown functionality
function toggleDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
}

// Close profile dropdown when clicking outside
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("profileDropdown");
  const profile = document.querySelector(".profile");
  if (profile && !profile.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

// POS Dropdown Toggle
document
  .getElementById("pos-dropdown-btn")
  ?.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    var dropdownMenu = document.getElementById("pos-dropdown-menu");
    dropdownMenu.style.display =
      dropdownMenu.style.display === "block" ? "none" : "block";
  });

// Submenu Toggles
document.querySelectorAll(".submenu-toggle").forEach(function (toggle) {
  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    var targetId = this.getAttribute("data-target");
    var submenu = document.getElementById(targetId);
    submenu.style.display =
      submenu.style.display === "block" ? "none" : "block";
  });
});

// Close POS dropdowns when clicking outside
document.addEventListener("click", function (e) {
  var posDropdownBtn = document.getElementById("pos-dropdown-btn");
  var posDropdownMenu = document.getElementById("pos-dropdown-menu");

  if (
    posDropdownBtn &&
    posDropdownMenu &&
    !posDropdownBtn.contains(e.target) &&
    !posDropdownMenu.contains(e.target)
  ) {
    posDropdownMenu.style.display = "none";

    // Close all submenus
    document.querySelectorAll(".submenu").forEach(function (submenu) {
      submenu.style.display = "none";
    });
  }
});

// Charts initialization
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Pie Chart if element exists
  const pieChartElement = document.getElementById("pieChart");
  if (pieChartElement) {
    new Chart(pieChartElement, {
      type: "line",
      data: {
        labels: ["Stocks", "Crypto", "Real Estate", "Gold", "Crypto"],
        datasets: [
          {
            data: [84, 40, 25, 30, 65], // Example percentages
            backgroundColor: [
              "#ff6384",
              "#36a2eb",
              "#ffcd56",
              "#4bc0c0",
              "#36a2eb",
            ],
          },
        ],
      },
    });
  }

  // Initialize other charts if needed
  // You might want to move the code from dash.js here
  // or keep them separate if dash.js contains other chart initializations
});

const ctx = document.querySelector(".activity-chart");
const ctx2 = document.querySelector(".prog-chart");


new Chart(ctx2, {
  type: "line",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Class GPA",
        data: [6, 10, 8, 14, 6, 7, 4],
        borderColor: "#0891b2",
        tension: 0.4,
      },
      {
        label: "Aver GPA",
        data: [8, 6, 7, 6, 11, 8, 10],
        borderColor: "#ca8a04",
        tension: 0.4,
      },
      {
        label: "Total GPA",
        data: [1, 3, 7, 4, 10, 13, 17],
        borderColor: "#000000",
        tension: 0.4,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          display: false,
        },
        border: {
          display: false,
          dash: [5, 5],
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuad",
    },
  },
});
