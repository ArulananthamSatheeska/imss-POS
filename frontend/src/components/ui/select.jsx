// Select.jsx
import React from "react";

const Select = ({ label, value, onChange, children }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium mb-2">{label}</label>
            <select
                value={value}
                onChange={onChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {children}
            </select>
        </div>
    );
};

export default Select; 
