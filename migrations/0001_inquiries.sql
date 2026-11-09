CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY, kind TEXT NOT NULL, created_at TEXT NOT NULL, details TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS inquiry_limits (ip_hash TEXT PRIMARY KEY, last_seen INTEGER NOT NULL);
-- Private operational records: access only through authenticated Cloudflare dashboard.
-- Set a routine to delete handled inquiries after 90 days and expired rate-limit rows daily.
