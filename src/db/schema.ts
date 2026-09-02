import { pgTable, text, timestamp, boolean, integer, bigint } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("owner"), // super_admin | admin | owner
  isBlocked: boolean("is_blocked").notNull().default(false),
  // Bumped by "log out all devices" / forced password reset — any session token
  // signed with an older version is rejected even if its HMAC is still valid.
  sessionVersion: integer("session_version").notNull().default(1),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorBackupCodes: text("two_factor_backup_codes"),
  masterKeySaltHex: text("master_key_salt_hex"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invites = pgTable("invites", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  role: text("role").notNull().default("owner"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "cascade" }),
  usedBy: text("used_by").references(() => users.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  originalFilename: text("original_filename").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  storageKey: text("storage_key").notNull(),
  thumbnailStorageKey: text("thumbnail_storage_key"),
  encryptionMode: text("encryption_mode").notNull().default("e2ee-fragment"), // e2ee-fragment | plain-cipher-at-rest
  ivHex: text("iv_hex"),
  tagHex: text("tag_hex"),
  ownerEncryptedKeyHex: text("owner_encrypted_key_hex"),
  ownerEncryptedKeyIvHex: text("owner_encrypted_key_iv_hex"),
  pageCount: integer("page_count").notNull().default(1),
  currentVersion: integer("current_version").notNull().default(1),
  isTombstone: boolean("is_tombstone").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const docVersions = pgTable("doc_versions", {
  id: text("id").primaryKey(),
  docId: text("doc_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionNum: integer("version_num").notNull(),
  storageKey: text("storage_key").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  pageCount: integer("page_count").notNull().default(1),
  ivHex: text("iv_hex"),
  tagHex: text("tag_hex"),
  changelog: text("changelog"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const datarooms = pgTable("datarooms", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dataroomDocs = pgTable("dataroom_docs", {
  id: text("id").primaryKey(),
  dataroomId: text("dataroom_id").notNull().references(() => datarooms.id, { onDelete: "cascade" }),
  docId: text("doc_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const links = pgTable("links", {
  id: text("id").primaryKey(),
  docId: text("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  dataroomId: text("dataroom_id").references(() => datarooms.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isRevoked: boolean("is_revoked").notNull().default(false),
  passwordHash: text("password_hash"),
  passwordSaltHex: text("password_salt_hex"),
  wrappedKeyHex: text("wrapped_key_hex"),
  requiresEmail: boolean("requires_email").notNull().default(false),
  allowedDomains: text("allowed_domains"), // comma-separated e.g. "acme.com,partner.org"
  allowDownload: boolean("allow_download").notNull().default(false),
  watermarkEnabled: boolean("watermark_enabled").notNull().default(true),
  watermarkText: text("watermark_text"),
  requiresNda: boolean("requires_nda").notNull().default(false),
  ndaText: text("nda_text"),
  requiresSignature: boolean("requires_signature").notNull().default(false),
  signaturePrompt: text("signature_prompt"),
  webhookUrl: text("webhook_url"),
  brandLogoUrl: text("brand_logo_url"),
  brandAccentColor: text("brand_accent_color"),
  antiLeakBlurEnabled: boolean("anti_leak_blur_enabled").notNull().default(true),
  antiSpyShieldEnabled: boolean("anti_spy_shield_enabled").notNull().default(true),
  burnAfterReading: boolean("burn_after_reading").notNull().default(false),
  voicePitchEnabled: boolean("voice_pitch_enabled").notNull().default(true),
  maxViews: integer("max_views"),
  viewCount: integer("view_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const signatures = pgTable("signatures", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  sessionId: text("session_id").references(() => viewSessions.id, { onDelete: "cascade" }),
  signerEmail: text("signer_email"),
  signerName: text("signer_name"),
  signatureDataUrl: text("signature_data_url").notNull(),
  signedAt: timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
  ipHash: text("ip_hash"),
});

export const viewSessions = pgTable("view_sessions", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  docId: text("doc_id").references(() => documents.id, { onDelete: "set null" }),
  viewerEmail: text("viewer_email"),
  viewerIpHash: text("viewer_ip_hash"),
  country: text("country").notNull().default("Unknown"),
  uaBrowser: text("ua_browser").default("Unknown"),
  uaOs: text("ua_os").default("Unknown"),
  uaDevice: text("ua_device").default("desktop"),
  ndaAgreedAt: timestamp("nda_agreed_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }).defaultNow().notNull(),
  totalDwellSeconds: integer("total_dwell_seconds").notNull().default(0),
  completedPages: integer("completed_pages").notNull().default(0),
  maxPageReached: integer("max_page_reached").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pageEvents = pgTable("page_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => viewSessions.id, { onDelete: "cascade" }),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  docId: text("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  dwellSeconds: integer("dwell_seconds").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pageQuestions = pgTable("page_questions", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  docId: text("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  sessionId: text("session_id").references(() => viewSessions.id, { onDelete: "set null" }),
  pageNumber: integer("page_number").notNull(),
  posXPercent: integer("pos_x_percent").notNull().default(50), // 0 - 100 percentage of page width
  posYPercent: integer("pos_y_percent").notNull().default(50), // 0 - 100 percentage of page height
  questionText: text("question_text").notNull(),
  askerEmail: text("asker_email"),
  askerName: text("asker_name"),
  replyText: text("reply_text"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const docAudioNotes = pgTable("doc_audio_notes", {
  id: text("id").primaryKey(),
  docId: text("doc_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  storageKey: text("storage_key").notNull(),
  durationSec: integer("duration_sec").notNull().default(0),
  title: text("title"),
  audioDataUrl: text("audio_data_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const liveRooms = pgTable("live_rooms", {
  id: text("id").primaryKey(),
  linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }).unique(),
  currentSlide: integer("current_slide").notNull().default(1),
  laserX: integer("laser_x").default(50),
  laserY: integer("laser_y").default(50),
  presenterActive: boolean("presenter_active").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  actorType: text("actor_type").notNull().default("user"), // user | admin | viewer | system
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  detailsJson: text("details_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
