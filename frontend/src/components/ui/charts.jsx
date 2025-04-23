// components/ui/charts.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const StockChart = ({ data }) => {
    const chartData = {
        labels: data.map((item) => item.itemName),
        datasets: [
            {
                label: 'Stock Quantity',
                data: data.map((item) => item.stockQuantity),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Stock Trends',
            },
        },
    };

    return (
        <div className="mt-6 mb-10">
            <Line data={chartData} options={options} />
        </div>
    );
};