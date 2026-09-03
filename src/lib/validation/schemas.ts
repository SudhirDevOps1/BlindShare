import { z } from "zod";

/**
 * Centralized, strict request-body validation (Zod).
 * Every API route should parse `request.json()` through one of these schemas
 * BEFORE touching the database, so malformed/hostile input is rejected with a
 * precise 400 instead of leaking a stack trace or silently doing the wrong thing.
 */

// ── Shared primitives ───────────────────────────────────────────────────────
export const emailSchema = z
  .string()
  .trim()
  .min(5, "Email is too short")
  .max(254, "Email is too long")
  .email("Enter a valid email address")
  .transform((v) => v.toLowerCase());

/**
 * Strict password policy (configurable floor via PASSWORD_MIN_LENGTH, default 10):
 * at least one lowercase, one uppercase, one digit, one symbol.
 */
export function passwordSchema(minLength = Number(process.env.PASSWORD_MIN_LENGTH || "10")) {
  return z
    .string()
    .min(minLength, `Password must be at least ${minLength} characters`)
    .max(128, "Password is too long")
    .refine((v) => /[a-z]/.test(v), "Password must include a lowercase letter")
    .refine((v) => /[A-Z]/.test(v), "Password must include an uppercase letter")
    .refine((v) => /[0-9]/.test(v), "Password must include a digit")
    .refine((v) => /[^A-Za-z0-9]/.test(v), "Password must include a symbol");
}

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name is too long")
  .refine((v) => !/[<>]/.test(v), "Name contains invalid characters");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(64, "Slug is too long")
  .regex(/^[a-z0-9\-_]*$/, "Slug may only contain lowercase letters, numbers, hyphens and underscores")
  .optional();

export const hexStringSchema = (maxLen: number) =>
  z
    .string()
    .max(maxLen)
    .regex(/^[0-9a-fA-F]*$/, "Expected a hex-encoded string")
    .optional()
    .nullable();

export const isoDateSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Expected a valid ISO-8601 date")
  .optional();

// ── Auth ─────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema(),
  inviteCode: z.string().trim().max(128).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(256),
  altcha: z.string().optional(),
});

// ── Documents ────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = () => Number(process.env.MAX_FILE_MB || "25") * 1024 * 1024;
const MAX_VIDEO_BYTES = () => Number(process.env.MAX_VIDEO_MB || "50") * 1024 * 1024;

export const createDocumentSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    originalFilename: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .refine((v) => !/[\/\\\0]/.test(v), "Filename contains invalid path characters")
      .refine((v) => /\.[a-zA-Z0-9]{1,10}$/.test(v), "Filename must include a valid extension"),
    sizeBytes: z.number().int().positive().max(500 * 1024 * 1024, "File is implausibly large"),
    pageCount: z.number().int().positive().max(20000).optional(),
    encryptionMode: z.enum(["e2ee-fragment", "plain-cipher-at-rest"]).optional(),
    ivHex: hexStringSchema(64),
    tagHex: hexStringSchema(64),
    ownerEncryptedKeyHex: hexStringSchema(256),
    ownerEncryptedKeyIvHex: hexStringSchema(64),
    directCiphertextBase64: z.string().max(700 * 1024 * 1024).optional(),
  })
  .superRefine((val, ctx) => {
    const ext = (val.originalFilename.split(".").pop() || "").toLowerCase();
    const isVideo = ["mp4", "webm"].includes(ext);
    const cap = isVideo ? MAX_VIDEO_BYTES() : MAX_FILE_BYTES();
    if (val.sizeBytes > cap) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File exceeds the ${Math.round(cap / (1024 * 1024))}MB limit for this category`,
        path: ["sizeBytes"],
      });
    }
  });

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

export const createVersionSchema = z.object({
  sizeBytes: z.number().int().positive().max(500 * 1024 * 1024).optional(),
  pageCount: z.number().int().positive().max(20000).optional(),
  ivHex: hexStringSchema(64),
  tagHex: hexStringSchema(64),
  changelog: z.string().trim().max(500).optional(),
  directCiphertextBase64: z.string().max(700 * 1024 * 1024).optional(),
});

// ── Links ────────────────────────────────────────────────────────────────────
export const createLinkSchema = z
  .object({
    docId: z.string().trim().max(64).optional(),
    dataroomId: z.string().trim().max(64).optional(),
    name: z.string().trim().min(1, "Link name is required").max(150),
    slug: slugSchema,
    password: z.string().max(256).optional(),
    passwordSaltHex: hexStringSchema(64),
    wrappedKeyHex: hexStringSchema(512),
    requiresEmail: z.boolean().optional(),
    allowedDomains: z.string().trim().max(500).optional(),
    allowDownload: z.boolean().optional(),
    watermarkEnabled: z.boolean().optional(),
    watermarkText: z.string().trim().max(120).optional(),
    requiresNda: z.boolean().optional(),
    ndaText: z.string().trim().max(5000).optional(),
    requiresSignature: z.boolean().optional(),
    signaturePrompt: z.string().trim().max(500).optional(),
    webhookUrl: z.string().trim().url("Must be a valid URL").max(1000).nullable().optional().or(z.literal("")),
    brandLogoUrl: z.string().trim().max(1000).nullable().optional().or(z.literal("")),
    brandAccentColor: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be valid hex color").nullable().optional().or(z.literal("")),
    antiLeakBlurEnabled: z.boolean().optional(),
    antiSpyShieldEnabled: z.boolean().optional(),
    burnAfterReading: z.boolean().optional(),
    voicePitchEnabled: z.boolean().optional(),
    maxViews: z.union([z.number().int().positive().max(1_000_000), z.string()]).optional(),
    expiresAt: isoDateSchema,
  })
  .refine((v) => v.docId || v.dataroomId, {
    message: "Either docId or dataroomId is required",
    path: ["docId"],
  });

export const updateLinkSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  isActive: z.boolean().optional(),
  isRevoked: z.boolean().optional(),
  requiresEmail: z.boolean().optional(),
  allowedDomains: z.string().trim().max(500).nullable().optional(),
  allowDownload: z.boolean().optional(),
  watermarkEnabled: z.boolean().optional(),
  watermarkText: z.string().trim().max(120).nullable().optional(),
  requiresNda: z.boolean().optional(),
  ndaText: z.string().trim().max(5000).nullable().optional(),
  requiresSignature: z.boolean().optional(),
  signaturePrompt: z.string().trim().max(500).nullable().optional(),
  webhookUrl: z.string().trim().url("Must be a valid URL").max(1000).nullable().optional().or(z.literal("")),
  brandLogoUrl: z.string().trim().max(1000).nullable().optional().or(z.literal("")),
  brandAccentColor: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be valid hex color").nullable().optional().or(z.literal("")),
  antiLeakBlurEnabled: z.boolean().optional(),
  antiSpyShieldEnabled: z.boolean().optional(),
  burnAfterReading: z.boolean().optional(),
  voicePitchEnabled: z.boolean().optional(),
  maxViews: z.union([z.number().int().positive().max(1_000_000), z.string(), z.null()]).optional(),
  expiresAt: z.union([isoDateSchema, z.null()]).optional(),
  password: z.string().max(256).nullable().optional(),
  passwordSaltHex: hexStringSchema(64),
  wrappedKeyHex: hexStringSchema(512),
});

// ── Viewer gate verification & Signature ───────────────────────────────────
export const verifyLinkSchema = z.object({
  password: z.string().max(256).optional(),
  email: z.string().trim().max(254).email().optional().or(z.literal("")),
  ndaAgreed: z.boolean().optional(),
  signatureProvided: z.boolean().optional(),
  altcha: z.string().optional(),
});

export const submitSignatureSchema = z.object({
  sessionId: z.string().trim().min(1).max(80).optional(),
  signerName: z.string().trim().min(1, "Name is required").max(120),
  signerEmail: emailSchema.optional(),
  signatureDataUrl: z
    .string()
    .min(10, "Signature data is required")
    .max(500_000, "Signature payload too large")
    .refine((v) => v.startsWith("data:image/"), "Signature must be an image data URL"),
});

export const sessionHeartbeatSchema = z.object({
  sessionId: z.string().trim().min(1).max(80),
  events: z
    .array(
      z.object({
        pageNumber: z.number().int().min(1).max(20000),
        dwellSeconds: z.number().int().min(0).max(3600),
      })
    )
    .max(500)
    .optional(),
  maxPageReached: z.number().int().min(1).max(20000).optional(),
  completedPages: z.number().int().min(0).max(20000).optional(),
  totalDwellSeconds: z.number().int().min(0).max(86400 * 30).optional(),
});

// ── Datarooms ────────────────────────────────────────────────────────────────
export const createDataroomSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional(),
  docIds: z.array(z.string().trim().max(64)).max(500).optional(),
});

// ── Admin ────────────────────────────────────────────────────────────────────
export const adminUserPatchSchema = z.object({
  userId: z.string().trim().min(1).max(64),
  isBlocked: z.boolean().optional(),
  role: z.enum(["owner", "admin", "super_admin"]).optional(),
});

export const adminInviteSchema = z.object({
  role: z.enum(["owner", "admin", "super_admin"]).optional(),
  expiryDays: z.union([z.number().int().positive().max(365), z.string()]).optional(),
  customCode: z.string().trim().max(80).optional(),
});

export const adminSettingsSchema = z.object({
  maintenanceMode: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
  maintenance_mode: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
  broadcastBanner: z.string().trim().max(500).optional(),
  broadcast_banner: z.string().trim().max(500).optional(),
  settings: z
    .object({
      maintenance_mode: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
      maintenanceMode: z.union([z.boolean(), z.string().transform((v) => v === "true")]).optional(),
      broadcast_banner: z.string().trim().max(500).optional(),
      broadcastBanner: z.string().trim().max(500).optional(),
    })
    .optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: emailSchema,
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(5000),
  website: z.string().max(100).optional(), // Honeypot field
});

/**
 * Formats a ZodError into a compact, user-safe message (first issue) plus the
 * full field-level breakdown for programmatic clients — never leaks stack traces.
 */
export function formatZodError(error: z.ZodError): { message: string; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    if (!fields[path]) fields[path] = issue.message;
  }
  return {
    message: error.issues[0]?.message || "Invalid request",
    fields,
  };
}
