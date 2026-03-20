
DELETE FROM master_categories;
INSERT INTO master_categories (id, group_name, label, is_active) VALUES 
('p1', 'profession', 'Aktor / Aktris', 1),
('p2', 'profession', 'Model Iklan / Komersial', 1),
('p3', 'profession', 'Model Fashion / Runway', 1),
('p4', 'profession', 'Penyanyi / Musisi', 1),
('p5', 'profession', 'Influencer / KOL', 1),
('p6', 'profession', 'MC / Pembawa Acara', 1),
('p7', 'profession', 'Voice Over Artist', 1),
('p8', 'profession', 'Content Creator (UGC)', 1),
('p9', 'profession', 'Penari / Dancer', 1),
('p10', 'profession', 'Figuran (Extras)', 1);

INSERT INTO master_categories (id, group_name, label, is_active) VALUES 
('i1', 'industry', 'Production House (PH)', 1),
('i2', 'industry', 'Advertising Agency', 1),
('i3', 'industry', 'Brand / Corporate', 1),
('i4', 'industry', 'Event Organizer (EO)', 1),
('i5', 'industry', 'Stasiun Televisi / Media', 1),
('i6', 'industry', 'Kreator Independen', 1);

INSERT INTO master_categories (id, group_name, label, is_active) VALUES 
('s1', 'skill', 'Berenang', 1),
('s2', 'skill', 'Bela Diri / Action', 1),
('s3', 'skill', 'Menyetir Mobil', 1),
('s4', 'skill', 'Bermain Gitar', 1),
('s5', 'skill', 'Bermain Piano', 1),
('s6', 'skill', 'Public Speaking', 1),
('s7', 'skill', 'Komedi / Standup', 1),
('s8', 'skill', 'Bilingual (Inggris Aktif)', 1);
