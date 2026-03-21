import { WalletRepo } from "../repos/wallet_repo.js";

export const WalletService = {
    async processPayment(db, userId, amount, purpose, refId) {
        // Logic: Potong saldo atau catat pembayaran masuk
        await WalletRepo.addTransaction(db, { userId, type: 'debit', amount, purpose, refId });
        // Update balance logic here...
        return { success: true };
    }
};
