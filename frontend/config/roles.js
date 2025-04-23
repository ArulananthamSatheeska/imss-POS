export const ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    CASHIER: 'cashier'
};

export const PERMISSIONS = {
    // User Management
    USER_VIEW: 'UserManagement.View',
    USER_CREATE: 'UserManagement.Create',
    USER_EDIT: 'UserManagement.Edit',
    USER_DELETE: 'UserManagement.Delete',

    // Product Management
    PRODUCT_VIEW: 'Product.View',
    PRODUCT_CREATE: 'Product.Create',
    PRODUCT_EDIT: 'Product.Edit',
    PRODUCT_DELETE: 'Product.Delete',

    // Sales
    SALE_VIEW: 'Sales.View',
    SALE_CREATE: 'Sales.Create',
    SALE_EDIT: 'Sales.Edit',
    SALE_DELETE: 'Sales.Delete',

    // Reports
    REPORT_VIEW: 'Reports.View'
};

export const MODULES = {
    USER_MANAGEMENT: 'UserManagement',
    PRODUCT: 'Product',
    CATEGORY: 'Category',
    STORE_LOCATION: 'StoreLocation',
    SUPPLIER: 'Supplier',
    UNIT: 'Unit',
    SALES: 'Sales',
    PURCHASING: 'Purchasing',
    REPORTS: 'Reports'
};

export const DEFAULT_ROLES = {
    [ROLES.SUPERADMIN]: Object.values(PERMISSIONS),
    [ROLES.ADMIN]: [
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_EDIT,
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_EDIT,
        PERMISSIONS.SALE_VIEW,
        PERMISSIONS.SALE_CREATE,
        PERMISSIONS.REPORT_VIEW
    ],
    [ROLES.MANAGER]: [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.SALE_VIEW,
        PERMISSIONS.SALE_CREATE,
        PERMISSIONS.REPORT_VIEW
    ],
    [ROLES.STAFF]: [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.SALE_VIEW,
        PERMISSIONS.SALE_CREATE
    ],
    [ROLES.CASHIER]: [
        PERMISSIONS.SALE_VIEW,
        PERMISSIONS.SALE_CREATE
    ]
};
