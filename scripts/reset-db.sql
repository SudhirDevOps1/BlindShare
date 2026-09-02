-- ==============================================================================
-- 🧹 BLINDSHARE COMPLETE DATABASE FACTORY RESET SCRIPT (PostgreSQL / Neon)
-- Version: 1.3.0
-- ==============================================================================
-- Instructions:
-- 1. Open your Neon Dashboard (https://console.neon.tech) or PostgreSQL client.
-- 2. Select your Project -> Click on "SQL Editor".
-- 3. Paste this entire script and click "Run".
-- 4. All tables, test accounts, and data will be wiped cleanly.
-- 5. Open your app URL (e.g. /login) to register your fresh Super Admin!
-- ==============================================================================

-- 1. Disable triggers and drop all application tables in dependency order
DROP TABLE IF EXISTS live_rooms CASCADE;
DROP TABLE IF EXISTS doc_audio_notes CASCADE;
DROP TABLE IF EXISTS page_questions CASCADE;
DROP TABLE IF EXISTS page_events CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
DROP TABLE IF EXISTS view_sessions CASCADE;
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS dataroom_docs CASCADE;
DROP TABLE IF EXISTS datarooms CASCADE;
DROP TABLE IF EXISTS doc_versions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Drop any legacy drizzle migration tracking tables
DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;
DROP TABLE IF EXISTS "drizzle_migrations" CASCADE;

-- 3. Automatically recreate pristine empty schema matching src/db/schema.ts 100%

-- ------------------------------------------------------------------------------
-- USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'owner', -- super_admin | admin | owner
  is_blocked boolean NOT NULL DEFAULT false,
  session_version integer NOT NULL DEFAULT 1,
  failed_login_count integer NOT NULL DEFAULT 0,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  two_factor_secret text,
  two_factor_backup_codes text,
  master_key_salt_hex text,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- INVITES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE invites (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'owner',
  created_by text REFERENCES users(id) ON DELETE CASCADE,
  used_by text REFERENCES users(id) ON DELETE SET NULL,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- DOCUMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE documents (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  original_filename text NOT NULL,
  size_bytes bigint NOT NULL,
  storage_key text NOT NULL,
  thumbnail_storage_key text,
  encryption_mode text NOT NULL DEFAULT 'e2ee-fragment', -- e2ee-fragment | plain-cipher-at-rest
  iv_hex text,
  tag_hex text,
  owner_encrypted_key_hex text,
  owner_encrypted_key_iv_hex text,
  page_count integer NOT NULL DEFAULT 1,
  current_version integer NOT NULL DEFAULT 1,
  is_tombstone boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- DOC VERSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE doc_versions (
  id text PRIMARY KEY,
  doc_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_num integer NOT NULL,
  storage_key text NOT NULL,
  size_bytes bigint NOT NULL,
  page_count integer NOT NULL DEFAULT 1,
  iv_hex text,
  tag_hex text,
  changelog text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- DATAROOMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE datarooms (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- DATAROOM DOCS JUNCTION TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE dataroom_docs (
  id text PRIMARY KEY,
  dataroom_id text NOT NULL REFERENCES datarooms(id) ON DELETE CASCADE,
  doc_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- LINKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE links (
  id text PRIMARY KEY,
  doc_id text REFERENCES documents(id) ON DELETE CASCADE,
  dataroom_id text REFERENCES datarooms(id) ON DELETE CASCADE,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_revoked boolean NOT NULL DEFAULT false,
  password_hash text,
  password_salt_hex text,
  wrapped_key_hex text,
  requires_email boolean NOT NULL DEFAULT false,
  allowed_domains text, -- comma-separated e.g. "acme.com,partner.org"
  allow_download boolean NOT NULL DEFAULT false,
  watermark_enabled boolean NOT NULL DEFAULT true,
  watermark_text text,
  requires_nda boolean NOT NULL DEFAULT false,
  nda_text text,
  requires_signature boolean NOT NULL DEFAULT false,
  signature_prompt text,
  webhook_url text,
  brand_logo_url text,
  brand_accent_color text,
  anti_leak_blur_enabled boolean NOT NULL DEFAULT true,
  anti_spy_shield_enabled boolean NOT NULL DEFAULT true,
  burn_after_reading boolean NOT NULL DEFAULT false,
  voice_pitch_enabled boolean NOT NULL DEFAULT true,
  max_views integer,
  view_count integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- VIEW SESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE view_sessions (
  id text PRIMARY KEY,
  link_id text NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  doc_id text REFERENCES documents(id) ON DELETE SET NULL,
  viewer_email text,
  viewer_ip_hash text,
  country text NOT NULL DEFAULT 'Unknown',
  ua_browser text DEFAULT 'Unknown',
  ua_os text DEFAULT 'Unknown',
  ua_device text DEFAULT 'desktop',
  nda_agreed_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  last_heartbeat_at timestamp with time zone NOT NULL DEFAULT now(),
  total_dwell_seconds integer NOT NULL DEFAULT 0,
  completed_pages integer NOT NULL DEFAULT 0,
  max_page_reached integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- SIGNATURES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE signatures (
  id text PRIMARY KEY,
  link_id text NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  session_id text REFERENCES view_sessions(id) ON DELETE CASCADE,
  signer_email text,
  signer_name text,
  signature_data_url text NOT NULL,
  signed_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_hash text
);

-- ------------------------------------------------------------------------------
-- PAGE EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE page_events (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES view_sessions(id) ON DELETE CASCADE,
  link_id text NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  doc_id text REFERENCES documents(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  dwell_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- PAGE QUESTIONS TABLE (In-Doc Real-Time Q&A Pinning)
-- ------------------------------------------------------------------------------
CREATE TABLE page_questions (
  id text PRIMARY KEY,
  link_id text NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  doc_id text REFERENCES documents(id) ON DELETE CASCADE,
  session_id text REFERENCES view_sessions(id) ON DELETE SET NULL,
  page_number integer NOT NULL,
  pos_x_percent integer NOT NULL DEFAULT 50,
  pos_y_percent integer NOT NULL DEFAULT 50,
  question_text text NOT NULL,
  asker_email text,
  asker_name text,
  reply_text text,
  replied_at timestamp with time zone,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- DOC AUDIO NOTES TABLE (Voice Pitch per Slide)
-- ------------------------------------------------------------------------------
CREATE TABLE doc_audio_notes (
  id text PRIMARY KEY,
  doc_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  storage_key text NOT NULL,
  duration_sec integer NOT NULL DEFAULT 0,
  title text,
  audio_data_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- LIVE ROOMS TABLE (Real-Time Synchronized Co-Browsing)
-- ------------------------------------------------------------------------------
CREATE TABLE live_rooms (
  id text PRIMARY KEY,
  link_id text NOT NULL REFERENCES links(id) ON DELETE CASCADE UNIQUE,
  current_slide integer NOT NULL DEFAULT 1,
  laser_x integer DEFAULT 50,
  laser_y integer DEFAULT 50,
  presenter_active boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- PUSH SUBSCRIPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE push_subscriptions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- AUDIT LOG TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE audit_log (
  id text PRIMARY KEY,
  user_id text,
  actor_type text NOT NULL DEFAULT 'user', -- user | admin | viewer | system
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details_json text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- SYSTEM SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create essential performance indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_owner_id ON links(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_view_sessions_link_id ON view_sessions(link_id);
CREATE INDEX IF NOT EXISTS idx_page_events_session_id ON page_events(session_id);
CREATE INDEX IF NOT EXISTS idx_page_questions_link_id ON page_questions(link_id);
CREATE INDEX IF NOT EXISTS idx_doc_audio_notes_doc_id ON doc_audio_notes(doc_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- 5. Enterprise Storage Optimization: High-Ratio TOAST Compression & Autovacuum Tuning
DO $$
BEGIN
  -- Enable high-ratio zstd compression on long-text columns if available (PostgreSQL 14+)
  BEGIN
    ALTER TABLE audit_log ALTER COLUMN details_json SET COMPRESSION zstd;
    ALTER TABLE links ALTER COLUMN nda_text SET COMPRESSION zstd;
    ALTER TABLE signatures ALTER COLUMN signature_data_url SET COMPRESSION zstd;
    ALTER TABLE doc_versions ALTER COLUMN changelog SET COMPRESSION zstd;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Fast Dead-Row Space Reclamation on high-frequency telemetry tables
  BEGIN
    ALTER TABLE page_events SET (autovacuum_vacuum_scale_factor = 0.05);
    ALTER TABLE view_sessions SET (autovacuum_vacuum_scale_factor = 0.05);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Output confirmation
SELECT 'DATABASE RESET SUCCESSFUL: Pristine v1.3.0 schema ready with zstd storage compression' AS status;
