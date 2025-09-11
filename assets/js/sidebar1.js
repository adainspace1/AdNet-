// sidebar1.js
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
      document
        .querySelectorAll(".dropdown .dropdown-contentt.open")
        .forEach((openContent) => {
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

  // === Collapse Sidebar on Mouseleave and Reset Everything ===
  const dropdowns = document.querySelectorAll(".dropdown");
  const allDropdownContents = document.querySelectorAll(".all-dropdown-btn + .main-dropdown-content");

  sidebar.addEventListener("mouseleave", () => {
    // collapse sidebar
    sidebar.classList.add("collapsed");

    // reset POS/Bookkeeping main dropdowns
    allDropdownContents.forEach((content) => {
      content.classList.add("close"); // force closed
      const btn = content.previousElementSibling; // the all-dropdown-btn
      if (btn) {
        btn.classList.remove("open");
        const chevron = btn.querySelector(".chevron");
        if (chevron) chevron.classList.remove("rotated");
      }
    });

    // reset all normal dropdowns
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("open");

      const dropdownContent = dropdown.querySelector(".dropdown-contentt");
      if (dropdownContent) dropdownContent.classList.remove("open");

      const btn = dropdown.querySelector(".dropdown-btn");
      if (btn) btn.classList.remove("open");

      const chevron = dropdown.querySelector(".chevron");
      if (chevron) chevron.classList.remove("rotated");
    });

    // reset all submenus
    submenuTitles.forEach((title) => {
      title.classList.remove("open");
      const submenuItems = title.nextElementSibling;
      if (submenuItems) submenuItems.style.maxHeight = null;

      const chevron = title.querySelector(".chevron");
      if (chevron) chevron.classList.remove("rotated");
    });
  });

  sidebar.addEventListener("mouseenter", () => {
    sidebar.classList.remove("collapsed");
  });
});










document.addEventListener("DOMContentLoaded", () => {
  const divs = document.querySelectorAll(".myDiv");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  });

  divs.forEach(div => observer.observe(div));
});
