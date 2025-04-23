import React, { useState } from 'react';
import axios from 'axios';

const UserForm = ({ onClose, user }) => {
    const [formData, setFormData] = useState({
        name: user ? user.name : '',
        email: user ? user.email : '',
        role: user ? user.role : 'staff',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (user) {
            // Update existing user
            await axios.patch(`/api/users/${user.id}`, formData);
        } else {
            // Create new user
            await axios.post('/api/register', formData);
        }
        onClose(); // Close the form after submission
    };

    return (
        <div>
            <h2>{user ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="staff">Staff</option>
                </select>
                <button type="submit">{user ? 'Update' : 'Create'}</button>
                <button type="button" onClick={onClose}>Cancel</button>
            </form>
        </div>
    );
};

export default UserForm;
