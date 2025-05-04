/**
 * Register data model for frontend usage.
 * Includes fields for register session details.
 */

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
