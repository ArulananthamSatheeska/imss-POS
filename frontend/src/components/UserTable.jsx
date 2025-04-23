import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserTable = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        };

        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        await axios.patch(`/api/users/${userId}`, { role: newRole });
        // Refresh user list after role change
        const response = await axios.get('/api/users');
        setUsers(response.data);
    };

    const handleDeleteUser = async (userId) => {
        await axios.delete(`/api/users/${userId}`);
        // Refresh user list after deletion
        const response = await axios.get('/api/users');
        setUsers(response.data);
    };

    return (
        <div>
            <h2>User Management</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                                <select
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </td>
                            <td>
                                <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;
