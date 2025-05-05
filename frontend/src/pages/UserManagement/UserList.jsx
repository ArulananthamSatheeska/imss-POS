import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/NewAuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserModal from './UserModal';
import { PERMISSIONS } from '../../constants/permissions';
import { FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiPlus, FiSearch } from 'react-icons/fi';
import { BsFilter } from 'react-icons/bs';

const API_BASE_URL = 'https://imssposerp.com/backend/public/api';
const USERS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const { user: currentUser, checkPermission } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_BASE_URL}/users`, {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            setUsers(Array.isArray(response.data?.data) ? response.data.data : []);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch users';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/roles`, {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                });
                setRoles(response.data);
            } catch (error) {
                toast.error('Failed to fetch roles');
            }
        };

        if (currentUser?.token) {
            fetchRoles();
        }
    }, [currentUser?.token]);

    const validateForm = (userData) => {
        const errors = {};

        if (!userData.name) errors.name = 'Name is required';
        if (!userData.username) errors.username = 'Username is required';
        if (!userData.email) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) errors.email = 'Invalid email format';

        if (!userData.id && !userData.password) {
            errors.password = 'Password is required';
        } else if (userData.password && userData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (!userData.role) errors.role = 'Role is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (userData) => {
        if (!validateForm(userData)) return;

        try {
            if (userData.id) {
                // Update existing user - construct updateData with only expected fields
                const updateData = {
                    name: userData.name,
                    username: userData.username,
                    email: userData.email,
                    phone: userData.phone || '',
                    role: userData.role,
                    permissions: userData.permissions || [],
                    // Remove is_active to match backend expectations
                    // is_active: userData.is_active,
                };
                if (userData.password) {
                    updateData.password = userData.password;
                }

                await axios.put(`${API_BASE_URL}/users/${userData.id}`, updateData, {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                });
                toast.success("User updated successfully");
            } else {
                // Create new user - construct createData with only expected fields
                const createData = {
                    name: userData.name,
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    role: userData.role,
                    // Remove is_active to match backend expectations
                    // is_active: userData.is_active,
                    status: 'active', // Set status to active on create as backend expects
                };

                await axios.post(`${API_BASE_URL}/users`, createData, {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                });
                toast.success("User created successfully");
            }
            await fetchUsers();
            handleModalClose();
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                (userData.id ? 'Failed to update user' : 'Failed to create user');

            // Handle specific backend validation errors
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            }

            console.error('API error:', error.response);
            toast.error(errorMessage);
        }
    };

    const handleDelete = async (userId) => {
        // if (!checkPermission(PERMISSIONS.USER_DELETE)) {
        //     toast.error("You don't have permission to delete users");
        //     return;
        // }

        if (userId === currentUser.id) {
            toast.warning("You cannot delete your own account");
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await axios.delete(`${API_BASE_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            await fetchUsers();
            toast.success("User deleted successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleStatusChange = async (userId, isActive) => {
        // if (!checkPermission(PERMISSIONS.USER_CHANGE_STATUS)) {
        //     toast.error("You don't have permission to change user status");
        //     return;
        // }

        if (userId === currentUser.id) {
            toast.warning("You cannot change your own status");
            return;
        }

        try {
            await axios.patch(
                `${API_BASE_URL}/users/${userId}/status`,
                { is_active: !isActive },
                { headers: { Authorization: `Bearer ${currentUser.token}` } }
            );
            await fetchUsers();
            toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleAddUser = () => {
        // if (!checkPermission(PERMISSIONS.USER_CREATE)) {
        //     toast.error("You don't have permission to create users");
        //     return;
        // }
        setCurrentUserData({
            name: '',
            username: '',
            email: '',
            password: '',
            role: 'user',
            is_active: true
        });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        // if (!checkPermission(PERMISSIONS.USER_EDIT)) {
        //     toast.error("You don't have permission to edit users");
        //     return;
        // }
        setCurrentUserData({
            ...user,
            password: '' // Don't pre-fill password field for security
        });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setCurrentUserData(null);
        setFormErrors({});
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

            const matchesRole = selectedRoleFilter === 'all' || user.role === selectedRoleFilter;
            const matchesStatus = selectedStatusFilter === 'all' ||
                (selectedStatusFilter === 'active' && user.is_active) ||
                (selectedStatusFilter === 'inactive' && !user.is_active);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, debouncedSearchTerm, selectedRoleFilter, selectedStatusFilter]);

    const paginatedUsers = useMemo(() => {
        const indexOfLastUser = currentPage * USERS_PER_PAGE;
        const indexOfFirstUser = indexOfLastUser - USERS_PER_PAGE;
        return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    }, [filteredUsers, currentPage]);

    const totalPages = useMemo(() => Math.ceil(filteredUsers.length / USERS_PER_PAGE), [filteredUsers]);

    const renderStatusBadge = (isActive) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isActive ? (
                <>
                    <FiToggleRight className="mr-1" />
                    Active
                </>
            ) : (
                <>
                    <FiToggleLeft className="mr-1" />
                    Inactive
                </>
            )}
        </span>
    );

    const renderRoleBadge = (role) => {
        const roleColors = {
            superadmin: 'bg-red-100 text-red-800',
            admin: 'bg-purple-100 text-purple-800',
            editor: 'bg-blue-100 text-blue-800',
            user: 'bg-gray-100 text-gray-800'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
        );
    };

    const renderActionButtons = (user) => (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => handleEditUser(user)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors duration-200"
                title="Edit user"
            >
                <FiEdit2 className="w-4 h-4" />
            </button>
            <button
                onClick={() => handleStatusChange(user.id, user.is_active)}
                className={`p-2 rounded-full transition-colors duration-200 ${user.is_active
                    ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                    : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                    }`}
                title={user.is_active ? 'Deactivate user' : 'Activate user'}
                disabled={user.id === currentUser.id}
            >
                {user.is_active ? (
                    <FiToggleRight className="w-4 h-4" />
                ) : (
                    <FiToggleLeft className="w-4 h-4" />
                )}
            </button>
            <button
                onClick={() => handleDelete(user.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors duration-200"
                title="Delete user"
                disabled={user.id === currentUser.id}
            >
                <FiTrash2 className="w-4 h-4" />
            </button>
        </div>
    );

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pages.push(
                <button
                    key="first"
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                    &laquo;
                </button>
            );
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 rounded-md border ${currentPage === i
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            pages.push(
                <button
                    key="last"
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                    &raquo;
                </button>
            );
        }

        return (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{
                                Math.min((currentPage - 1) * USERS_PER_PAGE + 1, filteredUsers.length)
                            }</span> to {' '}
                            <span className="font-medium">{
                                Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)
                            }</span> of {' '}
                            <span className="font-medium">{filteredUsers.length}</span> results
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        {pages}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <UserModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleSubmit}
                userData={currentUserData}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                roles={roles}
                isCreating={!currentUserData?.id}
            />

            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage all registered users in the system
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={handleAddUser}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <FiPlus className="-ml-1 mr-2 h-4 w-4" />
                        Add User
                    </button>
                </div>
            </div>

            <div className="mb-6 bg-white shadow rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <BsFilter className="mr-2 h-4 w-4" />
                            Filters
                        </button>
                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1 px-3 space-y-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={selectedRoleFilter}
                                            onChange={(e) => setSelectedRoleFilter(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        >
                                            <option value="all">All Roles</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.name}>
                                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={selectedStatusFilter}
                                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            {error && (
                <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={fetchUsers}
                                    className="text-sm font-medium text-red-700 hover:text-red-600 transition-colors duration-200"
                                >
                                    Retry <span aria-hidden="true">&rarr;</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!loading && !error && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Active
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <span className="text-gray-600 font-medium">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderStatusBadge(user.is_active)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.last_active_at || 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {renderActionButtons(user)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center">
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Try adjusting your search or filter to find what you're looking for.
                                            </p>
                                            <div className="mt-6">
                                                <button
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setSelectedRoleFilter('all');
                                                        setSelectedStatusFilter('all');
                                                    }}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                >
                                                    <FiPlus className="-ml-1 mr-2 h-4 w-4" />
                                                    Add New User
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {renderPagination()}
                </div>
            )}
        </div>
    );
};

export default UserList;
