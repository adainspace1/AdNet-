/**
 * AdNet Admin Dashboard - Comprehensive Management System
 * Handles role-based access, modular features, and dynamic rendering
 */

class AdminDashboard {
  constructor() {
    this.userRole = 'super-admin'; // Will be determined from backend
    this.visibleModules = [];
    this.initializeDashboard();
  }

  // Initialize the dashboard
  initializeDashboard() {
    this.setupEventListeners();
    this.renderRoleBasedFeatures();
    this.loadDashboardData();
    this.setupTabNavigation();
    this.updateCurrentDate();
  }

  // Setup all event listeners
  setupEventListeners() {
    // Tab button clicks
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn')));
    });

    // Add Staff Button
    const addStaffBtns = document.querySelectorAll('[id*="addStaffBtn"]');
    addStaffBtns.forEach(btn => {
      btn.addEventListener('click', () => this.openStaffPopup());
    });

    // Add Company Button
    document.querySelectorAll('[id*="addCompanyBtn"]').forEach(btn => {
      btn.addEventListener('click', () => this.openCompanyModal());
    });

    // Quick action buttons
    document.getElementById('generateReportBtn')?.addEventListener('click', () => {
      this.generateReport();
    });
  }

  // Switch between tabs
  switchTab(tabBtn) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab
    tabBtn.classList.add('active');
    const tabId = tabBtn.dataset.tab;
    const tabContent = document.getElementById(`${tabId}-tab`);
    if (tabContent) {
      tabContent.classList.add('active');
    }
  }

  // Render features based on role
  renderRoleBasedFeatures() {
    const rolePermissions = {
      'super-admin': [
        'companies', 'staff', 'logistics', 'audit', 'tax', 'billing', 'settings'
      ],
      'company-admin': [
        'staff', 'logistics', 'audit', 'tax', 'billing'
      ],
      'auditor': [
        'audit'
      ],
      'tax-officer': [
        'tax'
      ],
      'logistics-manager': [
        'logistics'
      ],
      'staff': [
        'audit', 'tax', 'logistics'
      ]
    };

    const allowedModules = rolePermissions[this.userRole] || [];

    // Show/hide tabs based on role
    const moduleToTab = {
      'companies': 'companiesTab',
      'staff': 'staffTab',
      'logistics': 'logisticsTab',
      'audit': 'auditTab',
      'tax': 'taxTab',
      'billing': 'billingTab',
      'settings': 'settingsTab'
    };

    for (let [module, tabId] of Object.entries(moduleToTab)) {
      const element = document.getElementById(tabId);
      if (element) {
        element.style.display = allowedModules.includes(module) ? 'flex' : 'none';
      }
    }

    // Show/hide KPI cards based on role
    this.renderKPICards(allowedModules);
  }

  // Render KPI Cards based on permissions
  renderKPICards(allowedModules) {
    const kpiMap = {
      'billing': 'kpiRevenue',
      'companies': 'kpiClients',
      'staff': 'kpiStaff',
      'audit': 'kpiAudits',
      'logistics': 'kpiLogistics',
      'tax': 'kpiTax'
    };

    for (let [module, kpiId] of Object.entries(kpiMap)) {
      const element = document.getElementById(kpiId);
      if (element) {
        element.style.display = allowedModules.includes(module) ? 'block' : 'none';
      }
    }
  }

  // Load dashboard data
  async loadDashboardData() {
    try {
      // Load overview data
      this.loadOverviewData();
      // Load staff data
      this.loadStaffData();
      // Load other module data based on permissions
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  // Load overview data
  async loadOverviewData() {
    try {
      // Fetch notifications
      const notifCount = 5;
      document.getElementById('notificationCount').textContent = notifCount;

      // Load recent activity
      this.loadRecentActivity();
      // Load alerts
      this.loadAlerts();
    } catch (error) {
      console.error('Error loading overview:', error);
    }
  }

  // Load recent activity
  loadRecentActivity() {
    const activities = [
      { icon: 'bx-user-plus', title: 'New user registered', time: '2 hours ago', type: 'info' },
      { icon: 'bx-check-circle', title: 'Audit completed', time: '5 hours ago', type: 'success' },
      { icon: 'bx-wallet', title: 'Payment received', time: '1 day ago', type: 'info' },
      { icon: 'bx-alert-circle', title: 'Tax deadline approaching', time: '2 days ago', type: 'warning' }
    ];

    const activityList = document.getElementById('activityList');
    if (activityList) {
      activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
          <div class="activity-icon ${activity.type}">
            <i class="bx ${activity.icon}"></i>
          </div>
          <div class="activity-content">
            <p><strong>${activity.title}</strong></p>
            <span class="activity-time">${activity.time}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Load alerts
  loadAlerts() {
    const alerts = [
      { icon: 'bx-exclamation-circle', title: 'Expiring subscription', desc: '3 companies expire in 7 days', type: 'warning' },
      { icon: 'bx-info-circle', title: 'Pending audits', desc: '2 audits awaiting completion', type: 'info' },
      { icon: 'bx-time', title: 'Overdue taxes', desc: '1 company with overdue tax payment', type: 'danger' }
    ];

    const alertsList = document.getElementById('alertsList');
    if (alertsList) {
      alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
          <i class="bx ${alert.icon}"></i>\n          <div class="alert-content">
            <p><strong>${alert.title}</strong></p>
            <span>${alert.desc}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Load staff data
  async loadStaffData() {
    const tbody = document.querySelector('#staffTableBody, .orders table tbody');
    if (!tbody) return;

    try {
      const adminId = document.querySelector('input[name="adminId"]')?.value;
      if (!adminId) return;

      const res = await fetch(`/workers/${adminId}`);
      const workers = await res.json();

      tbody.innerHTML = '';
      workers.forEach(worker => {
        const tr = document.createElement('tr');
        const rolesDisplay = worker.roles.map(r => `${r.role} (${r.accessLevel})`).join(', ');
        tr.innerHTML = `
          <td>
            <img src="/images/load.jpeg" alt="${worker.name}" />
            <p>${worker.name}</p>
          </td>
          <td>${worker.email || 'N/A'}</td>
          <td>${worker.roles.map(r => r.role).join(', ') || 'N/A'}</td>
          <td>${worker.roles.map(r => r.accessLevel).join(', ') || 'N/A'}</td>
          <td><span class="status-badge ${worker.status || 'active'}">${worker.status || 'Active'}</span></td>
          <td>${new Date(worker.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="edit-btn btn btn-sm" data-id="${worker._id}">Edit</button>
            <button class="delete-btn btn btn-sm btn-danger" data-id="${worker._id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Attach event listeners for edit/delete
      this.attachStaffActions(tbody);
    } catch (err) {
      console.error('Failed to load staff:', err);
    }
  }

  // Attach staff action listeners
  attachStaffActions(tbody) {
    tbody.addEventListener('click', async (e) => {
      if (e.target.classList.contains('edit-btn')) {
        const id = e.target.dataset.id;
        await this.editStaff(id);
      } else if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        await this.deleteStaff(id);
      }
    });
  }

  // Edit staff member
  async editStaff(id) {
    try {
      const res = await fetch(`/workers/${id}`);
      const worker = await res.json();
      
      if (res.ok) {
        this.openStaffPopup(worker);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  }

  // Delete staff member
  async deleteStaff(id) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const res = await fetch(`/workers/${id}`, { method: 'DELETE' });
      const result = await res.json();
      
      if (res.ok) {
        alert(result.message);
        this.loadStaffData();
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
    }
  }

  // Open staff popup
  openStaffPopup(workerData = null) {
    const popup = document.getElementById('staffPopup');
    if (!popup) {
      console.warn('Staff popup not found');
      return;
    }

    const form = document.getElementById('staffForm');
    const title = document.getElementById('staffPopupTitle');

    if (workerData) {
      title.textContent = 'Edit Staff Member';
      form.dataset.id = workerData._id;
      // Prefill form data
      form.name.value = workerData.name || '';
      form.email.value = workerData.email || '';
      form.phone.value = workerData.phone || '';
      form.username.value = workerData.username || '';
      // Reset password field for edits
      form.password.value = '';
      form.password.placeholder = 'Leave blank to keep current password';
    } else {
      title.textContent = 'Add Staff Member';
      form.reset();
      delete form.dataset.id;
      form.password.placeholder = 'Enter password';
    }

    popup.style.display = 'flex';
  }

  // Close staff popup
  closeStaffPopup() {
    const popup = document.getElementById('staffPopup');
    if (popup) {
      popup.style.display = 'none';
    }
  }

  // Open company modal
  openCompanyModal() {
    alert('Company management modal will open here');
  }

  // Generate report
  generateReport() {
    alert('Report generation in progress...');
  }

  // Setup tab navigation
  setupTabNavigation() {
    // Can be enhanced for keyboard navigation
  }

  // Update current date
  updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.adminDashboard = new AdminDashboard();
  
  // Expose close function globally
  window.closeStaffPopup = () => {
    window.adminDashboard.closeStaffPopup();
  };
});
