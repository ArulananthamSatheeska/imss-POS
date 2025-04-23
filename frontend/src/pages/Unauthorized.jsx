import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Unauthorized Access</h1>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    You don't have permission to access this page.
                </p>
                <Link
                    to="/"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Return to Home
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
