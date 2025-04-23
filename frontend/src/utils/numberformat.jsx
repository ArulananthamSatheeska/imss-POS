// src/utils/numberformat.js
export const formatNumberWithCommas = (value) => {
    if (!value) return ""; // Handle empty input
    const rawValue = value.toString().replace(/,/g, ""); // Remove existing commas
    return Number(rawValue).toLocaleString();
};
