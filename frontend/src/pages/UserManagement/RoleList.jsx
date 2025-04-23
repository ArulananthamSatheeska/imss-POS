import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiTrash2, FiEdit2, FiPlus, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../context/NewAuthContext';
import RoleModal from './RoleModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const RoleList = () => {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const { checkPermission } = useAuth();

    useEffect(() => {
        fetchRoles();
    }, [currentPage, navigate, checkPermission, searchTerm]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/roles?page=${currentPage}&search=${searchTerm}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data && Array.isArray(response.data)) {
                setRoles(response.data);
                setTotalPages(1);
            } else if (response.data && response.data.data) {
                setRoles(response.data.data || []);
                setTotalPages(response.data.last_page || 1);
            } else {
                setRoles([]);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch roles');
            toast.error(err.response?.data?.message || 'Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/roles/${roleId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Role deleted successfully");
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete role');
        }
    };

    const handleEditRole = (role) => {
        setSelectedRole(role);
        setIsModalOpen(true);
    };

    const handleAddRole = () => {
        setSelectedRole(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedRole(null);
    };

    const handleSubmit = async (roleData) => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: roleData.name,
                description: roleData.description || '',
                permissions: roleData.permissions || []
            };

            if (roleData.id) {
                await axios.put(`/api/roles/${roleData.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Role updated successfully");
            } else {
                await axios.post('/api/roles', payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Role created successfully");
            }

            fetchRoles();
            handleModalClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit role');
        }
    };


    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Role Management</h1>
                <button
                    onClick={handleAddRole}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                >
                    <FiPlus className="inline mr-1" /> Add Role
                </button>
            </div>

            <div className="mb-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search roles..."
                        className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading && <div className="text-center py-4">Loading roles...</div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {roles.length === 0 && !loading ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                    No roles found
                                </td>
                            </tr>
                        ) : (
                            roles.map((role) => (
                                <tr key={role.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{role.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions?.map(permission => (
                                                <span key={permission} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                                    {permission}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleEditRole(role)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <FiEdit2 className="inline" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRole(role.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <FiTrash2 className="inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


            <RoleModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleSubmit}
                roleData={selectedRole}
            />

        </div>
    );
};

export default RoleList;
