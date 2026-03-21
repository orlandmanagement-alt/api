export const WalletRepo = {
    async getBalance(db, userId) {
        return await db.prepare("SELECT balance FROM wallet_balances WHERE user_id = ?").bind(userId).first();
    },
    async addTransaction(db, data) {
        const id = `TX-${Date.now()}`;
        return await db.prepare("INSERT INTO wallet_transactions (id, user_id, type, amount, purpose, reference_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(id, data.userId, data.type, data.amount, data.purpose, data.refId, 'completed', Math.floor(Date.now()/1000)).run();
    }
};
