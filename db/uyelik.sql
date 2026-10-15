-- Membership tables for the Cloudflare D1 database bound as DB.
-- Apply once: npx wrangler d1 execute zamanist --remote --file=db/uyelik.sql
CREATE TABLE IF NOT EXISTS uyeler (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE,
  eposta TEXT NOT NULL UNIQUE,
  ad TEXT,
  eposta_izni INTEGER NOT NULL DEFAULT 0,
  izin_tarihi TEXT,
  olusturma TEXT NOT NULL
);
-- Only a SHA-256 hash of the session token is stored; the token itself lives in the browser cookie.
CREATE TABLE IF NOT EXISTS oturumlar (
  hash TEXT PRIMARY KEY,
  uye_id TEXT NOT NULL REFERENCES uyeler(id) ON DELETE CASCADE,
  bitis INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS oturumlar_uye ON oturumlar(uye_id);
CREATE TABLE IF NOT EXISTS takipler (
  uye_id TEXT NOT NULL REFERENCES uyeler(id) ON DELETE CASCADE,
  anahtar TEXT NOT NULL,
  olusturma TEXT NOT NULL,
  PRIMARY KEY (uye_id, anahtar)
);
