export const roles = [
    {
        id: 1,
        name: 'Cashier',
        permissions: {
            POS: ['Add', 'View'],
            Item: ['View'],
            CustomerCreate: ['Add', 'View'],
            Unit: ['View'],
            Categories: ['View'],
            StoreLocations: ['View'],
            SalesReturn: ['View'],
        },
    },
    {
        id: 2,
        name: 'Accountant/Manager',
        permissions: {
            Item: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            CustomerCreate: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            Unit: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            Categories: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            StoreLocations: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            Purchasing: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            PurchasingOrder: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            PurchasingReturn: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            SalesInvoice: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            SalesOrder: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            SalesReturn: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            FinancialAccounting: ['Add', 'Modify', 'Delete', 'View', 'Print'],
        },
    },
    {
        id: 3,
        name: 'Storekeeper',
        permissions: {
            Item: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            CustomerCreate: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            Unit: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            Categories: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            StoreLocations: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            Purchasing: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            PurchasingOrder: ['Add', 'Modify', 'Delete', 'View', 'Print'],
            PurchasingReturn: ['Add', 'Modify', 'Delete', 'View', 'Print'],
        },
    },
    {
        id: 4,
        name: 'admin',
        permissions: {
            // Admin has all permissions
        },
    },
    {
        id: 5,
        name: 'superadmin',
        permissions: {
            // Superadmin has all permissions
        },
    }
];
