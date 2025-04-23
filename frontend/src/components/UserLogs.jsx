import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState({ userId: '', date: '' });

    useEffect(() => {
        const fetchLogs = async () => {
            const response = await axios.get('/api/logs', { params: filter });
            setLogs(response.data);
        };

        fetchLogs();
    }, [filter]);

    return (
        <div>
            <h2>User Activity Logs</h2>
            <div>
                <input
                    type="text"
                    placeholder="User ID"
                    value={filter.userId}
                    onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                />
                <input
                    type="date"
                    value={filter.date}
                    onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                />
                <button onClick={() => setFilter({ userId: '', date: '' })}>Reset Filters</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Action</th>
                        <th>Timestamp</th>
                        <th>IP Address</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id}>
                            <td>{log.user_id}</td>
                            <td>{log.action}</td>
                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                            <td>{log.ip_address}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserLogs;
