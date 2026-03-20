CREATE TABLE IF NOT EXISTS project_roles (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    category TEXT,
    gender TEXT,
    age_min INTEGER DEFAULT 0,
    age_max INTEGER DEFAULT 99,
    height_min INTEGER DEFAULT 0,
    height_max INTEGER DEFAULT 300,
    location TEXT,
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_role_project ON project_roles(project_id);

-- Update tabel applications agar tahu dia melamar role apa (opsional tapi disarankan)
-- ALTER TABLE project_applications ADD COLUMN role_id TEXT;
