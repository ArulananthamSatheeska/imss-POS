import React, { useState } from 'react';
import { useRegister } from '../../context/RegisterContext';

export class Register {
    constructor({
        id = null,
        userId = null,
        terminalId = null,
        openingCash = 0,
        totalSales = 0,
        cashOnHand = 0,
        openedAt = null,
        closedAt = null,
        status = 'closed',
    } = {}) {
        this.id = id;
        this.userId = userId;
        this.terminalId = terminalId;
        this.openingCash = openingCash;
        this.totalSales = totalSales;
        this.cashOnHand = cashOnHand;
        this.openedAt = openedAt ? new Date(openedAt) : null;
        this.closedAt = closedAt ? new Date(closedAt) : null;
        this.status = status;
    }

    isOpen() {
        return this.status === 'open';
    }

    isClosed() {
        return this.status === 'closed';
    }
}

const CashRegistryModal = ({ isOpen, onClose }) => {
    const { registerStatus, openRegister, closeRegister, loading, error } = useRegister();
    const [amount, setAmount] = useState('');
    const [closeAmount, setCloseAmount] = useState('');
    const [closeConfirmed, setCloseConfirmed] = useState(false);
    const [closeError, setCloseError] = useState(null);

    const handleOpen = async () => {
        if (!amount || isNaN(amount) || Number(amount) < 0) {
            alert('Please enter a valid opening amount.');
            return;
        }
        const userId = registerStatus.userId || null;
        if (!userId) {
            alert('User not identified.');
            return;
        }
        const result = await openRegister({ user_id: userId, terminal_id: registerStatus.terminalId, opening_cash: Number(amount) });
        if (result.success) {
            onClose();
        } else {
            alert(result.error || 'Failed to open register.');
        }
    };

    const handleClose = async () => {
        if (!closeAmount || isNaN(closeAmount) || Number(closeAmount) < 0) {
            setCloseError('Please enter a valid closing amount.');
            return;
        }
        setCloseError(null);
        if (!closeConfirmed) {
            if (window.confirm('Are you sure you want to close the register?')) {
                setCloseConfirmed(true);
            } else {
                return;
            }
        }
        const closingDetails = {
            inCashierAmount: Number(closeAmount),
        };
        const result = await closeRegister(closingDetails);
        if (result.success) {
            onClose();
        } else {
            alert(result.error || 'Failed to close register.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Cash Registry</h2>
                {registerStatus.isOpen ? (
                    <>
                        <p>Register is currently OPEN.</p>
                        <p>Opened at: {registerStatus.openedAt?.toLocaleString()}</p>
                        <p>Opening Cash: {registerStatus.openingCash !== undefined ? registerStatus.openingCash.toFixed(2) : 'N/A'}</p>
                        <p>Cash on hand: {registerStatus.cashOnHand !== undefined ? registerStatus.cashOnHand.toFixed(2) : 'N/A'}</p>
                        <p>Total Sales: {registerStatus.totalSales !== undefined ? registerStatus.totalSales.toFixed(2) : 'N/A'}</p>
                        <div>
                            <label>Closing Cash Amount:</label>
                            <input
                                type="number"
                                value={closeAmount}
                                onChange={(e) => setCloseAmount(e.target.value)}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        {closeError && <p className="error">{closeError}</p>}
                        <button onClick={handleClose} disabled={loading}>
                            {loading ? 'Closing...' : 'Close Register'}
                        </button>
                    </>
                ) : (
                    <>
                        <p>Register is currently CLOSED.</p>
                        <div>
                            <label>Opening Cash Amount:</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <button onClick={handleOpen} disabled={loading}>
                            {loading ? 'Opening...' : 'Open Register'}
                        </button>
                    </>
                )}
                {error && <p className="error">{error}</p>}
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default CashRegistryModal;
