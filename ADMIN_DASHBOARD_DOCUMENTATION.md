# AdNet Admin Dashboard - Comprehensive Documentation

## Overview

The AdNet Admin Dashboard is an enterprise-ready, modular, and scalable administration system designed to support multiple roles, departments, and business operations. Features display dynamically based on user roles and subscription levels.

## Core Architecture

### Role-Based Access Control (RBAC)

The system supports the following roles:

- **Super Admin**: Full access to all modules and features
- **Company Admin**: Access to staff, logistics, audit, tax, and billing
- **Auditor**: Access to audit module only
- **Tax Officer**: Access to tax module only
- **Logistics Manager**: Access to logistics module only
- **Staff**: Limited access to assigned modules

### Role Permissions Mapping

```javascript
{
  'super-admin': ['companies', 'staff', 'logistics', 'audit', 'tax', 'billing', 'settings'],
  'company-admin': ['staff', 'logistics', 'audit', 'tax', 'billing'],
  'auditor': ['audit'],
  'tax-officer': ['tax'],
  'logistics-manager': ['logistics'],
  'staff': ['audit', 'tax', 'logistics']
}
```

## Core Modules

### 1. Overview Dashboard
- **KPI Cards**: Revenue, Active Clients, Total Staff, Pending Audits, Active Deliveries, Tax Status
- **Recent Activity**: Timeline of all actions performed in the system
- **Alerts & Notifications**: Real-time alerts for pending tasks, expiring subscriptions, overdue taxes
- **Quick Actions**: Buttons for common tasks (Add Staff, Add Company, Start Audit, Generate Report)
- **Charts**: Visual representations of monthly revenue and other metrics

### 2. Companies Module
- Register and manage companies
- Company profiles with documents and compliance status
- Subscription status and plan information
- Company activity timeline
- Assign auditors, tax officers, and logistics staff
- Search and filter by status (active, inactive, suspended)

**Visible to**: Super Admin, Company Admin

### 3. Staff & Workforce Management
- Add, edit, and delete staff members
- Role-based access assignment (Inventory, Sales, Finance, HR, Logistics, Audit, Tax)
- Access level configuration (Basic, Max, Admin) per role
- Staff status tracking (active, inactive)
- Department filtering and search
- Staff performance and activity tracking
- Subscription-based staff limits

**Visible to**: Super Admin, Company Admin

**Features Preserved**:
- Dynamic workers table rendering from `/workers/<adminId>` endpoint
- Popup form for adding/editing staff
- Role selection with automatic access level enabling
- Edit and delete functionality with confirmations
- Form submission to `/user/users` or `/workers/<id>` endpoints

### 4. Logistics Module
- **Driver Management**: Add, edit, assign drivers with performance tracking
- **Vehicle Management**: Register vehicles, track status and availability, schedule maintenance
- **Delivery Tracking**: Real-time delivery assignment and status updates
- **Staff Limits**: Based on subscription plan
- **Performance Insights**: Driver rating, delivery success rate, customer satisfaction
- **Reports**: Delivery analytics and logistics performance

**Visible to**: Super Admin, Company Admin, Logistics Manager

### 5. Audit Module
- View all audits across companies
- See companies currently under audit
- Audit history and audit reports
- Assign auditors to companies
- Audit status tracking (pending, ongoing, completed)
- Evidence uploads and compliance notes
- Audit timeline and checklist

**Visible to**: Super Admin, Company Admin, Auditor

### 6. Taxation Module
- See all companies' tax payment status
- Track companies with pending tax payments
- Ongoing tax process monitoring
- Tax deadlines and reminders
- Payment status (paid, pending, overdue)
- Generate tax reports
- Compliance verification

**Visible to**: Super Admin, Company Admin, Tax Officer

**Cards Included**:
- Paid Taxes (success status)
- Pending Taxes (warning status)
- Overdue Taxes (danger status)

### 7. Billing & Revenue
- Invoice and receipt management
- Payment tracking and status
- Revenue analytics with charts
- Transaction history
- Wallet/payout system tracking
- Active subscription counts
- Revenue trends

**Visible to**: Super Admin, Company Admin

### 8. System Settings
- **Feature Toggles**: Enable/disable modules per plan
- **Security**: Access logs, IP whitelist, API key management
- **Data Management**: Backup, restore, clear logs
- **System Configuration**: Global settings for the platform

**Visible to**: Super Admin only

## Technical Structure

### Files

1. **HTML**: `/views/dashboard/admin/admin.ejs`
   - Main dashboard template with all tabs and content areas
   - Staff management form (preserved from original)
   - Dynamic content containers for all modules

2. **CSS**: `/assets/css/admin-dashboard.css`
   - Complete styling for enterprise dashboard
   - Responsive design (mobile, tablet, desktop)
   - Dark mode support ready
   - KPI cards, tables, forms, and modal styling
   - Grid-based layouts for flexibility

3. **JavaScript**: `/js/admin-dashboard.js`
   - `AdminDashboard` class for managing dashboard logic
   - Role-based feature rendering
   - Tab navigation
   - Data loading and updates
   - Staff management (CRUD operations)
   - Event delegation for actions

## Key Features

### 1. Dynamic Feature Rendering
The dashboard automatically shows/hides features based on the logged-in user's role:

```javascript
renderRoleBasedFeatures() {
  const allowedModules = rolePermissions[this.userRole];
  // Show/hide tabs based on allowedModules
  // Show/hide KPI cards based on allowedModules
}
```

### 2. Modular Tab System
- Clean tab navigation with icons
- Smooth transitions between views
- Active state management
- Mobile-responsive tab layout

### 3. Data Management
- Staff CRUD operations with role management
- Dynamic table rendering from API endpoints
- Real-time search and filtering
- Status badge system for quick status identification

### 4. Responsive Design
- Mobile-first approach
- Grid-based layouts that adapt
- Touch-friendly buttons and controls
- Optimized for screens from 320px to 4K

### 5. Visual Hierarchy
- Color-coded elements (success, warning, danger, info)
- Icon-based navigation
- Clear typography levels
- Consistent spacing and alignment

## Staff Management (Preserved)

The original staff management functionality has been preserved and integrated:

### Form Structure
- Full name, email, phone, username, password
- Role selection with multiple options:
  - Inventory, Sales, Finance, HR, Logistics, Audit, Tax, Custom
- Access level per role (Basic, Max, Admin)
- Status selection (Active, Inactive)
- Additional notes field

### API Integration
- **Create**: POST `/user/users`
- **Update**: PUT `/workers/:id`
- **Read**: GET `/workers/:adminId`
- **Delete**: DELETE `/workers/:id`

### Features
- Role auto-enable/disable permission dropdowns
- Edit existing staff with prefilled form
- Delete with confirmation
- Form validation
- Status tracking
- Role display on staff table

## UI Components

### KPI Cards
Six customizable KPI cards with:
- Gradient icons with different colors
- Real-time values
- Change indicators
- Role-based visibility

### Tables
- Sortable columns
- Status badges
- Action buttons (Edit, Delete, View)
- Responsive horizontal scrolling
- Hover effects

### Filters
- Text search fields
- Dropdown selectors
- Real-time filtering
- Multiple filter support

### Alerts & Notifications
- Color-coded alert types (info, warning, danger)
- Icon indicators
- Dismissible
- Real-time updates

## Customization Guide

### Adding a New Module

1. **Add Tab Button**:
```html
<button class="tab-btn" data-tab="moduleName" id="moduleNameTab">
  <i class="bx bx-icon"></i> Module Name
</button>
```

2. **Add Tab Content**:
```html
<div class="tab-content" id="moduleName-tab">
  <!-- Module content -->
</div>
```

3. **Add Permission**:
```javascript
rolePermissions['super-admin'].push('moduleName');
```

4. **Add KPI Card** (if needed):
```html
<div class="kpi-card" id="kpiModule" style="display: none;">
  <!-- KPI content -->
</div>
```

### Styling Customization

Edit `/assets/css/admin-dashboard.css`:
- Color scheme: Modify `:root` CSS variables
- Spacing: Adjust padding/margin values
- Fonts: Change font-family and sizes
- Breakpoints: Modify media queries for different screen sizes

### Role-Based Features

Modify `/js/admin-dashboard.js`:
```javascript
const rolePermissions = {
  'your-role': ['module1', 'module2']
};
```

## API Integration Points

### Staff Management
- `GET /workers/:adminId` - Fetch all workers for admin
- `POST /user/users` - Create new staff member
- `PUT /workers/:id` - Update staff member
- `DELETE /workers/:id` - Delete staff member

### Expected Responses
```javascript
// Worker object
{
  _id: "...",
  name: "...",
  email: "...",
  phone: "...",
  username: "...",
  roles: [
    { role: "inventory", accessLevel: "basic" },
    { role: "sales", accessLevel: "max" }
  ],
  status: "active",
  createdAt: "2025-12-16T...",
  notes: "..."
}
```

## Performance Considerations

1. **Lazy Loading**: Load data only for visible tabs
2. **Caching**: Cache staff data to reduce API calls
3. **Pagination**: Implement for large datasets
4. **Search Debouncing**: Debounce search inputs
5. **Image Optimization**: Compress and optimize staff photos

## Security Features

1. **Role-Based Access**: Server-side validation of permissions
2. **CSRF Protection**: Include tokens in forms
3. **Input Validation**: Sanitize all user inputs
4. **Session Management**: Track user sessions
5. **Audit Logging**: Log all admin actions

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- Color contrast compliance
- Form field associations
- Semantic HTML structure

## Future Enhancements

1. **Advanced Analytics**: Charts library integration (Chart.js, Recharts)
2. **Real-time Updates**: WebSocket integration for live data
3. **Export Functionality**: Export reports to PDF/Excel
4. **Advanced Filtering**: Complex filter combinations
5. **Custom Dashboards**: User-configurable dashboard layouts
6. **Batch Operations**: Select multiple items for actions
7. **Undo/Redo**: Action history management
8. **Multi-language**: i18n support

## Troubleshooting

### Tab Not Showing
- Check role permissions in JavaScript
- Verify tab element exists in HTML
- Check browser console for errors

### Staff Form Not Submitting
- Verify form ID matches JavaScript references
- Check API endpoint URLs
- Verify CSRF token if required
- Check browser network tab for API responses

### Data Not Loading
- Check API endpoints are correct
- Verify user has correct permissions
- Check browser console for errors
- Verify data format matches expected schema

## Support & Contact

For issues or feature requests, contact the development team.

---

**Version**: 1.0
**Last Updated**: December 2025
**Status**: Production Ready
