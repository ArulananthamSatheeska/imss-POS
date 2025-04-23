import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { roles as predefinedRoles } from '../../config/roles';

const RoleModal = ({ isOpen, onClose, onSubmit, roleData }) => {
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState({});

    useEffect(() => {
        if (roleData) {
            setName(roleData.name || '');
            const permsObj = {};
            if (roleData.permissions) {
                Object.entries(roleData.permissions).forEach(([module, perms]) => {
                    permsObj[module] = new Set(perms);
                });
            }
            setPermissions(permsObj);
        } else {
            setName('');
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

    const handleSubmit = () => {
        const permsToSubmit = {};
        Object.entries(permissions).forEach(([module, actionsSet]) => {
            permsToSubmit[module] = Array.from(actionsSet);
        });
        onSubmit({
            id: roleData?.id,
            name: name.trim(),
            permissions: permsToSubmit,
        });
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        >
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
                <h2 id="role-modal-title" className="text-xl font-semibold mb-4">
                    {roleData ? 'Edit Role' : 'Add Role'}
                </h2>
                <div className="mb-4">
                    <label htmlFor="roleName" className="block mb-1 font-medium">
                        Role Name
                    </label>
                    <input
                        id="roleName"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        autoFocus
                    />
                </div>
                <div className="mb-4">
                    <h3 className="font-medium mb-2">Permissions</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300">
                            <thead>
                                <tr>
                                    <th className="border border-gray-300 px-2 py-1 text-left">Module</th>
                                    {actions.map(action => (
                                        <th key={action} className="border border-gray-300 px-2 py-1 text-center">
                                            {action}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {modules.map(module => {
                                    const moduleActions = actions;
                                    const allSelected = moduleActions.every(action => permissions[module]?.has(action));
                                    return (
                                        <tr key={module}>
                                            <td className="border border-gray-300 px-2 py-1">
                                                <div className="flex items-center space-x-2">
                                                    <span>{module}</span>
                                                    <label className="inline-flex items-center space-x-1 ml-2 cursor-pointer select-none text-sm">
                                                        <input
                                                            type="checkbox"
                                                            aria-label={`Select all permissions for ${module}`}
                                                            checked={allSelected}
                                                            onChange={() => {
                                                                if (allSelected) {
                                                                    // Deselect all
                                                                    setPermissions(prev => {
                                                                        const newPerms = { ...prev };
                                                                        delete newPerms[module];
                                                                        return newPerms;
                                                                    });
                                                                } else {
                                                                    // Select all
                                                                    setPermissions(prev => {
                                                                        const newPerms = { ...prev };
                                                                        newPerms[module] = new Set(moduleActions);
                                                                        return newPerms;
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                        <span>All Access</span>
                                                    </label>
                                                </div>
                                            </td>
                                            {moduleActions.map(action => (
                                                <td key={action} className="border border-gray-300 px-2 py-1 text-center">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`${module} ${action}`}
                                                        checked={permissions[module]?.has(action) || false}
                                                        onChange={() => togglePermission(module, action)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        disabled={!name.trim()}
                    >
                        {roleData ? 'Update' : 'Create'}
                    </button>
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
        permissions: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
    }),
};

RoleModal.defaultProps = {
    roleData: null,
};

export default RoleModal;
