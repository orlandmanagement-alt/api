export const ReportRepo = {
    async getMonthlySummary(db, month, year) {
        const start = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
        const end = Math.floor(new Date(year, month, 0).getTime() / 1000);
        
        return await db.prepare(`
            SELECT 
                SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_in,
                SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_out,
                COUNT(*) as transaction_count
            FROM wallet_transactions 
            WHERE created_at BETWEEN ? AND ?
        `).bind(start, end).first();
    }
};
