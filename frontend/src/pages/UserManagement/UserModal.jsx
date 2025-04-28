import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const UserModal = ({ isOpen, onClose, onSubmit, userData, formErrors, setFormErrors, showPassword, setShowPassword, roles, isCreating }) => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        role: 'user',
        password: '',
        password_confirmation: '',
        is_active: true
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name || '',
                username: userData.username || '',
                email: userData.email || '',
                role: userData.role || 'user',
                password: '',
                password_confirmation: '',
                is_active: userData.is_active !== undefined ? userData.is_active : true,
                id: userData.id || null
            });
        } else {
            setFormData({
                name: '',
                username: '',
                email: '',
                role: 'user',
                password: '',
                password_confirmation: '',
                is_active: true,
                id: null
            });
        }
        setErrors({});
    }, [userData, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        setFormErrors({});

        if (formData.password !== formData.password_confirmation) {
            setErrors({ password_confirmation: ['Passwords do not match'] });
            setIsSubmitting(false);
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                setFormErrors(error.response.data.errors);
            } else {
                setErrors({ general: ['An unexpected error occurred. Please try again.'] });
                setFormErrors({ general: ['An unexpected error occurred. Please try again.'] });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, y: -50, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                damping: 25,
                stiffness: 500
            }
        },
        exit: { opacity: 0, y: 50, scale: 0.95 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={backdropVariants}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-gray-50">
                            <h3 className="text-xl font-semibold text-gray-800">
                                {userData ? 'Edit User' : 'Add New User'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                disabled={isSubmitting}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {errors.general && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                                    <p className="text-red-700">{errors.general[0]}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.name[0]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                        Username <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username || ''}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border ${errors.username ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                        required
                                    />
                                    {errors.username && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.username[0]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                        required
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.email[0]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                        Role
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role || ''}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                                    >
                                        {roles && roles.length > 0 ? (
                                            roles.map((role) => (
                                                <option key={role.id} value={role.name}>
                                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="user">User</option>
                                        )}
                                    </select>
                                </div>

                                {isCreating && (
                                    <>
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                                Password <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                name="password"
                                                value={formData.password || ''}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                                required={isCreating}
                                                minLength="8"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                                            {errors.password && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.password[0]}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm Password <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                value={formData.password_confirmation || ''}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border ${errors.password_confirmation ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                                                required={isCreating}
                                            />
                                            {errors.password_confirmation && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.password_confirmation[0]}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                        Active
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : isCreating ? 'Create User' : 'Update User'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UserModal;
