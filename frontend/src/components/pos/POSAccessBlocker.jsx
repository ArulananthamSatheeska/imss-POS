import React from 'react';
import { useRegister } from '../../context/RegisterContext';

const POSAccessBlocker = ({ children }) => {
    const { registerStatus } = useRegister();

    if (!registerStatus.isOpen) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                <h2>Access Denied</h2>
                <p>You must open your Cash Registry before using the POS.</p>
            </div>
        );
    }

    return <>{children}</>;
};

export default POSAccessBlocker;
