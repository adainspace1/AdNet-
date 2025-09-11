let currentStep = 0;

/**
 * Shows the given step in the form
 */
function showStep(step) {
  const steps = document.querySelectorAll(".step");
  const stepIndicators = document.querySelectorAll(".stepper .step-indicator");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  steps.forEach((s, i) => {
    s.style.display = i === step ? "block" : "none";
  });

  stepIndicators.forEach((indicator, i) => {
    indicator.classList.toggle("active", i === step);
  });

  // Control buttons visibility
  if (step === 0) {
    prevBtn.style.display = "none"; // hide on first step
  } else {
    prevBtn.style.display = "inline-block";
  }

  if (step === steps.length - 1) {
    // last step → show Submit
    nextBtn.innerHTML = '<i class="bx bx-check"></i> Submit';
    nextBtn.type = "submit";
    nextBtn.onclick = null; // let form handle submit
    populatePreview();
  } else {
    // not last step → show Next
    nextBtn.innerHTML = '<i class="bx bx-right-arrow-alt"></i> Next';
    nextBtn.type = "button";
    nextBtn.onclick = function () {
      changeStep(1);
    };
  }
}

/**
 * Move forward or backward in steps
 */
function changeStep(stepChange) {
  const steps = document.querySelectorAll(".step");
  const currentInputs = steps[currentStep].querySelectorAll(
    "input, select, textarea"
  );

  let isValid = true;

  // clear old error messages
  currentInputs.forEach((input) => {
    let errorMsg = input.parentElement.querySelector(".error-message");
    if (errorMsg) errorMsg.remove();
  });

  // validate inputs before going forward
  if (stepChange > 0) {
    currentInputs.forEach((input) => {
      if (input.hasAttribute("required") && !input.value.trim()) {
        input.classList.add("error");
        isValid = false;

        const error = document.createElement("div");
        error.className = "error-message";
        error.textContent = "This field is required";
        input.parentElement.appendChild(error);
      } else {
        input.classList.remove("error");
      }
    });
  }

  if (!isValid) return;

  currentStep += stepChange;
  if (currentStep < 0) currentStep = 0;
  if (currentStep >= steps.length) currentStep = steps.length - 1;

  showStep(currentStep);
}

/**
 * Populate the preview step with entered data
 */
function populatePreview() {
  const previewContainer = document.getElementById("preview-container");
  const formData = new FormData(document.getElementById("stepperForm"));

  let html = "<div class='preview-grid'>";

  formData.forEach((value, key) => {
    if (key === "reciepientId") return; // hide recipientId
    if (value instanceof File && value.name) {
      html += `<div class="preview-row"><span>${formatKey(
        key
      )}</span><strong>${value.name}</strong></div>`;
    } else if (typeof value === "string" && value.trim()) {
      html += `<div class="preview-row"><span>${formatKey(
        key
      )}</span><strong>${value}</strong></div>`;
    }
  });

  html += "</div>";
  previewContainer.innerHTML = html;
}

/**
 * Format keys for preview (e.g., businessName → Business Name)
 */
function formatKey(key) {
  return key
    .replace(/([A-Z])/g, " $1") // add space before capital letters
    .replace(/_/g, " ") // replace underscores with spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize first letters
}

document.addEventListener("DOMContentLoaded", () => {
  showStep(currentStep);
});
