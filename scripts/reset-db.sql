-- ==============================================================================
-- 🧹 BLINDSHARE COMPLETE DATABASE FACTORY RESET SCRIPT FOR NEON POSTGRESQL
-- ==============================================================================
-- Instructions:
-- 1. Open your Neon Dashboard (https://console.neon.tech).
-- 2. Select your Project -> Click on "SQL Editor".
-- 3. Paste this script and click "Run".
-- 4. All tables, test accounts, and data will be wiped cleanly.
-- 5. Open your app URL to perform fresh First-Run Super Admin registration!
-- ==============================================================================

-- 1. Disable triggers and drop all application tables in dependency order
DROP TABLE IF EXISTS page_events CASCADE;
DROP TABLE IF EXISTS view_sessions CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
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

-- 2. Drop any legacy drizzle migration tables
DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;
DROP TABLE IF EXISTS "drizzle_migrations" CASCADE;

-- 3. Automatically recreate pristine empty schema
CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  is_blocked boolean NOT NULL DEFAULT false,
  session_version integer NOT NULL DEFAULT 1,
  failed_login_count integer NOT NULL DEFAULT 0,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

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

CREATE TABLE documents (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  original_filename text NOT NULL,
  size_bytes bigint NOT NULL,
  storage_key text NOT NULL,
  thumbnail_storage_key text,
  encryption_mode text NOT NULL DEFAULT 'e2ee-fragment',
  iv_hex text,
  tag_hex text,
  page_count integer NOT NULL DEFAULT 1,
  current_version integer NOT NULL DEFAULT 1,
  is_tombstone boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

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

CREATE TABLE datarooms (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE dataroom_docs (
  id text PRIMARY KEY,
  dataroom_id text NOT NULL REFERENCES datarooms(id) ON DELETE CASCADE,
  doc_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

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
  allowed_domains text,
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
  max_views integer,
  view_count integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

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

CREATE TABLE page_events (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES view_sessions(id) ON DELETE CASCADE,
  link_id text NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  doc_id text REFERENCES documents(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  dwell_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE push_subscriptions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id text PRIMARY KEY,
  user_id text,
  actor_type text NOT NULL DEFAULT 'user',
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details_json text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Output confirmation
SELECT 'DATABASE RESET SUCCESSFUL: Ready for Genesis Super Admin registration' AS status;
