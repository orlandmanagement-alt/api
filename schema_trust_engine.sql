-- Tabel Notifikasi Global
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    action_url TEXT,
    created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

-- Tabel Review & Rating
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL, -- Client ID
    target_id TEXT NOT NULL,   -- Talent ID
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_review_target ON reviews(target_id);
