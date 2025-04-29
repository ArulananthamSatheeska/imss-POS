import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiX, FiCheck, FiSave, FiUserPlus, FiUser, FiLock, FiInfo, FiShield, FiShoppingCart, FiPackage, FiDollarSign, FiSettings, FiUsers, FiFileText, FiClipboard, FiTruck, FiHome, FiGrid, FiTag, FiPrinter, FiCalendar, FiPieChart, FiLayers, FiDatabase, FiTool, FiBarChart2 } from 'react-icons/fi';
import { FiEye, FiPlus, FiEdit, FiTrash, FiCheckCircle, FiChevronDown } from 'react-icons/fi';
const PAGE_CATEGORIES = [
    {
        name: 'Dashboard',
        icon: <FiHome />,
        pages: [
            { path: 'dashboard', name: 'Dashboard' }
        ]
    },
    {
        name: 'Inventory Management',
        icon: <FiPackage />,
        pages: [
            { path: 'items', name: 'Items Management' },
            { path: 'expiry', name: 'Expiry Management' },
            { path: 'store-locations', name: 'Store Locations' },
            { path: 'StockReport', name: 'Stock Report' },
            { path: 'ItemWiseStockReport', name: 'Item Wise Report' },
            { path: 'StockRecheck', name: 'Stock Recheck' },
            { path: 'BarcodePage', name: 'Barcode Management' },
            { path: 'StockTransfer', name: 'Stock Transfer' }
        ]
    },
    {
        name: 'Purchasing',
        icon: <FiShoppingCart />,
        pages: [
            { path: 'purchasing', name: 'Purchasing' },
            { path: 'PurchaseReturn', name: 'Purchase Return' },
            { path: 'PurchaseInvoice', name: 'Purchase Invoice' },
            { path: 'PurchaseOrder', name: 'Purchase Order' },
            { path: 'suppliers', name: 'Suppliers' },
            { path: 'SupplierForm', name: 'Supplier Form' }
        ]
    },
    {
        name: 'Sales',
        icon: <FiDollarSign />,
        pages: [
            { path: 'sales', name: 'Sales' },
            { path: 'SalesReturn', name: 'Sales Return' },
            { path: 'Customers', name: 'Customer Management' },
            { path: 'SalesInvoice', name: 'Sales Invoice' },
            { path: 'quotation', name: 'Quotation' },
            { path: 'DiscountScheam', name: 'Discount Schemes' }
        ]
    },
    {
        name: 'POS',
        icon: <FiPrinter />,
        pages: [
            { path: 'pos', name: 'POS' },
            { path: 'touchpos', name: 'Touch POS' },
            { path: 'billPrintModel', name: 'Bill Printing' }
        ]
    },
    {
        name: 'Production',
        icon: <FiTool />,
        pages: [
            { path: 'production', name: 'Production' },
            { path: 'MakeProductForm', name: 'Make Product' },
            { path: 'ProductModal', name: 'Product Management' },
            { path: 'ProductionCategoryModal', name: 'Production Categories' },
            { path: 'RawMaterialModal', name: 'Raw Materials' }
        ]
    },
    {
        name: 'Reports & Analytics',
        icon: <FiBarChart2 />,
        pages: [
            { path: 'reports', name: 'Reports Dashboard' },
            { path: 'ReportTable', name: 'Report Table' },
            { path: 'DailyProfit', name: 'Daily Profit' },
            { path: 'BillWiseProfit', name: 'Bill Wise Profit' },
            { path: 'CompanyWiseProfit', name: 'Company Wise Profit' },
            { path: 'SupplierWiseProfit', name: 'Supplier Wise Profit' },
            { path: 'Outstanding', name: 'Outstanding' }
        ]
    },
    {
        name: 'Administration',
        icon: <FiSettings />,
        pages: [
            { path: 'settings', name: 'System Settings' },
            { path: 'CreateCompany', name: 'Company Setup' },
            { path: 'CalculatorModal', name: 'Calculator' }
        ]
    },
    {
        name: 'User Management',
        icon: <FiUsers />,
        pages: [
            { path: 'UserList', name: 'Users' },
            { path: 'UserModal', name: 'User Management' },
            { path: 'RoleList', name: 'Role Management' },
            { path: 'PERMISSIONS', name: 'Permissions' },
            { path: 'RecycleBin', name: 'Recycle Bin' }
        ]
    },
    {
        name: 'Staff Management',
        icon: <FiUsers />,
        pages: [
            { path: 'StaffManagement', name: 'Staff' },
            { path: 'StaffRegistration', name: 'Staff Registration' },
            { path: 'RoleBasedAccessControl', name: 'Access Control' },
            { path: 'AttendanceShiftManagement', name: 'Attendance & Shifts' },
            { path: 'PayrollSalaryManagement', name: 'Payroll & Salary' },
            { path: 'Approvels', name: 'Approvals' }
        ]
    },
    {
        name: 'Task Management',
        icon: <FiClipboard />,
        pages: [
            { path: 'HomePage', name: 'Task Manager' },
            { path: 'ProjectsPage', name: 'Projects' },
            { path: 'TasksPage', name: 'Tasks' },
            { path: 'SubtasksPage', name: 'Subtasks' },
            { path: 'ReportPage', name: 'Task Reports' },
            { path: 'ProjectForm', name: 'Project Form' },
            { path: 'SubtaskForm', name: 'Subtask Form' },
            { path: 'TaskForm', name: 'Task Form' }
        ]
    },
    {
        name: 'Reference Data',
        icon: <FiDatabase />,
        pages: [
            { path: 'categories', name: 'Categories' },
            { path: 'CategoryForm', name: 'Category Form' },
            { path: 'units', name: 'Units' },
            { path: 'UnitForm', name: 'Unit Form' }
        ]
    }
];

const DEFAULT_ACTIONS = [
    { action: 'view', label: 'View', icon: <FiEye /> },
    { action: 'create', label: 'Create', icon: <FiPlus /> },
    { action: 'edit', label: 'Edit', icon: <FiEdit /> },
    { action: 'delete', label: 'Delete', icon: <FiTrash /> },
    { action: 'approve', label: 'Approve', icon: <FiCheckCircle /> },
    { action: 'manage', label: 'Manage', icon: <FiSettings /> }
];

const RoleModal = ({
    isOpen = false,
    onClose = () => { },
    onSubmit = () => { },
    roleData = null
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState({});
    const [activeTab, setActiveTab] = useState('details');
    const [expandedCategories, setExpandedCategories] = useState({});

    useEffect(() => {
        if (roleData) {
            setName(roleData.name || '');
            setDescription(roleData.description || '');
            setPermissions(roleData.permissions || {});

            // Expand all categories that have permissions
            const categoriesWithPermissions = {};
            PAGE_CATEGORIES.forEach(category => {
                category.pages.forEach(page => {
                    if (roleData.permissions?.[page.path]) {
                        categoriesWithPermissions[category.name] = true;
                    }
                });
            });
            setExpandedCategories(categoriesWithPermissions);
        } else {
            setName('');
            setDescription('');
            setPermissions({});
            setExpandedCategories({});
        }
    }, [roleData]);

    const togglePermission = (page, action) => {
        setPermissions(prev => {
            const newPerms = { ...prev };

            if (!newPerms[page]) {
                newPerms[page] = [];
            }

            if (newPerms[page].includes(action)) {
                newPerms[page] = newPerms[page].filter(a => a !== action);
                if (newPerms[page].length === 0) {
                    delete newPerms[page];
                }
            } else {
                newPerms[page] = [...newPerms[page], action];
            }

            return newPerms;
        });
    };

    const hasPermission = (page, action) => {
        return permissions[page]?.includes(action) || false;
    };

    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Role name is required');
            return;
        }

        onSubmit({
            id: roleData?.id,
            name: name.trim(),
            description: description.trim(),
            permissions: permissions,
        });
    };

    const countSelectedPermissions = () => {
        return Object.values(permissions).reduce((count, actions) => count + actions.length, 0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        {roleData ? (
                            <>
                                <FiUser className="text-white text-xl" />
                                <h2 className="text-xl font-bold text-white">
                                    Edit Role: {roleData.name}
                                </h2>
                            </>
                        ) : (
                            <>
                                <FiUserPlus className="text-white text-xl" />
                                <h2 className="text-xl font-bold text-white">
                                    Create New Role
                                </h2>
                            </>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-blue-100 transition-colors"
                    >
                        <FiX className="text-xl" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`py-3 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'details'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <FiInfo />
                            <span>Details</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('permissions')}
                            className={`py-3 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'permissions'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <FiShield />
                            <span>Permissions</span>
                            {countSelectedPermissions() > 0 && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {countSelectedPermissions()}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role Name *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="e.g., Administrator, Manager"
                                        autoFocus
                                        required
                                    />
                                    <FiLock className="absolute right-3 top-2.5 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="Describe the purpose of this role..."
                                    rows={3}
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="flex items-start">
                                    <FiInfo className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                    <p className="text-sm text-blue-700">
                                        After filling out the basic details, switch to the Permissions tab to configure what this role can access.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                        <FiShield className="mr-2 text-blue-600" />
                                        Page Permissions Configuration
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Configure what pages and actions this role can access
                                    </p>
                                </div>
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {countSelectedPermissions()} permissions selected
                                </div>
                            </div>

                            {/* Permissions Grid */}
                            <div className="mt-4 space-y-4">
                                {PAGE_CATEGORIES.map(category => (
                                    <div key={category.name} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleCategory(category.name)}
                                            className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-gray-700">{category.icon}</span>
                                                <span className="font-medium text-gray-800">{category.name}</span>
                                            </div>
                                            <FiChevronDown
                                                className={`text-gray-500 transition-transform ${expandedCategories[category.name] ? 'transform rotate-180' : ''}`}
                                            />
                                        </button>

                                        {expandedCategories[category.name] && (
                                            <div className="p-2 bg-white">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Page
                                                            </th>
                                                            {DEFAULT_ACTIONS.map((action) => (
                                                                <th
                                                                    key={action.action}
                                                                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    <div className="flex flex-col items-center">
                                                                        {action.icon}
                                                                        <span className="mt-1">{action.label}</span>
                                                                    </div>
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {category.pages.map(page => (
                                                            <tr key={page.path} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                                    {page.name}
                                                                </td>
                                                                {DEFAULT_ACTIONS.map(action => (
                                                                    <td
                                                                        key={`${page.path}-${action.action}`}
                                                                        className="px-3 py-4 whitespace-nowrap text-center"
                                                                    >
                                                                        <button
                                                                            onClick={() => togglePermission(page.path, action.action)}
                                                                            className={`w-8 h-8 rounded-md flex items-center justify-center mx-auto transition-colors ${hasPermission(page.path, action.action)
                                                                                ? 'bg-green-400 hover:bg-green-500'
                                                                                : 'bg-gray-600 hover:bg-gray-400'
                                                                                }`}
                                                                        >
                                                                            {hasPermission(page.path, action.action) && (
                                                                                <FiCheck className="text-red-500 text-lg" />
                                                                            )}
                                                                        </button>
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 text-sm text-gray-500 flex items-center">
                                <FiInfo className="mr-2 text-gray-400" />
                                <span>
                                    Click the cells to toggle permissions. "View" grants access to the page,
                                    other actions control what operations can be performed.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 rounded-b-xl px-6 py-4 flex justify-between items-center border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                        {activeTab === 'permissions' && (
                            <span>{countSelectedPermissions()} permissions selected</span>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                        >
                            <FiX />
                            <span>Cancel</span>
                        </button>
                        {activeTab === 'details' ? (
                            <button
                                type="button"
                                onClick={() => setActiveTab('permissions')}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                            >
                                <span>Continue to Permissions</span>
                                <FiCheck />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className={`px-4 py-2 rounded-lg text-white flex items-center space-x-2 transition-colors ${!name.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                disabled={!name.trim()}
                            >
                                <FiSave />
                                <span>{roleData ? 'Update Role' : 'Create Role'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

RoleModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    roleData: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        description: PropTypes.string,
        permissions: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
    }),
};

export default RoleModal;