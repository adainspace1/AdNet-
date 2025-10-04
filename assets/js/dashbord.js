


    // ================== LOAD PERFORMANCE METRICS (New) ==================
async function loadPerformanceMetrics() {
  console.log("📊 Fetching performance metrics...");
  try {
    const resp = await fetch("/api/performance-metrics");
    console.log("🌐 Metrics response:", resp.status);
    const data = await resp.json();
    console.log("📦 Metrics data:", data);

    // Update h2 elements (add IDs to your HTML: id="cpi-value", id="benchmark-value", id="yield-value")
    document.getElementById('cpi-value').textContent = data.cpi;
    document.getElementById('benchmark-value').textContent = data.benchmark;
    document.getElementById('yield-value').textContent = data.yield;

    console.log("✅ Metrics updated.");
  } catch (err) {
    console.error("❌ Error loading metrics:", err);
  }
}

// ================== UPDATED LOAD MARKET TRENDS (with real news) ==================
async function loadMarketTrends() {
  console.log("🔁 Fetching market trends...");
  try {
    const resp = await fetch("/api/market-trends");
    console.log("🌐 Response received:", resp.status);
    const data = await resp.json();
    console.log("📦 Parsed JSON:", data);

    const aapl = data.candles.AAPL?.c || [];
    const tsla = data.candles.TSLA?.c || [];

    console.log("📊 Candle Data:", { aapl, tsla });

    // ========== PIE CHART (unchanged) ==========
    const ctx = document.getElementById("pieChart").getContext("2d");
    if (window.marketChart) {
      console.log("🔄 Destroying old chart...");
      window.marketChart.destroy();
    }

    window.marketChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["AAPL", "TSLA"],
        datasets: [
          {
            data: [
              aapl[aapl.length - 1] || 0,
              tsla[tsla.length - 1] || 0,
            ],
            backgroundColor: ["#3b82f6", "#10b981"],
          },
        ],
      },
    });
    console.log("✅ Chart rendered.");

    // ========== MARKET NEWS (updated to real) ==========
    const latestNews =
      data.news && data.news.length > 0
        ? `${data.news[0].title} — ${data.news[0].description || ""}`
        : "No current market update available.";

    const newsEl = document.getElementById("marketNews");
    if (newsEl) {
      newsEl.textContent = latestNews;
      console.log("📰 Real news displayed:", latestNews);
    } else {
      console.warn("⚠️ #marketNews element not found!");
    }
  } catch (err) {
    console.error("❌ Error loading market trends:", err);
  }
}








document.addEventListener("DOMContentLoaded", () => {
// Load on page ready and every 2 minutes
loadPerformanceMetrics(); // New
loadMarketTrends();
setInterval(() => {
  loadPerformanceMetrics();
  loadMarketTrends();
}, 2 * 60 * 1000); // 2 min poll for live updates

// Keep your existing dropdown/sidebar code...

    // Performance Overview Chart (Bar Chart)
    const progCtx = document.querySelector(".prog-chart").getContext("2d");
    const weeklyData = [120, 190, 300, 500, 200, 300, 400]; // Sample data

    new Chart(progCtx, {
      type: "bar",
      data: {
        labels: ["M", "T", "W", "T", "F", "S", "S"],
        datasets: [
          {
            label: "Sales",
            data: weeklyData,
            backgroundColor: "#F5F5DC",
            borderWidth: 3,
            borderRadius: 6,
            hoverBackgroundColor: "#60a5fa",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            border: { display: true },
            grid: { display: true, color: "#1e293b" },
          },
          y: {
            ticks: { display: false },
          },
        },
        plugins: { legend: { display: false } },
        animation: {
          duration: 1000,
          easing: "easeInOutQuad",
        },
      },
    });

    // Market Trends Chart (Pie Chart)
    const pieCtx = document.getElementById("pieChart").getContext("2d");
    const marketData = {
      labels: ["AAPL", "TSLA"],
      datasets: [
        {
          data: [225.50, 245.30], // Sample data
          backgroundColor: ["#3b82f6", "#10b981"],
        },
      ],
    };

    if (window.marketChart) {
      window.marketChart.destroy();
    }

    window.marketChart = new Chart(pieCtx, {
      type: "pie",
      data: marketData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });

    // Static Market News
    const newsEl = document.getElementById("marketNews");
    if (newsEl) {
      newsEl.textContent = "Apple and Tesla lead market growth in Q3 2025.";
    }




    // Sidebar and Dropdown Functionality
    document.getElementById("dropdown-btn")?.addEventListener("click", function (event) {
      event.preventDefault();
      let dropdown = document.getElementById("dropdown-menu");
      dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
    });

    document.querySelectorAll(".dropdown-link").forEach((item) => {
      item.addEventListener("click", function (event) {
        event.preventDefault();
        let submenu = this.nextElementSibling;
        submenu.style.display = submenu.style.display === "block" ? "none" : "block";
      });
    });

    document.addEventListener("click", function (event) {
      let sidebar = document.getElementById("sidebar");
      let dropdownMenu = document.getElementById("dropdown-menu");
      if (sidebar && !sidebar.contains(event.target)) {
        sidebar.classList.add("hidden");
        dropdownMenu.style.display = "none";
        document.querySelectorAll(".submenu").forEach((submenu) => (submenu.style.display = "none"));
      }
    });

    function toggleSidebar() {
      let sidebar = document.getElementById("sidebar");
      sidebar.classList.toggle("hidden");
    }

    function toggleNotificationDropdown() {
      const dropdown = document.getElementById("notificationDropdown");
      dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
    }

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

    notificationToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      notificationDropdown.style.display = notificationDropdown.style.display === "flex" ? "none" : "flex";
      profileDropdown.style.display = "none";
    });

    profileToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.style.display = profileDropdown.style.display === "flex" ? "none" : "flex";
      notificationDropdown.style.display = "none";
    });

    window.addEventListener("click", () => {
      notificationDropdown.style.display = "none";
      profileDropdown.style.display = "none";
    });

    function toggleDropdown() {
      const dropdown = document.getElementById("profileDropdown");
      dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
    }

    document.addEventListener("click", function (e) {
      const dropdown = document.getElementById("profileDropdown");
      const profile = document.querySelector(".profile");
      if (profile && !profile.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    document.getElementById("pos-dropdown-btn")?.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var dropdownMenu = document.getElementById("pos-dropdown-menu");
      dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
    });

    document.querySelectorAll(".submenu-toggle").forEach(function (toggle) {
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var targetId = this.getAttribute("data-target");
        var submenu = document.getElementById(targetId);
        submenu.style.display = submenu.style.display === "block" ? "none" : "block";
      });
    });

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
        document.querySelectorAll(".submenu").forEach(function (submenu) {
          submenu.style.display = "none";
        });
      }
    });












  const ctxx = document.querySelector(".activity-chart");

const weeklyData2 = window.weeklySalesData || [];


  new Chart(ctxx, {
    type: "bar",
    data: {
      labels: ["M", "T", "W", "T", "F", "S", "S"],
      datasets: [
        {
          label: "Sales",
          data: weeklyData2,
          backgroundColor: "#F5F5DC",
          borderWidth: 3,
          borderRadius: 6,
          hoverBackgroundColor: "#60a5fa",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          border: { display: true },
          grid: { display: true, color: "#1e293b" },
        },
        y: {
          ticks: { display: false },
        },
      },
      plugins: { legend: { display: false } },
      animation: {
        duration: 1000,
        easing: "easeInOutQuad",
      },
    },
  });
});