// Event listener for Step 1 Next button
document.querySelector("#nextBtn1").addEventListener("click", function (e) {
  e.preventDefault();

  document.querySelector(".step1").classList.add("active");
  document.querySelector(".step2").classList.add("active");
  document.querySelector(".step3").classList.remove("active");
  document.querySelector(".step4").classList.remove("active");

  document.querySelector("#ss1").classList.add("active");
  document.querySelector("#ss2").classList.add("active");
  document.querySelector("#ss3").classList.remove("active");
  document.querySelector("#ss4").classList.remove("active");
});

// Event listener for Step 2 Previous button
document.querySelector("#prevBtn1").addEventListener("click", function (e) {
  e.preventDefault();

  document.querySelector(".step1").classList.remove("active");
  document.querySelector(".step2").classList.remove("active");
  document.querySelector(".step3").classList.remove("active");
  document.querySelector(".step4").classList.remove("active");

  document.querySelector("#ss1").classList.remove("active");
  document.querySelector("#ss2").classList.remove("active");
  document.querySelector("#ss3").classList.remove("active");
  document.querySelector("#ss4").classList.remove("active");
});

// Event listener for Step 2 Next button
document.querySelector("#nextBtn2").addEventListener("click", function (e) {
  e.preventDefault();

  document.querySelector(".step1").classList.add("active");
  document.querySelector(".step2").classList.remove("active");
  document.querySelector(".step3").classList.add("active");
  document.querySelector(".step4").classList.remove("active");

  document.querySelector("#ss1").classList.add("active");
  document.querySelector("#ss2").classList.remove("active");
  document.querySelector("#ss3").classList.add("active");
  document.querySelector("#ss4").classList.remove("active");
});

// Event listener for Step 3 Previous button
document.querySelector("#prevBtn2").addEventListener("click", function (e) {
  e.preventDefault();

  document.querySelector(".step1").classList.add("active");
  document.querySelector(".step2").classList.add("active");
  document.querySelector(".step3").classList.remove("active");
  document.querySelector(".step4").classList.remove("active");

  document.querySelector("#ss1").classList.add("active");
  document.querySelector("#ss2").classList.add("active");
  document.querySelector("#ss3").classList.remove("active");
  document.querySelector("#ss4").classList.remove("active");
});

// Event listener for Step 3 Next button
document.querySelector("#nextBtn3").addEventListener("click", function (e) {
  e.preventDefault();

  document.querySelector(".step1").classList.add("active");
  document.querySelector(".step2").classList.remove("active");
  document.querySelector(".step3").classList.remove("active");
  document.querySelector(".step4").classList.add("active");

  document.querySelector("#ss1").classList.add("active");
  document.querySelector("#ss2").classList.remove("active");
  document.querySelector("#ss3").classList.remove("active");
  document.querySelector("#ss4").classList.add("active");
});

// Event listener for Submit button



// Initialize step tracking variable
let currentStep = 0;
