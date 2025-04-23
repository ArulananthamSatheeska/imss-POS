export const predefinedRoles = [
    {
        name: 'Admin / Super Admin',
        description: 'Full access to all features and settings. Manage users, permissions, products, reports, and configurations. Override transactions and access logs.',
    },
    {
        name: 'Manager',
        description: 'View and manage sales, stock, and employees. Approve or reject stock transfers, item updates, discounts. Access detailed reports (daily, monthly sales, top-selling items). Limited access to user management.',
    },
    {
        name: 'Cashier / Salesperson',
        description: 'Perform sales and billing operations. Apply discounts (if permitted). View product details and stock availability. No access to sensitive data like reports or stock management.',
    },
    {
        name: 'Inventory Clerk / Stock Manager',
        description: 'Manage inventory, stock-in, stock-out, and stock transfers. Add/edit products (if allowed). View stock reports.',
    },
    {
        name: 'Accountant / Finance',
        description: 'View financial reports. Manage payments, refunds, and reconcile accounts. No access to sales terminal or inventory.',
    },
    {
        name: 'Approver',
        description: 'Can review and approve requests (e.g., item edits, transfers, deletions). May be limited to certain departments (e.g., only approving stock transfers).',
    },
    {
        name: 'Auditor / Viewer',
        description: 'Read-only access to transactions and logs. Cannot make any changes. Useful for third-party auditors or system monitoring.',
    },
];
