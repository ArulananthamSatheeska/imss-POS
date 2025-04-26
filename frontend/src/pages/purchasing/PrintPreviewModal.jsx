import React from 'react';
import PrintablePurchase from './PrintablePurchase';

const PrintPreviewModal = ({ purchase, onClose, onPrint }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Print Preview</h2>
                    <div className="flex space-x-2">
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={onPrint}
                        >
                            Print
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    <PrintablePurchase data={purchase} />
                </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;