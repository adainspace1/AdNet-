
//     sidebar1.js
//     if (dropdownContent.style.maxHeight) {
//   dropdownContent.style.maxHeight = null;
// } else {
//   dropdownContent.style.maxHeight = dropdownContent.scrollHeight + "px";
// }

document.addEventListener("DOMContentLoaded", () => {
  const mobileToggle = document.querySelector(".mobile-toggle");
  const sidebar = document.getElementById("sidebar");

  // === Mobile Sidebar Toggle ===
  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active"); // text will appear with .active
    });
  }

  // === Handle main dropdown (Pos & Bookkeeping) ===
  const allDropdownBtns = document.querySelectorAll(".all-dropdown-btn");
  allDropdownBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mainContent = btn.nextElementSibling; // .main-dropdown-content div
      if (mainContent) {
        mainContent.classList.toggle("close");
      }

      const chevron = btn.querySelector(".chevron");
      if (chevron) chevron.classList.toggle("rotated");
    });
  });

  // === POS & other dropdowns ===
  const mainDropdownBtns = document.querySelectorAll(".dropdown-btn");
  mainDropdownBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dropdownWrapper = btn.parentElement;
      const dropdownContent = dropdownWrapper.querySelector(".dropdown-contentt");

      // Close other dropdowns
      document.querySelectorAll(".dropdown .dropdown-contentt.open").forEach((openContent) => {
        if (openContent !== dropdownContent) {
          openContent.classList.remove("open");
          const openBtn = openContent.parentElement.querySelector(".dropdown-btn");
          if (openBtn) {
            openBtn.classList.remove("open");
            const chevron = openBtn.querySelector(".chevron");
            if (chevron) chevron.classList.remove("rotated");
          }
        }
      });

      // Toggle current
      btn.classList.toggle("open");
      if (dropdownContent) {
        dropdownContent.classList.toggle("open");
      }

      const chevron = btn.querySelector(".chevron");
      if (chevron) chevron.classList.toggle("rotated");
    });
  });

  // === Submenus (Sales, Expenses, Inventory, etc.) ===
  const submenuTitles = document.querySelectorAll(".submenu-title");
  submenuTitles.forEach((title) => {
    title.addEventListener("click", () => {
      const submenuItems = title.nextElementSibling;
      title.classList.toggle("open");

      if (submenuItems) {
        if (submenuItems.style.maxHeight) {
          submenuItems.style.maxHeight = null;
        } else {
          submenuItems.style.maxHeight = submenuItems.scrollHeight + "px";
        }
      }

      const chevron = title.querySelector(".chevron");
      if (chevron) chevron.classList.toggle("rotated");
    });
  });
});

