
document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".step1, .step2, .step3, .step4");
  const indicators = document.querySelectorAll(".step-indicator");
  let currentStep = 0;

  const form = document.getElementById("stepperForm");

  // Show step
  function showStep(step) {
    steps.forEach((s, i) => s.style.display = i === step ? "block" : "none");
    indicators.forEach((ind, i) => ind.classList.toggle("active", i === step));
  }

  // Validate fields
  function validateStep(step) {
    const inputs = steps[step].querySelectorAll("input[required], select[required]");
    let valid = true;
    steps[step].querySelectorAll(".error").forEach(e => e.remove());

    inputs.forEach(input => {
      if (!input.value.trim()) {
        valid = false;
        const error = document.createElement("div");
        error.className = "error";
        error.innerText = "This field is required";
        input.insertAdjacentElement("afterend", error);
      }
    });
    return valid;
  }

  // Build preview
  function buildPreview() {
    const previewBox = document.createElement("div");
    previewBox.className = "preview-box";

    const inputs = form.querySelectorAll("input, select");
    inputs.forEach(input => {
      // exclude hidden fields & recipientId from preview
      if (
        input.type !== "hidden" &&
        input.name &&
        input.name !== "recipientId" &&
        input.type !== "file"
      ) {
        const item = document.createElement("div");
        item.className = "preview-item";
        item.innerHTML = `
          <div class="preview-label">${input.previousElementSibling?.innerText || input.name}</div>
          <div class="preview-value">${input.value}</div>
        `;
        previewBox.appendChild(item);
      }
    });

    // Clean step4 content first (remove forced styling)
    const step4 = document.querySelector(".step4 .form-content");
    step4.innerHTML = "";
    step4.appendChild(document.createElement("p")).innerText = "Please review your details:";
    step4.appendChild(previewBox);
  }

// Next buttons
document.querySelectorAll(".next-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);

      if (currentStep === 3) buildPreview(); // preview step
    } else {
      // 🚀 Final step - allow submit
      form.submit();
    }
  });
});


  // Previous buttons
  document.querySelectorAll(".back-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  });

  // Init
  showStep(currentStep);
});
