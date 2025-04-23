import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>
            <p className="text-lg mt-4 text-gray-600">Page Not Found</p>
            <Link
                to="/Dashboard"
                className="mt-6 text-blue-600 hover:text-blue-800 font-semibold text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
                Go Back to Dashboard
            </Link>
        </div>
    );
};

export default NotFound;