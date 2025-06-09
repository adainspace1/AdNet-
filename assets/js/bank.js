const bankSelect = document.getElementById("bankName");
const accountInput = document.getElementById("accountNumber");
const accountNameField = document.getElementById("accountName");
const accError = document.querySelector(".accError");

const bankCodes = {
  "Access Bank": "044",
  "UBA": "033",
  "GTBank": "058",
  "First Bank": "011",
  "Zenith Bank": "057",
  "Kuda Bank": "50211",
  "Opay": "999991",
  "Moniepoint": "50515",
  "PalmPay": "999992",
  "Wema Bank": "035"
};

async function fetchAccountName() {
  const bankCode = bankCodes[bankSelect.value];
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
