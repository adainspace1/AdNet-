
  // Function to convert numbers to K / M / B
  function formatCurrency(value) {
    const num = Number(value);
    if (isNaN(num)) return value;

    if (num >= 1e9) return `₦${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `₦${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `₦${(num / 1e3).toFixed(1)}K`;

    return `₦${num.toLocaleString()}`;
  }

  // Apply formatting to all .forecast-value and .trend-value elements
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".forecast-value, .trend-value").forEach(el => {
      const original = el.textContent.replace(/[₦,]/g, '').trim();
      el.textContent = formatCurrency(original);
    });
  });