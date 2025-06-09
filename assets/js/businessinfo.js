
  document.addEventListener("DOMContentLoaded", () => {
    const steps = document.querySelectorAll(".step1, .step2, .step3, .step4");
    let currentStep = 0;

    const showStep = (index) => {
      steps.forEach((step, i) => {
        step.style.display = i === index ? "block" : "none";
      });
    };

    // Initially show the first step
    showStep(currentStep);

    // Next buttons
    document.getElementById("nextBtn1").addEventListener("click", (e) => {
      e.preventDefault();
      currentStep = 1;
      showStep(currentStep);
    });

    document.getElementById("nextBtn2").addEventListener("click", (e) => {
      e.preventDefault();
      currentStep = 2;
      showStep(currentStep);
    });

    document.getElementById("nextBtn3").addEventListener("click", (e) => {
      e.preventDefault();
      currentStep = 3;
      showStep(currentStep);
    });

    // Previous buttons
    document.getElementById("prevBtn1").addEventListener("click", (e) => {
      e.preventDefault();
      currentStep = 0;
      showStep(currentStep);
    });

    document.getElementById("prevBtn2").addEventListener("click", (e) => {
      e.preventDefault();
      currentStep = 1;
      showStep(currentStep);
    });
  });
