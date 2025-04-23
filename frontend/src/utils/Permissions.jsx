// utils/permissions.js
export const hasPermission = (user, requiredPermission) => {
    if (!user || !user.permissions) return false;

    // Check if user has the exact permission
    if (user.permissions[requiredPermission]) return true;

    // Optional: Check wildcard permissions (e.g., "admin/*")
    const permissionParts = requiredPermission.split('/');
    if (permissionParts.length > 1) {
        const wildcardPath = `${permissionParts[0]}/*`;
        if (user.permissions[wildcardPath]) return true;
    }

    return false;
};

// Permission definitions (adjust based on your needs)
export const PERMISSIONS = {
    DASHBOARD: 'dashboard/view',
    USER_MANAGEMENT: 'users/manage',
    AUDIT_LOGS: 'audit/logs',
    // Add all your page permissions here
};