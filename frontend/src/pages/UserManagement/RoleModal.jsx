import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { roles as predefinedRoles } from '../../config/roles';
import { FiX, FiCheck, FiSave, FiUserPlus, FiUser, FiLock, FiCheckSquare, FiSquare, FiInfo, FiShield } from 'react-icons/fi';

const RoleModal = ({ isOpen, onClose, onSubmit, roleData }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState({});
    const [activeTab, setActiveTab] = useState('permissions');

    useEffect(() => {
        if (roleData) {
            setName(roleData.name || '');
            setDescription(roleData.description || '');
            const permsObj = {};
            if (roleData.permissions) {
                Object.entries(roleData.permissions).forEach(([module, perms]) => {
                    permsObj[module] = new Set(perms);
                });
            }
            setPermissions(permsObj);
        } else {
            setName('');
            setDescription('');
            setPermissions({});
        }
    }, [roleData]);

    if (!isOpen) return null;

    // Collect all unique modules and actions from predefined roles
    const allModules = new Set();
    const allActions = new Set();

    predefinedRoles.forEach(role => {
        Object.entries(role.permissions).forEach(([module, actions]) => {
            allModules.add(module);
            actions.forEach(action => allActions.add(action));
        });
    });

    const modules = Array.from(allModules).sort();
    const actions = Array.from(allActions).sort();

    const togglePermission = (module, action) => {
        setPermissions(prev => {
            const newPerms = { ...prev };
            if (!newPerms[module]) {
                newPerms[module] = new Set();
            }
            if (newPerms[module].has(action)) {
                newPerms[module].delete(action);
                if (newPerms[module].size === 0) {
                    delete newPerms[module];
                }
            } else {
                newPerms[module].add(action);
            }
            return newPerms;
        });
    };

    const toggleAllModulePermissions = (module) => {
        const moduleActions = actions;
        const allCurrentlySelected = moduleActions.every(action => permissions[module]?.has(action));

        setPermissions(prev => {
            const newPerms = { ...prev };
            if (allCurrentlySelected) {
                delete newPerms[module];
            } else {
                newPerms[module] = new Set(moduleActions);
            }
            return newPerms;
        });
    };

    const handleSubmit = () => {
        const permsToSubmit = {};
        Object.entries(permissions).forEach(([module, actionsSet]) => {
            permsToSubmit[module] = Array.from(actionsSet);
        });
        onSubmit({
            id: roleData?.id,
            name: name.trim(),
            description: description.trim(),
            permissions: permsToSubmit,
        });
    };

    const countSelectedPermissions = () => {
        let count = 0;
        Object.values(permissions).forEach(actions => {
            count += actions.size;
        });
        return count;
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        {roleData ? (
                            <>
                                <FiUser className="text-white text-xl" />
                                <h2 id="role-modal-title" className="text-xl font-bold text-white">
                                    Edit Role: {roleData.name}
                                </h2>
                            </>
                        ) : (
                            <>
                                <FiUserPlus className="text-white text-xl" />
                                <h2 id="role-modal-title" className="text-xl font-bold text-white">
                                    Create New Role
                                </h2>
                            </>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-blue-100 transition-colors"
                        aria-label="Close modal"
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
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Role Name *
                                </label>
                                <div className="relative">
                                    <input
                                        id="roleName"
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="e.g., Administrator, Manager"
                                        autoFocus
                                        required
                                    />
                                    <FiLock className="absolute right-3 top-2.5 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="roleDescription"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
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
                    )}

                    {activeTab === 'permissions' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                        <FiShield className="mr-2 text-blue-600" />
                                        Permissions Configuration
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Select the actions this role can perform
                                    </p>
                                </div>
                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {countSelectedPermissions()} permissions selected
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                                    Module
                                                </th>
                                                {actions.map(action => (
                                                    <th key={action} scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        {action}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {modules.map(module => {
                                                const moduleActions = actions;
                                                const allSelected = moduleActions.every(action => permissions[module]?.has(action));
                                                const someSelected = !allSelected && moduleActions.some(action => permissions[module]?.has(action));

                                                return (
                                                    <tr key={module} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAllModulePermissions(module)}
                                                                    className="flex items-center space-x-2 group"
                                                                >
                                                                    {allSelected ? (
                                                                        <FiCheckSquare className="text-blue-600 group-hover:text-blue-800" />
                                                                    ) : someSelected ? (
                                                                        <div className="relative w-4 h-4 border border-blue-300 rounded bg-blue-50">
                                                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-0.5 bg-blue-500"></div>
                                                                        </div>
                                                                    ) : (
                                                                        <FiSquare className="text-gray-400 group-hover:text-gray-600" />
                                                                    )}
                                                                    <span className="font-medium text-gray-900 group-hover:text-blue-700 ml-2">
                                                                        {module}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        {moduleActions.map(action => {
                                                            const isChecked = permissions[module]?.has(action);
                                                            return (
                                                                <td key={action} className="px-3 py-4 whitespace-nowrap text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => togglePermission(module, action)}
                                                                        className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors ${isChecked
                                                                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                                            }`}
                                                                        aria-label={`${module} ${action} permission`}
                                                                    >
                                                                        {isChecked && <FiCheck className="text-sm" />}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-500 flex items-center">
                                <FiInfo className="mr-2 text-gray-400" />
                                <span>Use the checkboxes to grant specific permissions or click the module name to select all.</span>
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
                        {activeTab === 'details' && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('permissions')}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                            >
                                <span>Continue to Permissions</span>
                                <FiCheck />
                            </button>
                        )}
                        {activeTab === 'permissions' && (
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

RoleModal.defaultProps = {
    roleData: null,
};

export default RoleModal;