import React, { useState } from 'react';
import UserList from './UserList';
import UserForm from './UserForm';

const UserManagement = () => {
    const [refresh, setRefresh] = useState(false);

    const fetchUsers = () => {
        setRefresh(!refresh);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-center mb-4">User Management</h1>
            <UserForm fetchUsers={fetchUsers} />
            <UserList key={refresh} />
        </div>
    );
};

export default UserManagement;