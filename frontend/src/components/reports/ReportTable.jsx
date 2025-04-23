import React from 'react';

const ReportTable = ({ data, columns }) => {
    return (
        <div className="p-4 bg-transparent rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                <table className="w-full border-collapse min-w-max">
                    <thead className="bg-gray-600 text-gray-200 uppercase text-sm">
                        <tr>
                            <th className="px-4 py-3 border-b text-left">#</th>
                            {columns.map((col, index) => (
                                <th key={index} className="px-4 py-3 border-b text-left">{col.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-400">
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-400 transition duration-100">
                                <td className="px-4 py-2 border-b font-medium">{rowIndex + 1}</td>
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className="px-4 py-2 border-b">{row[col.field] ?? 'N/A'}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportTable;