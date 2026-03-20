-- 1A. Tambahkan link naskah (sides) ke tabel peran agar talent bisa download
ALTER TABLE project_roles ADD COLUMN script_link TEXT;

-- 1B. Tambahkan link video audisi (self-tape) ke tabel lamaran
ALTER TABLE project_applications ADD COLUMN video_link TEXT;
