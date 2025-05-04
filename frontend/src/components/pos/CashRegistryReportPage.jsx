import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CashRegistryReportPage = () => {
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        user_id: '',
        status: '',
    });
    const [registries, setRegistries] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch users for filter dropdown
        axios.get('/api/users')
            .then(res => setUsers(res.data))
            .catch(err => console.error('Failed to fetch users', err));
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;
            if (filters.user_id) params.user_id = filters.user_id;
            if (filters.status) params.status = filters.status;

            const response = await axios.get('/api/register/report', { params });
            setRegistries(response.data.registries);
        } catch (err) {
            setError('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Simple CSV export
        if (registries.length === 0) return;

        const headers = ['ID', 'User', 'Status', 'Opened At', 'Closed At', 'Opening Balance', 'Closing Balance', 'Actual Cash'];
        const rows = registries.map(r => [
            r.id,
            r.user?.name || r.user_id,
            r.status,
            r.opened_at,
            r.closed_at || '',
            r.opening_balance,
            r.closing_balance || '',
            r.actual_cash || '',
        ]);

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += headers.join(',') + '\\n';
        rows.forEach(row => {
            csvContent += row.join(',') + '\\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'cash_registry_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <h2>Cash Registry Report</h2>
            <div>
                <label>Start Date:</label>
                <input
                    type="date"
                    value={filters.start_date}
                    onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                />
                <label>End Date:</label>
                <input
                    type="date"
                    value={filters.end_date}
                    onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                />
                <label>User:</label>
                <select
                    value={filters.user_id}
                    onChange={e => setFilters({ ...filters, user_id: e.target.value })}
                >
                    <option value="">All</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
                <label>Status:</label>
                <select
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                </select>
                <button onClick={fetchReport} disabled={loading}>
                    {loading ? 'Loading...' : 'Filter'}
                </button>
                <button onClick={handleExport} disabled={registries.length === 0}>
                    Export CSV
                </button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <table border="1" cellPadding="5" style={{ marginTop: '20px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Status</th>
                        <th>Opened At</th>
                        <th>Closed At</th>
                        <th>Opening Balance</th>
                        <th>Closing Balance</th>
                        <th>Actual Cash</th>
                    </tr>
                </thead>
                <tbody>
                    {registries.map(registry => (
                        <tr key={registry.id}>
                            <td>{registry.id}</td>
                            <td>{registry.user?.name || registry.user_id}</td>
                            <td>{registry.status}</td>
                            <td>{new Date(registry.opened_at).toLocaleString()}</td>
                            <td>{registry.closed_at ? new Date(registry.closed_at).toLocaleString() : ''}</td>
                            <td>{registry.opening_balance.toFixed(2)}</td>
                            <td>{registry.closing_balance ? registry.closing_balance.toFixed(2) : ''}</td>
                            <td>{registry.actual_cash ? registry.actual_cash.toFixed(2) : ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CashRegistryReportPage;
