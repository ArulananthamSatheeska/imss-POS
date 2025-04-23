import React, { useState } from 'react';

const RoleBasedAccessControl = () => {
    // Define roles and their permissions based on the PDF structure
    const [roles, setRoles] = useState([
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
    ]);

    const [newRoleName, setNewRoleName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState({});

    // List of modules and actions
    const modules = [
        'POS',
        'Item',
        'CustomerCreate',
        'Unit',
        'Categories',
        'StoreLocations',
        'Purchasing',
        'PurchasingOrder',
        'PurchasingReturn',
        'SalesInvoice',
        'SalesOrder',
        'SalesReturn',
        'FinancialAccounting',
    ];

    const actions = ['Add', 'Modify', 'Delete', 'View', 'Print'];

    // Handle adding a new role
    const handleAddRole = (e) => {
        e.preventDefault();
        if (newRoleName && Object.keys(selectedPermissions).length > 0) {
            const newRole = {
                id: roles.length + 1,
                name: newRoleName,
                permissions: selectedPermissions,
            };
            setRoles([...roles, newRole]);
            setNewRoleName('');
            setSelectedPermissions({});
        }
    };

    // Handle permission selection for a module
    const handlePermissionChange = (module, action) => {
        const updatedPermissions = { ...selectedPermissions };
        if (!updatedPermissions[module]) {
            updatedPermissions[module] = [];
        }
        if (updatedPermissions[module].includes(action)) {
            updatedPermissions[module] = updatedPermissions[module].filter((a) => a !== action);
        } else {
            updatedPermissions[module].push(action);
        }
        setSelectedPermissions(updatedPermissions);
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-slate-600 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Role-Based Access Control (RBAC)</h1>
            {/* Add Role Form */}
            <div className="bg-white border w-full border-cyan-950 dark:bg-slate-700 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Create New Role</h2>
                <form onSubmit={handleAddRole} className='bg-slate-400 w-full dark:bg-slate-800 text-black dark:text-white'>
                    <div className="mb-4">
                        <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Role Name
                        </label>
                        <input
                            type="text"
                            id="roleName"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                            placeholder="Enter role name"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</label>
                        <div className="mt-2 space-y-4">
                            {modules.map((module) => (
                                <div key={module} className="space-y-2">
                                    <h3 className="text-md font-medium text-gray-800 dark:text-white">{module}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full">
                                        {actions.map((action) => (
                                            <div key={action} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`${module}-${action}`}
                                                    checked={selectedPermissions[module]?.includes(action) || false}
                                                    onChange={() => handlePermissionChange(module, action)}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-slate-800 dark:border-gray-600"
                                                />
                                                <label
                                                    htmlFor={`${module}-${action}`}
                                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                                >
                                                    {action}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
                    >
                        Add Role
                    </button>
                </form>
            </div>

            {/* Roles List */}
            <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Existing Roles</h2>
                <div className='grid grid-cols-3'>
                    {roles.map((role) => (
                        <div className="">
                            <div key={role.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{role.name}</h3>
                                <div className="mt-0">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Permissions:</h4>
                                    <div className="space-y-2 mt-1">
                                        {Object.entries(role.permissions).map(([module, actions]) => (
                                            <div key={module} className="space-y-1">
                                                <h5 className="text-sm font-medium text-gray-800 dark:text-white">{module}</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {actions.map((action) => (
                                                        <span
                                                            key={action}
                                                            className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full dark:bg-blue-800 dark:text-blue-100"
                                                        >
                                                            {action}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoleBasedAccessControl;