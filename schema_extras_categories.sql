CREATE TABLE IF NOT EXISTS extras_categories (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT,
    target_qty INTEGER DEFAULT 50,
    deadline TEXT,
    status TEXT DEFAULT 'active'
);
