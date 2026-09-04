import { Pool } from "pg";
import { logger } from "@/lib/logger";

let migrationDone = false;

export async function ensureDatabaseSchema(pool: Pool) {
  if (migrationDone) return;
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("dummy_build")) return;

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
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

        CREATE TABLE IF NOT EXISTS invites (
          id text PRIMARY KEY,
          code text NOT NULL UNIQUE,
          role text NOT NULL DEFAULT 'owner',
          created_by text REFERENCES users(id) ON DELETE CASCADE,
          used_by text REFERENCES users(id) ON DELETE SET NULL,
          expires_at timestamp with time zone NOT NULL,
          is_used boolean NOT NULL DEFAULT false,
          created_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS auth_tokens (
          id text PRIMARY KEY,
          email text NOT NULL,
          token_hash text NOT NULL,
          type text NOT NULL,
          expires_at timestamp with time zone NOT NULL,
          is_used boolean NOT NULL DEFAULT false,
          created_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS documents (
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

        CREATE TABLE IF NOT EXISTS doc_versions (
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

        CREATE TABLE IF NOT EXISTS datarooms (
          id text PRIMARY KEY,
          owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name text NOT NULL,
          description text,
          created_at timestamp with time zone NOT NULL DEFAULT now(),
          updated_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS dataroom_docs (
          id text PRIMARY KEY,
          dataroom_id text NOT NULL REFERENCES datarooms(id) ON DELETE CASCADE,
          doc_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          sort_order integer NOT NULL DEFAULT 0,
          created_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS links (
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

        CREATE TABLE IF NOT EXISTS view_sessions (
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

        CREATE TABLE IF NOT EXISTS signatures (
          id text PRIMARY KEY,
          link_id text NOT NULL REFERENCES links(id) ON DELETE CASCADE,
          session_id text REFERENCES view_sessions(id) ON DELETE CASCADE,
          signer_email text,
          signer_name text,
          signature_data_url text NOT NULL,
          signed_at timestamp with time zone NOT NULL DEFAULT now(),
          ip_hash text
        );

        CREATE TABLE IF NOT EXISTS page_events (
          id text PRIMARY KEY,
          session_id text NOT NULL REFERENCES view_sessions(id) ON DELETE CASCADE,
          link_id text NOT NULL REFERENCES links(id) ON DELETE CASCADE,
          doc_id text REFERENCES documents(id) ON DELETE CASCADE,
          page_number integer NOT NULL,
          dwell_seconds integer NOT NULL DEFAULT 0,
          created_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id text PRIMARY KEY,
          user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint text NOT NULL,
          p256dh text NOT NULL,
          auth text NOT NULL,
          created_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS audit_log (
          id text PRIMARY KEY,
          user_id text,
          actor_type text NOT NULL DEFAULT 'user',
          action text NOT NULL,
          resource_type text NOT NULL,
          resource_id text,
          details_json text,
          created_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS system_settings (
          key text PRIMARY KEY,
          value text NOT NULL,
          updated_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS page_questions (
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

        CREATE TABLE IF NOT EXISTS doc_audio_notes (
          id text PRIMARY KEY,
          doc_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          page_number integer NOT NULL,
          storage_key text NOT NULL,
          duration_sec integer NOT NULL DEFAULT 0,
          title text,
          audio_data_url text,
          created_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS live_rooms (
          id text PRIMARY KEY,
          link_id text NOT NULL REFERENCES links(id) ON DELETE CASCADE UNIQUE,
          current_slide integer NOT NULL DEFAULT 1,
          laser_x integer DEFAULT 50,
          laser_y integer DEFAULT 50,
          presenter_active boolean NOT NULL DEFAULT false,
          updated_at timestamp with time zone NOT NULL DEFAULT now()
        );

        -- Self-healing Column Migrations for Existing Databases
        ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret text;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes text;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS master_key_salt_hex text;

        ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_encrypted_key_hex text;
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_encrypted_key_iv_hex text;
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_storage_key text;
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_tombstone boolean NOT NULL DEFAULT false;

        ALTER TABLE links ADD COLUMN IF NOT EXISTS anti_spy_shield_enabled boolean NOT NULL DEFAULT true;
        ALTER TABLE links ADD COLUMN IF NOT EXISTS burn_after_reading boolean NOT NULL DEFAULT false;
        ALTER TABLE links ADD COLUMN IF NOT EXISTS voice_pitch_enabled boolean NOT NULL DEFAULT true;
        ALTER TABLE links ADD COLUMN IF NOT EXISTS anti_leak_blur_enabled boolean NOT NULL DEFAULT true;

        -- Performance & Foreign Key Indexing (Eliminates Seq Scans & Conserves Neon CU-hrs)
        CREATE INDEX IF NOT EXISTS idx_page_events_link_id ON page_events(link_id);
        CREATE INDEX IF NOT EXISTS idx_page_events_session_id ON page_events(session_id);
        CREATE INDEX IF NOT EXISTS idx_page_events_doc_id ON page_events(doc_id);
        CREATE INDEX IF NOT EXISTS idx_view_sessions_link_id ON view_sessions(link_id);
        CREATE INDEX IF NOT EXISTS idx_view_sessions_started_at ON view_sessions(started_at DESC);
        CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
        CREATE INDEX IF NOT EXISTS idx_links_owner_id ON links(owner_id);
        CREATE INDEX IF NOT EXISTS idx_links_doc_id ON links(doc_id);
        CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash_type ON auth_tokens(token_hash, type);
        CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
        CREATE INDEX IF NOT EXISTS idx_signatures_link_id ON signatures(link_id);
        CREATE INDEX IF NOT EXISTS idx_page_questions_link_id ON page_questions(link_id);

        -- Tailored Autovacuum for High-Churn Heartbeat Tables (Bloat Prevention)
        ALTER TABLE view_sessions SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_vacuum_threshold = 50);
        ALTER TABLE page_events SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_vacuum_threshold = 100);
        ALTER TABLE live_rooms SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_vacuum_threshold = 20);

        -- Opportunistic purge of expired / consumed auth tokens (>7 days old)
        DELETE FROM auth_tokens 
        WHERE expires_at < (now() - INTERVAL '7 days') 
           OR (is_used = true AND created_at < (now() - INTERVAL '1 day'));

        -- High-Efficiency LZ4 TOAST Compression for Bulky Base64 & JSON Payloads (PostgreSQL 14+)
        DO $$
        BEGIN
          IF current_setting('server_version_num')::integer >= 140000 THEN
            BEGIN
              ALTER TABLE signatures ALTER COLUMN signature_data_url SET COMPRESSION lz4;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
            BEGIN
              ALTER TABLE doc_audio_notes ALTER COLUMN audio_data_url SET COMPRESSION lz4;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
            BEGIN
              ALTER TABLE audit_log ALTER COLUMN details_json SET COMPRESSION lz4;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
            BEGIN
              ALTER TABLE page_questions ALTER COLUMN question_text SET COMPRESSION lz4;
              ALTER TABLE page_questions ALTER COLUMN reply_text SET COMPRESSION lz4;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
          END IF;
        END $$;
      `);
      migrationDone = true;
      logger.info("db.auto_migration_complete");
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn("db.auto_migration_skipped", { error: String(err) });
  }
}
