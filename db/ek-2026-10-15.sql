-- Comments, newsletter and contact form. Apply once after db/uyelik.sql.
CREATE TABLE IF NOT EXISTS yorumlar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sayfa TEXT NOT NULL,
  uye_id TEXT NOT NULL REFERENCES uyeler(id) ON DELETE CASCADE,
  metin TEXT NOT NULL,
  tarih INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS yorumlar_sayfa ON yorumlar(sayfa, tarih);
CREATE INDEX IF NOT EXISTS yorumlar_uye ON yorumlar(uye_id, tarih);
-- Newsletter: confirmed stays 0 until the e-mail confirmation link is clicked (sending comes later).
CREATE TABLE IF NOT EXISTS bulten (
  eposta TEXT PRIMARY KEY,
  izin_tarihi TEXT NOT NULL,
  onay INTEGER NOT NULL DEFAULT 0,
  anahtar TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS iletisim (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad TEXT NOT NULL,
  eposta TEXT NOT NULL,
  konu TEXT NOT NULL,
  mesaj TEXT NOT NULL,
  ip_ozet TEXT NOT NULL,
  tarih INTEGER NOT NULL,
  yanitlandi INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS iletisim_ip ON iletisim(ip_ozet, tarih);
