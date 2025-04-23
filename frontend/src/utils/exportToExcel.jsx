// utils/exportToExcel.js
import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file.
 * @param {Array} data - Data to be exported.
 * @param {string} fileName - Name of the generated Excel file.
 * @param {string} sheetName - Name of the sheet in Excel file.
 */
export const exportToExcel = (data, fileName, sheetName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Export the file
    XLSX.writeFile(wb, fileName);
};
