// Global variable to track current step
let currentStep = 0;

/**
 * Shows a specific step in the form wizard
 * @param {number} step - The step index to show
 */
function showStep(step) {
  const steps = document.querySelectorAll(".step");
  const sidebarItems = document.querySelectorAll(".sidebar-menu li");
  const stepIndicators = document.querySelectorAll(".stepper div");

  // Show the active step
  steps.forEach((s, index) => s.classList.toggle("active", index === step));

  // Highlight the stepper indicators
  stepIndicators.forEach((indicator, index) => {
    indicator.classList.toggle("active", index === step);
  });

  // Update button visibility
  document.getElementById("prevBtn").style.display =
    step === 0 ? "none" : "inline-block";
  const nextBtn = document.getElementById("nextBtn");
  nextBtn.textContent = step === steps.length - 1 ? "Submit" : "Next";
}

/**
 * Changes step forward or backward
 * @param {number} stepChange - The step change direction (1 for next, -1 for previous)
 */
function changeStep(stepChange) {
  const steps = document.querySelectorAll(".step");
  const currentInputs = steps[currentStep].querySelectorAll("input, textarea");
  const isValid = Array.from(currentInputs).every((input) =>
    input.checkValidity()
  );

  currentStep += stepChange;

  if (currentStep < 0) currentStep = 0;
  if (currentStep >= steps.length) {
    document.getElementById("stepperForm").submit();
    return;
  }

  showStep(currentStep);
}

/**
 * Redirects to the Bank information page after form submission
 */


/**
 * Initialize the form when the DOM content is loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  showStep(currentStep);
});

/**
 * Form submission handler for business information
 * @param {Event} event - The form submission event
 */
function handleBusinessSubmit(event) {
  // Form submission is handled automatically
  // Function included for potential future validation or AJAX submission
}
