


    // [1] Bank Account Management System (Original)
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const bankAccountModal = document.getElementById('bank-account-modal');
    const transactionModal = document.getElementById('transaction-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const bankAccountForm = document.getElementById('bank-account-form');
    const transactionForm = document.getElementById('transaction-form');
    const accountsList = document.getElementById('accounts-list');
    const transactionsList = document.getElementById('transactions-list');
    const bankNameSelect = document.getElementById('bank-name');
    const transactionAccountSelect = document.getElementById('transaction-account');
    
    // Sample data
    let bankAccounts = JSON.parse(localStorage.getItem('bankAccounts')) || [];
    let transactions = JSON.parse(localStorage.getItem('bankTransactions')) || [];
    
    
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    

    
    // Functions
    function openBankAccountModal() {
        bankAccountModal.classList.add('active');
    }
    
    function openTransactionModal(accountId = null) {
        // Populate account dropdown
        transactionAccountSelect.innerHTML = '<option value="">Select Account</option>';
        bankAccounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.bankName} - ${account.accountNumber} (${account.accountName})`;
            transactionAccountSelect.appendChild(option);
            
            if (accountId && account.id === accountId) {
                option.selected = true;
            }
        });
        
        document.getElementById('transaction-date').valueAsDate = new Date();
        transactionModal.classList.add('active');
    }
    
    function closeAllModals() {
        bankAccountModal.classList.remove('active');
        transactionModal.classList.remove('active');
    }
    
    function handleBankAccountSubmit(e) {
        e.preventDefault();
        
        const bankName = bankNameSelect.value === 'other' 
            ? document.getElementById('other-bank-name').value 
            : bankNameSelect.value;
        const accountName = document.getElementById('account-name').value;
        const accountNumber = document.getElementById('account-number').value;
        const accountType = document.getElementById('account-type').value;
        const initialBalance = parseFloat(document.getElementById('initial-balance').value) || 0;
        
        const newAccount = {
            id: Date.now().toString(),
            bankName,
            accountName,
            accountNumber,
            accountType,
            balance: initialBalance,
            createdAt: new Date().toISOString()
        };
        
        bankAccounts.push(newAccount);
        localStorage.setItem('bankAccounts', JSON.stringify(bankAccounts));
        
        if (initialBalance > 0) {
            const initialTransaction = {
                id: Date.now().toString(),
                accountId: newAccount.id,
                type: 'credit',
                amount: initialBalance,
                date: new Date().toISOString(),
                description: 'Initial balance',
                reference: 'INITIAL',
                createdAt: new Date().toISOString()
            };
            
            transactions.push(initialTransaction);
            localStorage.setItem('bankTransactions', JSON.stringify(transactions));
        }
        
        bankAccountForm.reset();
        closeAllModals();
    }
    
    function handleTransactionSubmit(e) {
        e.preventDefault();
        
        const accountId = document.getElementById('transaction-account').value;
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;
        const reference = document.getElementById('transaction-reference').value;
        
        const newTransaction = {
            id: Date.now().toString(),
            accountId,
            type,
            amount,
            date,
            description,
            reference: reference || 'N/A',
            createdAt: new Date().toISOString()
        };
        
        transactions.push(newTransaction);
        localStorage.setItem('bankTransactions', JSON.stringify(transactions));
        
        const accountIndex = bankAccounts.findIndex(acc => acc.id === accountId);
        if (accountIndex !== -1) {
            if (type === 'credit') {
                bankAccounts[accountIndex].balance += amount;
            } else {
                bankAccounts[accountIndex].balance -= amount;
            }
            localStorage.setItem('bankAccounts', JSON.stringify(bankAccounts));
        }
        
        
        transactionForm.reset();
        closeAllModals();
    }
    

 
    function updateSummary() {
        const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
        const totalCredits = transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalDebits = transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);
        
        document.querySelector('.balance-amount').textContent = `₦${totalBalance.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;
        document.querySelector('.stat-value.positive').textContent = `₦${totalCredits.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;
        document.querySelector('.stat-value.negative').textContent = `₦${totalDebits.toLocaleString('en-NG', {minimumFractionDigits: 2})}`;
    }
    
    function formatAccountNumber(number) {
        return number.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-NG', options);
    }
    
    window.addEventListener('click', function(e) {
        if (e.target === bankAccountModal || e.target === transactionModal) {
            closeAllModals();
        }
    });

    // [2] NEW: Invoice Matching
    document.querySelector('.match-actions .btn-primary').addEventListener('click', function() {
        alert('Running auto-matching process...');
    });
    
    document.querySelector('.match-actions .btn-secondary').addEventListener('click', function() {
        alert('Showing match suggestions');
    });

    // [3] NEW: Supplier Analysis
    document.querySelector('.period-select').addEventListener('change', function() {
        console.log('Supplier period changed to:', this.value);
    });

    // [4] NEW: Journal Entry Workflow
    document.querySelectorAll('.je-actions .btn-small').forEach(btn => {
        btn.addEventListener('click', function() {
            alert(this.textContent + ' journal entries');
        });
    });

    // [5] NEW: Access Control
    const roleSelect = document.getElementById('user-role');
    const saveBtn = document.getElementById('save-permissions');
    
    roleSelect.addEventListener('change', function() {
        console.log('Role changed to:', this.value);
    });
    
    saveBtn.addEventListener('click', function() {
        alert('Permissions saved successfully');
    });
});
    