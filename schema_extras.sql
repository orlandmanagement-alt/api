CREATE TABLE IF NOT EXISTS project_extras (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER,
    height INTEGER,
    weight INTEGER,
    gender TEXT,
    agency TEXT DEFAULT 'Orland Management',
    status TEXT DEFAULT 'FREE', 
    photo_base64 TEXT,
    note TEXT DEFAULT '',
    created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_extras_project ON project_extras(project_id);
CREATE INDEX IF NOT EXISTS idx_extras_category ON project_extras(category_id);
