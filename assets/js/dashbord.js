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

