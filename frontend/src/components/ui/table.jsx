// components/ui/table.js
import React from 'react';

export const Table = ({ children, className }) => {
    return (
        <table className={`w-full text-sm border-collapse ${className}`}>
            {children}
        </table>
    );
};

export const Thead = ({ children, className }) => {
    return (
        <thead className={`bg-blue-500 text-white ${className}`}>
            {children}
        </thead>
    );
};

export const Tbody = ({ children, className }) => {
    return (
        <tbody className={className}>
            {children}
        </tbody>
    );
};

export const Tr = ({ children, className }) => {
    return (
        <tr className={`border text-gray-700 odd:bg-gray-100 ${className}`}>
            {children}
        </tr>
    );
};

export const Th = ({ children, className }) => {
    return (
        <th className={`px-4 py-2 border text-left ${className}`}>
            {children}
        </th>
    );
};

export const Td = ({ children, className }) => {
    return (
        <td className={`px-4 py-2 border ${className}`}>
            {children}
        </td>
    );
};