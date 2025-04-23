import React, { useState } from 'react';

const BillWiseReportTable = ({ data, columns, renderCell }) => {
    return (
        <div className="p-4 bg-transparent rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                <table className="w-full border-collapse min-w-max">
                    <thead className="bg-gray-600 text-gray-200 uppercase text-sm">
                        <tr>
                            <th className="px-4 py-3 border-b text-left">#</th>
                            {columns.map((col, index) => (
                                <th key={index} className="px-4 py-3 border-b text-left">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-400">
                        {data.map((row, rowIndex) => {
                            const [isExpanded, setIsExpanded] = useState(false);

                            const toggleExpand = () => {
                                setIsExpanded(!isExpanded);
                            };

                            return (
                                <React.Fragment key={rowIndex}>
                                    <tr className="hover:bg-gray-400 transition duration-100">
                                        <td className="px-4 py-2 border-b font-medium">{rowIndex + 1}</td>
                                        {columns.map((col, colIndex) => (
                                            <td key={colIndex} className="px-4 py-2 border-b">
                                                {renderCell
                                                    ? renderCell(row, col, toggleExpand, isExpanded)
                                                    : row[col.toLowerCase().replace(/ /g, '')] ?? 'N/A'}
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Expanded row for item details */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={columns.length + 1} className="px-4 py-2 bg-gray-50">
                                                {/* Render item details here */}
                                                <div className="pl-8">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr>
                                                                <th>Product Name</th>
                                                                <th>Quantity</th>
                                                                <th>Cost Price</th>
                                                                <th>Selling Price</th>
                                                                <th>Profit</th>
                                                                <th>Profit %</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {row.items.map((item, itemIndex) => (
                                                                <tr key={itemIndex}>
                                                                    <td>{item.product_name}</td>
                                                                    <td>{item.quantity}</td>
                                                                    <td>LKR {item.costPrice}</td>
                                                                    <td>LKR {item.sellingPrice}</td>
                                                                    <td>LKR {item.profit}</td>
                                                                    <td>{item.profitPercentage}%</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillWiseReportTable;