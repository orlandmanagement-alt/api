-- Menambahkan kolom role_id ke tabel lamaran agar tahu Talent melamar jadi apa
ALTER TABLE project_applications ADD COLUMN role_id TEXT;
