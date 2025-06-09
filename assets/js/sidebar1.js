document.addEventListener("DOMContentLoaded", function () {
  // Mobile toggle functionality
  const sidebar = document.getElementById("sidebar");
  const mobileToggle = document.querySelector(".mobile-toggle");

  // Mobile toggle
  mobileToggle.addEventListener("click", function () {
    sidebar.classList.toggle("mobile-open");
  });

  // POS dropdown toggle - click needed for mobile
  const posDropdown = document.getElementById("pos-dropdown");
  const posDropdownBtn = posDropdown.querySelector(".dropdown-btn");

  posDropdownBtn.addEventListener("click", function () {
    posDropdown.classList.toggle("open");
    this.classList.toggle("active");
  });

  // Submenu toggles
  const submenuSections = document.querySelectorAll(".submenu-section");

  submenuSections.forEach((section) => {
    const title = section.querySelector(".submenu-title");

    title.addEventListener("click", function () {
      section.classList.toggle("open");
      this.classList.toggle("active");
    });
  });

  // Auto-open first submenu section for demonstration
  document.getElementById("sales-section").classList.add("open");
  document
    .getElementById("sales-section")
    .querySelector(".submenu-title")
    .classList.add("active");

  // Make sure POS dropdown is open by default to show submenu sections
  posDropdown.classList.add("open");
  posDropdownBtn.classList.add("active");
});
