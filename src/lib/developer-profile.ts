/**
 * Developer Profile & Multi-Channel Social Media Allowlist
 * Version: 1.4.0
 * Provides typed configuration, env defaults, and reactive browser state synchronization.
 */

export interface SocialPlatformConfig {
  enabled: boolean;
  url: string;
}

export interface DeveloperProfile {
  name: string;
  tagline: string;
  url: string;
  platforms: {
    github: SocialPlatformConfig;
    twitter: SocialPlatformConfig;
    instagram: SocialPlatformConfig;
    discord: SocialPlatformConfig;
    linkedin: SocialPlatformConfig;
    youtube: SocialPlatformConfig;
    telegram: SocialPlatformConfig;
    facebook: SocialPlatformConfig;
    portfolio: SocialPlatformConfig;
  };
}

export type SocialPlatformKey = keyof DeveloperProfile["platforms"];

export interface SocialPlatformMeta {
  key: SocialPlatformKey;
  name: string;
  placeholder: string;
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const SOCIAL_PLATFORMS_META: SocialPlatformMeta[] = [
  {
    key: "github",
    name: "GitHub",
    placeholder: "https://github.com/SudhirDevOps1",
    colorClass: "text-slate-300",
    badgeBg: "bg-slate-900",
    badgeBorder: "border-slate-700/80 hover:border-slate-500",
    badgeText: "text-slate-200 hover:text-white",
  },
  {
    key: "twitter",
    name: "X / Twitter",
    placeholder: "https://x.com/yourhandle",
    colorClass: "text-sky-400",
    badgeBg: "bg-sky-950/40",
    badgeBorder: "border-sky-500/30 hover:border-sky-400",
    badgeText: "text-sky-300 hover:text-sky-200",
  },
  {
    key: "instagram",
    name: "Instagram",
    placeholder: "https://instagram.com/yourhandle",
    colorClass: "text-pink-400",
    badgeBg: "bg-pink-950/40",
    badgeBorder: "border-pink-500/30 hover:border-pink-400",
    badgeText: "text-pink-300 hover:text-pink-200",
  },
  {
    key: "discord",
    name: "Discord",
    placeholder: "https://discord.gg/yourinvite or handle",
    colorClass: "text-indigo-400",
    badgeBg: "bg-indigo-950/40",
    badgeBorder: "border-indigo-500/30 hover:border-indigo-400",
    badgeText: "text-indigo-300 hover:text-indigo-200",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    placeholder: "https://linkedin.com/in/yourprofile",
    colorClass: "text-blue-400",
    badgeBg: "bg-blue-950/40",
    badgeBorder: "border-blue-500/30 hover:border-blue-400",
    badgeText: "text-blue-300 hover:text-blue-200",
  },
  {
    key: "youtube",
    name: "YouTube",
    placeholder: "https://youtube.com/@yourchannel",
    colorClass: "text-red-400",
    badgeBg: "bg-red-950/40",
    badgeBorder: "border-red-500/30 hover:border-red-400",
    badgeText: "text-red-300 hover:text-red-200",
  },
  {
    key: "telegram",
    name: "Telegram",
    placeholder: "https://t.me/yourusername",
    colorClass: "text-cyan-400",
    badgeBg: "bg-cyan-950/40",
    badgeBorder: "border-cyan-500/30 hover:border-cyan-400",
    badgeText: "text-cyan-300 hover:text-cyan-200",
  },
  {
    key: "facebook",
    name: "Facebook",
    placeholder: "https://facebook.com/yourpage",
    colorClass: "text-blue-500",
    badgeBg: "bg-blue-950/30",
    badgeBorder: "border-blue-600/30 hover:border-blue-500",
    badgeText: "text-blue-300 hover:text-blue-200",
  },
  {
    key: "portfolio",
    name: "Portfolio / Website",
    placeholder: "https://yourportfolio.com",
    colorClass: "text-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/30 hover:border-amber-400",
    badgeText: "text-amber-300 hover:text-amber-200",
  },
];

export const DEVELOPER_PROFILE_STORAGE_KEY = "blindshare_custom_developer_profile";
export const DEVELOPER_PROFILE_EVENT = "blindshare-devprofile-updated";

export function getDefaultDeveloperProfile(): DeveloperProfile {
  return {
    name: process.env.NEXT_PUBLIC_DEVELOPER_NAME || "SudhirDevOps1",
    tagline:
      process.env.NEXT_PUBLIC_DEVELOPER_TAGLINE ||
      "Lead Creator & Maintainer • Zero-Knowledge Document Vault Platform",
    url:
      process.env.NEXT_PUBLIC_DEVELOPER_URL ||
      process.env.NEXT_PUBLIC_DEVELOPER_GITHUB ||
      "https://github.com/SudhirDevOps1",
    platforms: {
      github: {
        enabled: true,
        url: process.env.NEXT_PUBLIC_DEVELOPER_GITHUB || "https://github.com/SudhirDevOps1",
      },
      twitter: {
        enabled: Boolean(process.env.NEXT_PUBLIC_DEVELOPER_TWITTER),
        url: process.env.NEXT_PUBLIC_DEVELOPER_TWITTER || "",
      },
      instagram: {
        enabled: Boolean(process.env.NEXT_PUBLIC_DEVELOPER_INSTAGRAM),
        url: process.env.NEXT_PUBLIC_DEVELOPER_INSTAGRAM || "",
      },
      discord: {
        enabled: Boolean(process.env.NEXT_PUBLIC_DEVELOPER_DISCORD),
        url: process.env.NEXT_PUBLIC_DEVELOPER_DISCORD || "",
      },
      linkedin: {
        enabled: Boolean(process.env.NEXT_PUBLIC_DEVELOPER_LINKEDIN),
        url: process.env.NEXT_PUBLIC_DEVELOPER_LINKEDIN || "",
      },
      youtube: {
        enabled: Boolean(process.env.NEXT_PUBLIC_DEVELOPER_YOUTUBE),
        url: process.env.NEXT_PUBLIC_DEVELOPER_YOUTUBE || "",
      },
      telegram: {
        enabled: Boolean(process.env.NEXT_PUBLIC_DEVELOPER_TELEGRAM),
        url: process.env.NEXT_PUBLIC_DEVELOPER_TELEGRAM || "",
      },
      facebook: {
        enabled: Boolean(process.env.NEXT_PUBLIC_DEVELOPER_FACEBOOK),
        url: process.env.NEXT_PUBLIC_DEVELOPER_FACEBOOK || "",
      },
      portfolio: {
        enabled: Boolean(process.env.NEXT_PUBLIC_DEVELOPER_PORTFOLIO),
        url: process.env.NEXT_PUBLIC_DEVELOPER_PORTFOLIO || "",
      },
    },
  };
}

export function loadDeveloperProfile(): DeveloperProfile {
  const profile = getDefaultDeveloperProfile();
  if (typeof window === "undefined") return profile;

  try {
    const raw = localStorage.getItem(DEVELOPER_PROFILE_STORAGE_KEY);
    if (!raw) return profile;

    const parsed = JSON.parse(raw);
    if (parsed.name && typeof parsed.name === "string") profile.name = parsed.name;
    if (parsed.tagline && typeof parsed.tagline === "string") profile.tagline = parsed.tagline;
    if (parsed.url && typeof parsed.url === "string") profile.url = parsed.url;

    if (parsed.platforms && typeof parsed.platforms === "object") {
      for (const [key, cfg] of Object.entries(parsed.platforms)) {
        if (key in profile.platforms && cfg && typeof cfg === "object") {
          const typedKey = key as keyof DeveloperProfile["platforms"];
          const conf = cfg as any;
          profile.platforms[typedKey] = {
            enabled: typeof conf.enabled === "boolean" ? conf.enabled : Boolean(conf.url),
            url: typeof conf.url === "string" ? conf.url : "",
          };
        }
      }
    } else {
      // Legacy flat keys backward compatibility
      const legacyKeys: Array<keyof DeveloperProfile["platforms"]> = [
        "github",
        "twitter",
        "instagram",
        "discord",
        "linkedin",
        "youtube",
        "telegram",
        "facebook",
        "portfolio",
      ];
      for (const k of legacyKeys) {
        if (parsed[k] !== undefined && typeof parsed[k] === "string") {
          profile.platforms[k] = {
            enabled: Boolean(parsed[k].trim()),
            url: parsed[k],
          };
        }
      }
    }
  } catch {}

  return profile;
}

export function mergeDeveloperProfile(incoming: any): DeveloperProfile {
  const profile = getDefaultDeveloperProfile();
  if (!incoming || typeof incoming !== "object") return profile;

  if (incoming.name && typeof incoming.name === "string") profile.name = incoming.name.trim();
  if (incoming.tagline && typeof incoming.tagline === "string") profile.tagline = incoming.tagline.trim();
  if (incoming.url && typeof incoming.url === "string") profile.url = incoming.url.trim();

  if (incoming.platforms && typeof incoming.platforms === "object") {
    for (const [key, cfg] of Object.entries(incoming.platforms)) {
      if (key in profile.platforms && cfg && typeof cfg === "object") {
        const typedKey = key as keyof DeveloperProfile["platforms"];
        const conf = cfg as any;
        profile.platforms[typedKey] = {
          enabled: typeof conf.enabled === "boolean" ? conf.enabled : Boolean(conf.url),
          url: typeof conf.url === "string" ? conf.url.trim() : "",
        };
      }
    }
  } else {
    const legacyKeys: Array<keyof DeveloperProfile["platforms"]> = [
      "github",
      "twitter",
      "instagram",
      "discord",
      "linkedin",
      "youtube",
      "telegram",
      "facebook",
      "portfolio",
    ];
    for (const k of legacyKeys) {
      if (incoming[k] !== undefined && typeof incoming[k] === "string") {
        profile.platforms[k] = {
          enabled: Boolean(incoming[k].trim()),
          url: incoming[k].trim(),
        };
      }
    }
  }

  return profile;
}

export function saveDeveloperProfile(profile: DeveloperProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEVELOPER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event(DEVELOPER_PROFILE_EVENT));
  } catch {}
}

export async function fetchDeveloperProfileFromDb(): Promise<DeveloperProfile | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/public-settings");
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.developer_profile) {
      const merged = mergeDeveloperProfile(data.developer_profile);
      saveDeveloperProfile(merged);
      return merged;
    }
  } catch {}
  return null;
}

export async function saveDeveloperProfileToDb(profile: DeveloperProfile): Promise<{ success: boolean; error?: string }> {
  // Update local reactive state immediately
  saveDeveloperProfile(profile);

  if (typeof window === "undefined") return { success: true };

  try {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developerProfile: profile }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to persist to database" };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error saving to database" };
  }
}
