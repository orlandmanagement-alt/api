-- Tabel Saldo Poin Utama
CREATE TABLE IF NOT EXISTS wallets (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0,
    updated_at INTEGER
);

-- Tabel Riwayat Transaksi Poin
CREATE TABLE IF NOT EXISTS point_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    trx_type TEXT NOT NULL, -- 'topup', 'withdraw', 'spend', 'earn'
    amount INTEGER NOT NULL,
    note TEXT,
    created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON point_transactions(user_id);
