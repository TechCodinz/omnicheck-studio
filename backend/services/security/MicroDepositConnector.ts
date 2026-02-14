/**
 * MicroDepositConnector
 * 
 * Manages the manual bank verification flow via small ACH deposits.
 * 1. Sends two random amounts ($0.01 - $0.99) to user bank.
 * 2. User confirms these amounts to prove account access.
 */
export class MicroDepositConnector {

    // Simulations of pending micro-verification records
    private pendingVerifications: Map<string, MicroData> = new Map();

    /**
     * Start the micro-deposit flow for a user.
     */
    async initiateMicroDeposits(userId: string): Promise<any> {
        console.log(`[MICRO] Initiating ACH micro-deposits for user: ${userId}`);

        const amount1 = Math.floor(Math.random() * 99) + 1; // 1 to 99 cents
        const amount2 = Math.floor(Math.random() * 99) + 1;

        this.pendingVerifications.set(userId, {
            userId,
            amounts: [amount1, amount2],
            status: 'SENT',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

        // In a real app, this would trigger an ACH transfer via Stripe or Dwolla.
        return {
            success: true,
            status: 'DEPOSITS_INITIATED',
            message: 'Two small deposits have been sent to your bank. They will appear in 1-3 business days.'
        };
    }

    /**
     * User submits the amounts they saw in their bank statement.
     */
    async verifyAmounts(userId: string, amounts: number[]): Promise<boolean> {
        const record = this.pendingVerifications.get(userId);

        if (!record || record.status !== 'SENT') {
            return false;
        }

        const isMatch = amounts.length === 2 &&
            amounts.includes(record.amounts[0]) &&
            amounts.includes(record.amounts[1]);

        if (isMatch) {
            record.status = 'VERIFIED';
            this.pendingVerifications.set(userId, record);
            console.log(`[MICRO] User ${userId} successfully verified account via micro-deposits.`);
            return true;
        }

        return false;
    }
}

export interface MicroData {
    userId: string;
    amounts: number[];
    status: 'SENT' | 'VERIFIED' | 'EXPIRED';
    expiresAt: string;
}
