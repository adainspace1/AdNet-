// Fetch banks from supermx1 Nigerian Banks API
fetch("https://supermx1.github.io/nigerian-banks-api/data.json")
  .then(res => res.json())
  .then(data => {
    const select = document.getElementById("bankName");

    data.forEach(bank => {
      const opt = document.createElement("option");
      opt.value = bank.code;   // ✅ use bank code instead of name
      opt.textContent = bank.name;

      // Optional: style with logo
      opt.style.backgroundImage = `url(${bank.logo})`;
      opt.style.backgroundSize = "20px 20px";
      opt.style.backgroundRepeat = "no-repeat";
      opt.style.paddingLeft = "25px";

      select.appendChild(opt);
    });
  })
  .catch(err => console.error("Error loading bank list:", err));




const bankSelect = document.getElementById("bankName");
const accountInput = document.getElementById("accountNumber");
const accountNameField = document.getElementById("accountName");
const accError = document.querySelector(".accError");


async function fetchAccountName() {
  const bankCode = bankSelect.value; // ✅ now comes from option.value
  const accountNumber = accountInput.value;

  if (bankCode && accountNumber.length === 10) {
    try {
      const res = await fetch(`/resolve-account?account_number=${accountNumber}&bank_code=${bankCode}`);
      const data = await res.json();

      if (data.status && data.data.account_name) {
        accountNameField.value = data.data.account_name;
        accountNameField.dataset.valid = "true";
        accError.style.opacity = "0";
      } else {
        accountNameField.value = "";
        accountNameField.dataset.valid = "false";
        accError.style.opacity = "1";
        accError.textContent = "Error: Account not found";
      }
    } catch (err) {
      console.error(err);
      accountNameField.value = "";
      accountNameField.dataset.valid = "false";
      accError.style.opacity = "1";
      accError.textContent = "Error: Something went wrong";
    }
  } else {
    accountNameField.value = "";
    accountNameField.dataset.valid = "false";
    accError.style.opacity = "1";
    accError.textContent = "Error: Invalid bank or account number";
  }
}

bankSelect.addEventListener("change", fetchAccountName);
accountInput.addEventListener("input", fetchAccountName);

document.getElementById("stepperForm").addEventListener("submit", function (e) {
  if (accountNameField.dataset.valid !== "true") {
    e.preventDefault();
    alert("Please provide a valid bank account.");
  }
});



document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bankForm");

  form.addEventListener("submit", function (e) {
    let isValid = true;
    const inputs = form.querySelectorAll("input[required], select[required]");
    
    inputs.forEach((input) => {
      const error = input.nextElementSibling;
      if (input.value.trim() === "") {
        error.textContent = "This field is required.";
        error.style.display = "block";
        isValid = false;
      } else {
        error.textContent = "";
        error.style.display = "none";
      }
    });

    if (!isValid) {
      e.preventDefault(); // stop form from submitting
    }
  });
});
