import React, { useState } from 'react';

const StaffRegistration = () => {
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        address: '',
        role: '',
        photo: null,
        nic: null,
        contract: null,
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Data:', formData);
        // Add your form submission logic here (e.g., API call)
    };

    return (
        <div className="p-8 bg-slate-50 dark:bg-slate-800 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Staff Registration & Profiles</h1>
            {/* Staff Registration Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                            required
                        />
                    </div>

                    {/* Contact */}
                    <div>
                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contact Number
                        </label>
                        <input
                            type="tel"
                            id="contact"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                            required
                        />
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Address
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                            rows={3}
                            required
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                            required
                        >
                            <option value="">Select Role</option>
                            <option value="Admin">Admin</option>
                            <option value="Cashier">Cashier</option>
                            <option value="Manager">Manager</option>
                            <option value="Waiter">Waiter</option>
                        </select>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Photo
                        </label>
                        <input
                            type="file"
                            id="photo"
                            name="photo"
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                            accept="image/*"
                        />
                    </div>

                    {/* NIC Upload */}
                    <div>
                        <label htmlFor="nic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            NIC Document
                        </label>
                        <input
                            type="file"
                            id="nic"
                            name="nic"
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                            accept=".pdf,.doc,.docx"
                        />
                    </div>

                    {/* Contract Upload */}
                    <div>
                        <label htmlFor="contract" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contract Document
                        </label>
                        <input
                            type="file"
                            id="contract"
                            name="contract"
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                            accept=".pdf,.doc,.docx"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
                    >
                        Register Staff
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StaffRegistration;