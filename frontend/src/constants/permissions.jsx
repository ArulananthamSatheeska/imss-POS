// src/context/PermissionsContext.jsx
import React, { createContext, useContext, useState } from "react";

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState({});

    const loadPermissions = (newPermissions) => {
        setPermissions(newPermissions);
    };

    return (
        <PermissionsContext.Provider value={{ permissions, loadPermissions }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => useContext(PermissionsContext);

// permissions.js (or permissions.jsx)
export const PERMISSIONS = {
    USER_CREATE: 'user:create',
    USER_EDIT: 'user:edit',
    ITEM_CREATE: 'items:create',
    ITEM_READ: 'items:read',
    DASHBOARD_VIEW: 'dashboard:view',
    // Add more as needed
};
