import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Enterprise SQLite Schema for Zero-Cost Persistent Deployments (Mode B)
 * Synchronized 1:1 with PostgreSQL schema for seamless dual-driver operation.
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("owner"), // super_admin | admin | owner
  isBlocked: integer("is_blocked", { mode: "boolean" }).notNull().default(false),
  sessionVersion: integer("session_version").notNull().default(1),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorBackupCodes: text("two_factor_backup_codes"),
  masterKeySaltHex: text("master_key_salt_hex"),
  lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const invites = sqliteTable("invites", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  role: text("role").notNull().default("owner"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "cascade" }),
  usedBy: text("used_by").references(() => users.id, { onDelete: "set null" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  isUsed: integer("is_used", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  originalFilename: text("original_filename").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storageKey: text("storage_key").notNull(),
  thumbnailStorageKey: text("thumbnail_storage_key"),
  encryptionMode: text("encryption_mode").notNull().default("e2ee-fragment"),
  ivHex: text("iv_hex"),
  tagHex: text("tag_hex"),
  ownerEncryptedKeyHex: text("owner_encrypted_key_hex"),
  ownerEncryptedKeyIvHex: text("owner_encrypted_key_iv_hex"),
  pageCount: integer("page_count").notNull().default(1),
  currentVersion: integer("current_version").notNull().default(1),
  isTombstone: integer("is_tombstone", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const docVersions = sqliteTable("doc_versions", {
  id: text("id").primaryKey(),
  docId: text("doc_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionNum: integer("version_num").notNull(),
  storageKey: text("storage_key").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  pageCount: integer("page_count").notNull().default(1),
  ivHex: text("iv_hex"),
  tagHex: text("tag_hex"),
  changelog: text("changelog"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const datarooms = sqliteTable("datarooms", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const dataroomDocs = sqliteTable("dataroom_docs", {
  id: text("id").primaryKey(),
  dataroomId: text("dataroom_id").notNull().references(() => datarooms.id, { onDelete: "cascade" }),
  docId: text("doc_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  docId: text("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  dataroomId: text("dataroom_id").references(() => datarooms.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isRevoked: integer("is_revoked", { mode: "boolean" }).notNull().default(false),
  passwordHash: text("password_hash"),
  passwordSaltHex: text("password_salt_hex"),
  wrappedKeyHex: text("wrapped_key_hex"),
  requiresEmail: integer("requires_email", { mode: "boolean" }).notNull().default(false),
  allowedDomains: text("allowed_domains"),
  allowDownload: integer("allow_download", { mode: "boolean" }).notNull().default(false),
  watermarkEnabled: integer("watermark_enabled", { mode: "boolean" }).notNull().default(true),
  watermarkText: text("watermark_text"),
  requiresNda: integer("requires_nda", { mode: "boolean" }).notNull().default(false),
  ndaText: text("nda_text"),
  requiresSignature: integer("requires_signature", { mode: "boolean" }).notNull().default(false),
  signaturePrompt: text("signature_prompt"),
  webhookUrl: text("webhook_url"),
  brandLogoUrl: text("brand_logo_url"),
  brandAccentColor: text("brand_accent_color"),
  antiLeakBlurEnabled: integer("anti_leak_blur_enabled", { mode: "boolean" }).notNull().default(true),
  antiSpyShieldEnabled: integer("anti_spy_shield_enabled", { mode: "boolean" }).notNull().default(true),
  burnAfterReading: integer("burn_after_reading", { mode: "boolean" }).notNull().default(false),
  voicePitchEnabled: integer("voice_pitch_enabled", { mode: "boolean" }).notNull().default(true),
  maxViews: integer("max_views"),
  viewCount: integer("view_count").notNull().default(0),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const signatures = sqliteTable("signatures", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  sessionId: text("session_id").references(() => viewSessions.id, { onDelete: "cascade" }),
  signerEmail: text("signer_email"),
  signerName: text("signer_name"),
  signatureDataUrl: text("signature_data_url").notNull(),
  signedAt: integer("signed_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
  ipHash: text("ip_hash"),
});

export const viewSessions = sqliteTable("view_sessions", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  docId: text("doc_id").references(() => documents.id, { onDelete: "set null" }),
  viewerEmail: text("viewer_email"),
  viewerIpHash: text("viewer_ip_hash"),
  country: text("country").notNull().default("Unknown"),
  uaBrowser: text("ua_browser").default("Unknown"),
  uaOs: text("ua_os").default("Unknown"),
  uaDevice: text("ua_device").default("desktop"),
  ndaAgreedAt: integer("nda_agreed_at", { mode: "timestamp_ms" }),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
  lastHeartbeatAt: integer("last_heartbeat_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
  totalDwellSeconds: integer("total_dwell_seconds").notNull().default(0),
  completedPages: integer("completed_pages").notNull().default(0),
  maxPageReached: integer("max_page_reached").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const pageEvents = sqliteTable("page_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => viewSessions.id, { onDelete: "cascade" }),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  docId: text("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  dwellSeconds: integer("dwell_seconds").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const pageQuestions = sqliteTable("page_questions", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  docId: text("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  sessionId: text("session_id").references(() => viewSessions.id, { onDelete: "set null" }),
  pageNumber: integer("page_number").notNull(),
  posXPercent: integer("pos_x_percent").notNull().default(50),
  posYPercent: integer("pos_y_percent").notNull().default(50),
  questionText: text("question_text").notNull(),
  askerEmail: text("asker_email"),
  askerName: text("asker_name"),
  replyText: text("reply_text"),
  repliedAt: integer("replied_at", { mode: "timestamp_ms" }),
  isResolved: integer("is_resolved", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const docAudioNotes = sqliteTable("doc_audio_notes", {
  id: text("id").primaryKey(),
  docId: text("doc_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  storageKey: text("storage_key").notNull(),
  durationSec: integer("duration_sec").notNull().default(0),
  title: text("title"),
  audioDataUrl: text("audio_data_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const liveRooms = sqliteTable("live_rooms", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }).unique(),
  currentSlide: integer("current_slide").notNull().default(1),
  laserX: integer("laser_x").default(50),
  laserY: integer("laser_y").default(50),
  presenterActive: integer("presenter_active", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  actorType: text("actor_type").notNull().default("user"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  detailsJson: text("details_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(strftime('%s', 'now') * 1000)`).notNull(),
});
