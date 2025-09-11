const steps = document.querySelectorAll("#stepperForm > div"); 
const indicators = document.querySelectorAll(".step-indicator");
let currentStep = 0;

function showStep(step) {
  if (step < 0 || step >= steps.length) {
    console.error(`Invalid step index: ${step}`);
    return;
  }

  // Clear all error messages
  document.querySelectorAll(".error-msg").forEach(msg => msg.textContent = "");

  steps.forEach((s, i) => {
    s.style.display = i === step ? "block" : "none";
  });

  indicators.forEach(ind => ind.classList.remove("active"));
  if (indicators[step]) {
    indicators[step].classList.add("active");
  } else {
    console.warn(`No indicator found for step: ${step}`);
  }

  currentStep = step;

  if (step === 3) {
    buildReview();
  }
}

function validateStep(step) {
  const currentFields = steps[step].querySelectorAll("input[required], textarea[required], select[required]");
  let valid = true;
  let errorMessages = [];

  currentFields.forEach(field => {
    if (!field.value.trim()) {
      valid = false;
      const fieldName = field.previousElementSibling?.innerText || field.name;
      errorMessages.push(`${fieldName} is required`);
    }
  });

  // Show specific errors in the step's error message placeholder
  const errorBox = steps[step].querySelector(".error-msg");
  if (errorBox) {
    errorBox.textContent = errorMessages.length ? errorMessages.join("; ") : "";
  }

  return valid;
}

function validateAllSteps(targetStep) {
  for (let i = 0; i <= targetStep; i++) {
    if (!validateStep(i)) {
      return i; // Return the first invalid step
    }
  }
  return targetStep; // All steps valid, proceed to target
}

function buildReview() {
  const formData = new FormData(document.querySelector("#stepperForm"));
  let html = "<ul>";
  formData.forEach((value, key) => {
    html += `<li><strong>${key}:</strong> ${value}</li>`;
  });
  html += "</ul>";
  document.querySelector("#reviewContent").innerHTML = html;
}

// Attach button navigation and form submission AFTER DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log(`Found ${steps.length} steps and ${indicators.length} indicators`);
  if (steps.length !== indicators.length) {
    console.warn("Mismatch between steps and indicators!");
  }

  document.querySelector("#nextBtn1")?.addEventListener("click", e => {
    e.preventDefault();
    const nextStep = validateAllSteps(1);
    showStep(nextStep);
  });

  document.querySelector("#nextBtn2")?.addEventListener("click", e => {
    e.preventDefault();
    const nextStep = validateAllSteps(2);
    showStep(nextStep);
  });

  document.querySelector("#nextBtn3")?.addEventListener("click", e => {
    e.preventDefault();
    const nextStep = validateAllSteps(3);
    showStep(nextStep);
  });

  document.querySelector("#prevBtn1")?.addEventListener("click", e => {
    e.preventDefault();
    showStep(0);
  });

  document.querySelector("#prevBtn2")?.addEventListener("click", e => {
    e.preventDefault();
    showStep(1);
  });

  document.querySelector("#prevBtn3")?.addEventListener("click", e => {
    e.preventDefault();
    showStep(2);
  });

  document.querySelector("#stepperForm")?.addEventListener("submit", e => {
    const validStep = validateAllSteps(3);
    if (validStep !== 3) {
      e.preventDefault(); // Stop submission
      showStep(validStep); // Navigate to first invalid step
    }
  });

  showStep(0);
});