
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
      sidebar.classList.toggle("active"); // Add CSS for .active in sidebar1.css
    });
  }



  // === Handle main dropdown (Pos & Bookkeeping) ===
const allDropdownBtns = document.querySelectorAll(".all-dropdown-btn");

allDropdownBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mainContent = btn.nextElementSibling; // the .main-dropdown-content div

    if (mainContent) {
      mainContent.classList.toggle("close");
    }

    // Rotate chevron on the button
    const chevron = btn.querySelector(".chevron");
    if (chevron) chevron.classList.toggle("rotated");
  });
});


// === POS & other dropdowns ===
const mainDropdownBtns = document.querySelectorAll(".dropdown-btn");

mainDropdownBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const dropdownWrapper = btn.parentElement; // .dropdown wrapper
    const dropdownContent = dropdownWrapper.querySelector(".dropdown-contentt");

    // Close any other open dropdowns first (optional if you only want one open)
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

    // Toggle current dropdown
    btn.classList.toggle("open");

    if (dropdownContent) {
      dropdownContent.classList.toggle("open");
    }

    // Rotate chevron icon
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

      // Rotate chevron
      const chevron = title.querySelector(".chevron");
      if (chevron) chevron.classList.toggle("rotated");
    });
  });
});
