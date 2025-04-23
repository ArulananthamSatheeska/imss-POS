// components/ui/export.js
import React from 'react';

export const ExportToExcel = ({ data, fileName }) => {
    const handleExport = () => {
        // Implement Excel export logic here (e.g., using a library like `xlsx`)
        console.log('Exporting to Excel:', data);
    };

    return (
        <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
            Export to Excel
        </button>
    );
};

export const ExportToPDF = ({ data, fileName }) => {
    const handleExport = () => {
        // Implement PDF export logic here (e.g., using a library like `jspdf`)
        console.log('Exporting to PDF:', data);
    };

    return (
        <button
            onClick={handleExport}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md ml-2"
        >
            Export to PDF
        </button>
    );
};