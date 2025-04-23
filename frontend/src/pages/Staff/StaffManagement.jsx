import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const StaffManagement = () => {
    // Mock data for dashboard metrics
    const dashboardData = {
        totalStaff: 25,
        activeStaff: 20,
        pendingTasks: 5,
        recentActivity: [
            { id: 1, name: 'John Doe', action: 'Processed Sale', time: '10:30 AM' },
            { id: 2, name: 'Jane Smith', action: 'Updated Inventory', time: '11:15 AM' },
            { id: 3, name: 'Alice Johnson', action: 'Processed Refund', time: '12:00 PM' },
        ],
    };

    const navigate = useNavigate();
    const staffFeatures = [
        {
            title: 'Staff Registration & Profiles',
            buttonText: 'Add Staff',
            color: 'bg-blue-500',
            hoverColor: 'hover:bg-blue-600',
            path: '/StaffRegistration',
        },
        {
            title: 'Role-Based Access Control (RBAC)',
            buttonText: 'Manage Roles',
            color: 'bg-green-500',
            hoverColor: 'hover:bg-green-600',
            path: '/RoleBasedAccessControl',
        },
        {
            title: 'Attendance & Shift Management',
            buttonText: 'View Attendance',
            color: 'bg-purple-500',
            hoverColor: 'hover:bg-purple-600',
            path: '/AttendanceShiftManagement',
        },
        {
            title: 'Payroll & Salary Management',
            buttonText: 'Generate Payroll',
            color: 'bg-yellow-500',
            hoverColor: 'hover:bg-yellow-600',
            path: '/PayrollSalaryManagement',
        },
        {
            title: 'Staff Performance Tracking',
            buttonText: 'View Performance',
            color: 'bg-indigo-500',
            hoverColor: 'hover:bg-indigo-600',
            path: '/staff-performance-tracking',
        },
        {
            title: 'Staff Activity Logs',
            buttonText: 'View Logs',
            color: 'bg-red-500',
            hoverColor: 'hover:bg-red-600',
            path: '/staff-activity-logs',
        },
        {
            title: 'Staff Notifications & Alerts',
            buttonText: 'Send Notification',
            color: 'bg-pink-500',
            hoverColor: 'hover:bg-pink-600',
            path: '/staff-notifications-alerts',
        },
        {
            title: 'Staff Reports & Analytics',
            buttonText: 'Generate Report',
            color: 'bg-teal-500',
            hoverColor: 'hover:bg-teal-600',
            path: '/staff-reports-analytics',
        },
    ];

    // Mock data for staff performance chart
    const staffPerformanceData = {
        labels: ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Charlie Davis'],
        datasets: [
            {
                label: 'Sales Performance',
                data: [1200, 1900, 800, 1500, 2000],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Mock data for attendance trends chart
    const attendanceTrendsData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Attendance',
                data: [20, 22, 21, 23, 24, 22, 25],
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: true,
            },
        ],
    };

    return (
        <div className="p-8 bg-gray-50 dark:text-white dark:bg-transparent min-h-screen">
            <h1 className="text-3xl font-bold dark:text-white text-gray-800 mb-8">Staff Management</h1>

            {/* 🚀 Staff Dashboard */}
            <section className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Total Staff Card */}
                    <div className="p-6 bg-white dark:bg-slate-500 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-lg font-semibold text-gray-700">Total Staff</h3>
                        <p className="text-3xl font-bold text-blue-500">{dashboardData.totalStaff}</p>
                    </div>

                    {/* Active Staff Card */}
                    <div className="p-6 bg-white dark:bg-slate-500 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-lg font-semibold text-gray-700">Active Staff</h3>
                        <p className="text-3xl font-bold text-green-500">{dashboardData.activeStaff}</p>
                    </div>

                    {/* Pending Tasks Card */}
                    <div className="p-6 bg-white dark:bg-slate-500 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-lg font-semibold text-gray-700">Pending Tasks</h3>
                        <p className="text-3xl font-bold text-yellow-500">{dashboardData.pendingTasks}</p>
                    </div>
                </div>
                {/* Render Staff Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staffFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className="p-6 bg-white dark:bg-slate-300 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                            <h2 className="text-2xl font-semibold text-gray-700 mb-4">{feature.title}</h2>
                            <button
                                onClick={() => navigate(feature.path)}
                                className={`${feature.color} ${feature.hoverColor} text-white px-4 py-2 rounded-md transition-colors duration-300`}
                            >
                                {feature.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Recent Activity Table */}
                <div className="mt-5 p-6 bg-white dark:bg-slate-500 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 text-left text-gray-700">Staff Name</th>
                                <th className="p-3 text-left text-gray-700">Action</th>
                                <th className="p-3 text-left text-gray-700">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.recentActivity.map((activity) => (
                                <tr key={activity.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                    <td className="p-3 text-gray-600">{activity.name}</td>
                                    <td className="p-3 text-gray-600">{activity.action}</td>
                                    <td className="p-3 text-gray-600">{activity.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Staff Performance Chart */}
                    <div className="p-6 bg-white dark:bg-slate-300 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Staff Performance</h3>
                        <Bar
                            data={staffPerformanceData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: true },
                                    title: { display: true, text: 'Sales Performance by Staff' },
                                },
                            }}
                        />
                    </div>

                    {/* Attendance Trends Chart */}
                    <div className="p-6 bg-white dark:bg-slate-300 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-lg font-semibold dark:text-slate-600 text-gray-700 mb-4">Attendance Trends</h3>
                        <Line
                            data={attendanceTrendsData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { display: true },
                                    title: { display: true, text: 'Weekly Attendance Trends' },
                                },
                            }}
                        />
                    </div>
                </div>
            </section>



        </div>
    );
};

export default StaffManagement;