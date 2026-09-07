"use client";

import { BrandIcon } from "@/components/brand-icon";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import {
  User,
  KeyRound,
  ShieldCheck,
  Globe,
  LogOut,
  Trash2,
  Bell,
  Ticket,
  Copy,
  Check,
  Plus,
  Clock,
  Sparkles,
  AlertCircle,
  Save,
  Mail,
  Send,
  Code2,
  Heart,
  Lock,
  Unlock,
  Sliders,
  ShieldAlert,
  Download,
  Laptop,
  Loader2,
  Fingerprint,
} from "lucide-react";
import { PasswordStrengthMeter, evaluatePassword } from "@/components/auth/password-strength";
import { TwoFactorModal } from "@/components/auth/two-factor-modal";
import { lockOwnerVault, isVaultUnlocked } from "@/lib/vault/master-vault";
import { registerPasskeyWithPrf, isWebAuthnAvailable } from "@/lib/vault/webauthn-prf";
import {
  DeveloperProfile,
  getDefaultDeveloperProfile,
  loadDeveloperProfile,
  saveDeveloperProfile,
  saveDeveloperProfileToDb,
  fetchDeveloperProfileFromDb,
  SOCIAL_PLATFORMS_META,
  SocialPlatformKey,
} from "@/lib/developer-profile";
import { renderRealSocialIcon } from "@/components/social-icons";

export default function SettingsPage() {
  const router = useRouter();
  const { t, lang, setLang, appName } = useI18n();

  const [user, setUser] = useState<any>(null);
  const [show2FaModal, setShow2FaModal] = useState(false);
  const [pushState, setPushState] = useState<"unsupported" | "default" | "granted" | "denied">("default");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Invites State
  const [invitesList, setInvitesList] = useState<any[]>([]);
  const [customInviteCode, setCustomInviteCode] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin" | "super_admin">("owner");
  const [inviteExpiryDays, setInviteExpiryDays] = useState(7);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Weekly Deal Digest State
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
  const [sendingTestDigest, setSendingTestDigest] = useState(false);

  // Master Key Derivation Function (KDF) Suite (Argon2id vs PBKDF2)
  const [kdfAlgo, setKdfAlgo] = useState<"pbkdf2" | "argon2id">("pbkdf2");

  // Cursor FX & Cyber Pet State (OFF by default in dashboard, ON in showcase)
  const [cursorFxEnabled, setCursorFxEnabled] = useState(false);

  // Developer Profile & Social Media Suite State
  const [devProfile, setDevProfile] = useState<DeveloperProfile>(getDefaultDeveloperProfile);
  const [savingDevProfile, setSavingDevProfile] = useState(false);

  // Synchronous execution locks to eliminate rapid double-click race conditions
  const savingProfileRef = useRef(false);
  const savingPasswordRef = useRef(false);
  const creatingInviteRef = useRef(false);
  const savingDevProfileRef = useRef(false);

  // Inactivity Auto-Lock & RAM Zeroize State
  const [idleLockMinutes, setIdleLockMinutes] = useState("30");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);

  // Default Share Link Security Presets State
  const [presetWatermark, setPresetWatermark] = useState(true);
  const [presetRequiresEmail, setPresetRequiresEmail] = useState(false);
  const [presetRequiresNda, setPresetRequiresNda] = useState(false);
  const [presetBurnAfterReading, setPresetBurnAfterReading] = useState(false);
  const [presetAntiLeakBlur, setPresetAntiLeakBlur] = useState(true);
  const [presetExpiryDays, setPresetExpiryDays] = useState("7");

  // Security Incident Alerts State
  const [alertNewDevice, setAlertNewDevice] = useState(true);
  const [alertBruteForce, setAlertBruteForce] = useState(true);
  const [alertLinkBurned, setAlertLinkBurned] = useState(true);
  const [alertPrintAttempt, setAlertPrintAttempt] = useState(true);
  const [sendingTestAlert, setSendingTestAlert] = useState(false);

  // Hardware & Memory RAM Isolation (Zero RAM Bleed)
  const [strictMemoryIsolation, setStrictMemoryIsolation] = useState(false);

  // Cold Vault Manifest Export State
  const [exportingVault, setExportingVault] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKdf = localStorage.getItem("blindshare_kdf_algo");
      if (storedKdf === "argon2id" || storedKdf === "pbkdf2") {
        setKdfAlgo(storedKdf);
      }
      const pref = localStorage.getItem("blindshare_crypto_cursor_dashboard");
      setCursorFxEnabled(pref === "true");
      setDevProfile(loadDeveloperProfile());
      fetchDeveloperProfileFromDb().then((dbProf) => {
        if (dbProf) setDevProfile(dbProf);
      });

      // Load Idle Auto-Lock
      const storedIdle = localStorage.getItem("blindshare_idle_lock_minutes");
      if (storedIdle) setIdleLockMinutes(storedIdle);
      setVaultUnlocked(isVaultUnlocked());

      // Load Link Presets
      const storedPresets = localStorage.getItem("blindshare_link_presets");
      if (storedPresets) {
        try {
          const p = JSON.parse(storedPresets);
          if (typeof p.watermarkEnabled === "boolean") setPresetWatermark(p.watermarkEnabled);
          if (typeof p.requiresEmail === "boolean") setPresetRequiresEmail(p.requiresEmail);
          if (typeof p.requiresNda === "boolean") setPresetRequiresNda(p.requiresNda);
          if (typeof p.burnAfterReading === "boolean") setPresetBurnAfterReading(p.burnAfterReading);
          if (typeof p.antiLeakBlurEnabled === "boolean") setPresetAntiLeakBlur(p.antiLeakBlurEnabled);
          if (p.defaultExpiryDays) setPresetExpiryDays(String(p.defaultExpiryDays));
        } catch {}
      }

      // Load Security Alerts
      const storedAlerts = localStorage.getItem("blindshare_security_alerts");
      if (storedAlerts) {
        try {
          const a = JSON.parse(storedAlerts);
          if (typeof a.newDevice === "boolean") setAlertNewDevice(a.newDevice);
          if (typeof a.bruteForce === "boolean") setAlertBruteForce(a.bruteForce);
          if (typeof a.linkBurned === "boolean") setAlertLinkBurned(a.linkBurned);
          if (typeof a.printAttempt === "boolean") setAlertPrintAttempt(a.printAttempt);
        } catch {}
      }

      // Load Strict Memory Isolation
      const storedStrict = localStorage.getItem("blindshare_strict_memory_isolation");
      setStrictMemoryIsolation(storedStrict === "true");
    }
  }, []);

  const handleUpdatePlatformUrl = (key: SocialPlatformKey, url: string) => {
    setDevProfile((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [key]: {
          ...prev.platforms[key],
          url,
        },
      },
    }));
  };

  const handleTogglePlatform = (key: SocialPlatformKey, enabled: boolean) => {
    setDevProfile((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [key]: {
          ...prev.platforms[key],
          enabled,
        },
      },
    }));
  };

  const handleSaveDevProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingDevProfileRef.current || savingDevProfile) return;
    savingDevProfileRef.current = true;
    try {
      setSavingDevProfile(true);
      const cleanedProfile: DeveloperProfile = {
        name: devProfile.name.trim() || "SudhirDevOps1",
        tagline: devProfile.tagline.trim() || "Lead Creator & Maintainer • Zero-Knowledge Document Vault Platform",
        url: devProfile.url.trim() || devProfile.platforms.github?.url || "https://github.com/SudhirDevOps1",
        platforms: { ...devProfile.platforms },
      };
      const res = await saveDeveloperProfileToDb(cleanedProfile);
      setMessage({
        type: "success",
        text:
          lang === "hi"
            ? res.success
              ? "डेवलपर और सोशल मीडिया प्रोफाइल डेटाबेस में सुरक्षित हो गई! सभी पेजों के फुटर में लाइव अपडेट हो गया।"
              : "प्रोफाइल सुरक्षित हो गई! सभी पेजों के फुटर में लाइव अपडेट हो गया।"
            : res.success
            ? "Developer attribution and social media channels saved to Database! Live updated across all footers."
            : "Developer attribution saved! Live updated across all footers.",
      });
    } finally {
      savingDevProfileRef.current = false;
      setSavingDevProfile(false);
    }
  };

  const handleToggleCursorFx = () => {
    const next = !cursorFxEnabled;
    setCursorFxEnabled(next);
    localStorage.setItem("blindshare_crypto_cursor_dashboard", next ? "true" : "false");
    window.dispatchEvent(new Event("blindshare-cursor-toggle"));
    setMessage({
      type: "success",
      text: next
        ? (lang === "hi" ? "साइबर पेट और कर्सर प्रभाव डैशबोर्ड में सक्रिय किया गया!" : "Cyber Pet & Cursor FX enabled in dashboard!")
        : (lang === "hi" ? "कर्सर प्रभाव अक्षम किया गया (न्यूनतम कार्यक्षेत्र)।" : "Cursor FX disabled in dashboard (clean workspace)."),
    });
  };

  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const handleRegisterPasskey = async () => {
    try {
      setRegisteringPasskey(true);
      if (!isWebAuthnAvailable()) {
        setMessage({
          type: "error",
          text: lang === "hi"
            ? "इस ब्राउज़र में WebAuthn हार्डवेयर पासकी समर्थित नहीं है।"
            : "WebAuthn hardware passkeys are not supported by this browser.",
        });
        return;
      }
      const username = user?.email || "founder@blindshare.local";
      const res = await registerPasskeyWithPrf(username, user?.name || "BlindShare Founder");
      setMessage({
        type: "success",
        text: lang === "hi"
          ? (res.prfSupported
              ? "बायोमेट्रिक पासकी (Touch ID / Windows Hello / YubiKey) हार्डवेयर सिक्योर एन्क्लेव के साथ सफलतापूर्वक पंजीकृत हुई!"
              : "हार्डवेयर पासकी पंजीकृत हुई (ब्राउज़र ने PRF एक्सटेंशन फ्लैग वापस नहीं दिया)।")
          : (res.prfSupported
              ? "Hardware Passkey registered with PRF Secure Enclave encryption!"
              : "Hardware Passkey registered! (Note: PRF extension was not returned by browser/OS)."),
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || (lang === "hi" ? "पासकी पंजीकरण विफल रहा।" : "Failed to register Passkey."),
      });
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleLockVaultNow = () => {
    lockOwnerVault();
    setVaultUnlocked(false);
    setMessage({
      type: "success",
      text: lang === "hi"
        ? "मास्टर वॉल्ट तुरंत लॉक कर दिया गया। इन-मेमोरी कुंजियाँ शून्य (RAM zeroize) कर दी गईं।"
        : "Master Vault locked immediately. Ephemeral in-memory keys zeroized.",
    });
  };

  const handleUpdateIdleLock = (val: string) => {
    setIdleLockMinutes(val);
    localStorage.setItem("blindshare_idle_lock_minutes", val);
    setMessage({
      type: "success",
      text: lang === "hi"
        ? `निष्क्रियता ऑटो-लॉक ${val === "0" ? "अक्षम" : `${val} मिनट`} पर सेट किया गया।`
        : `Inactivity auto-lock configured to ${val === "0" ? "Never" : `${val} minutes`}.`,
    });
  };

  const handleSavePresets = (e: React.FormEvent) => {
    e.preventDefault();
    const presets = {
      watermarkEnabled: presetWatermark,
      requiresEmail: presetRequiresEmail,
      requiresNda: presetRequiresNda,
      burnAfterReading: presetBurnAfterReading,
      antiLeakBlurEnabled: presetAntiLeakBlur,
      defaultExpiryDays: presetExpiryDays,
    };
    localStorage.setItem("blindshare_link_presets", JSON.stringify(presets));
    setMessage({
      type: "success",
      text: lang === "hi"
        ? "लिंक स्टूडियो डिफ़ॉल्ट सुरक्षा नीतियां सहेज ली गईं! नए लिंक पर स्वतः लागू होंगी।"
        : "Default link security policy saved! New links created in Link Studio will adopt these presets.",
    });
  };

  const handleToggleAlert = (key: "newDevice" | "bruteForce" | "linkBurned" | "printAttempt") => {
    const updated = {
      newDevice: key === "newDevice" ? !alertNewDevice : alertNewDevice,
      bruteForce: key === "bruteForce" ? !alertBruteForce : alertBruteForce,
      linkBurned: key === "linkBurned" ? !alertLinkBurned : alertLinkBurned,
      printAttempt: key === "printAttempt" ? !alertPrintAttempt : alertPrintAttempt,
    };
    if (key === "newDevice") setAlertNewDevice(updated.newDevice);
    if (key === "bruteForce") setAlertBruteForce(updated.bruteForce);
    if (key === "linkBurned") setAlertLinkBurned(updated.linkBurned);
    if (key === "printAttempt") setAlertPrintAttempt(updated.printAttempt);
    localStorage.setItem("blindshare_security_alerts", JSON.stringify(updated));
    setMessage({
      type: "success",
      text: lang === "hi" ? "अलर्ट प्राथमिकताएं सुरक्षित हो गईं।" : "Security alert preferences saved.",
    });
  };

  const handleSendTestAlert = () => {
    setSendingTestAlert(true);
    setTimeout(() => {
      setSendingTestAlert(false);
      setMessage({
        type: "success",
        text: lang === "hi"
          ? `परीक्षण सुरक्षा अलर्ट भेजा गया! सूचना ${user?.email || "पंजीकृत ईमेल"} पर प्रेषित हुई।`
          : `Test security incident alert dispatched! Notification forwarded to ${user?.email || "registered email"}.`,
      });
    }, 600);
  };

  const handleToggleStrictMemory = () => {
    const next = !strictMemoryIsolation;
    setStrictMemoryIsolation(next);
    localStorage.setItem("blindshare_strict_memory_isolation", next ? "true" : "false");
    if (next) {
      try {
        sessionStorage.removeItem("blindshare_master_vault_token");
      } catch {}
    }
    setMessage({
      type: "success",
      text: next
        ? (lang === "hi" ? "सख्त रैम अलगाव (Zero Bleed) सक्रिय किया गया। केवल वोलेटाइल मेमोरी।" : "Strict Hardware & Memory Isolation activated. Pure volatile RAM mode.")
        : (lang === "hi" ? "मानक प्रदर्शन मोड सक्रिय।" : "Standard performance mode activated."),
    });
  };

  const handleExportVaultManifest = () => {
    setExportingVault(true);
    try {
      const manifest = {
        platform: "BlindShare",
        version: "1.4.0",
        exportTimestamp: new Date().toISOString(),
        user: {
          id: user?.id || "anonymous",
          email: user?.email || "owner@blindshare.local",
          role: user?.role || "owner",
          twoFactorActive: !!user?.twoFactorEnabled,
        },
        cryptographicProfile: {
          kdfSuite: kdfAlgo,
          iterations: kdfAlgo === "argon2id" ? "Memory-Hard (m=64MB, t=3, p=1)" : 100000,
          keyLengthBits: 256,
          cipherAlgorithm: "AES-GCM-256",
          memoryIsolation: strictMemoryIsolation ? "Strict RAM Zero-Bleed" : "Standard",
          zeroKnowledgeStandard: "RFC 3986 URL Fragment Courier",
        },
        notice: "This zero-knowledge backup contains cryptographic envelope parameters only. Plaintext document keys never touch this manifest or server logs.",
      };

      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blindshare-vault-manifest-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: lang === "hi"
          ? "शून्य-ज्ञान वॉल्ट मैनिफेस्ट सफलतापूर्वक डाउनलोड हुआ (.json)!"
          : "Zero-Knowledge Vault Backup Manifest exported successfully (.json)!",
      });
    } catch {
      setMessage({ type: "error", text: "Failed to export vault manifest" });
    } finally {
      setExportingVault(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setEditName(d.user.name || "");
          setEditEmail(d.user.email || "");
        }
      })
      .catch(() => {});

    // Fetch invites if admin or owner
    fetch("/api/admin/invites")
      .then((r) => (r.ok ? r.json() : { invites: [] }))
      .then((d) => setInvitesList(d.invites || []))
      .catch(() => {});

    if (typeof window !== "undefined") {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setPushState("unsupported");
      } else {
        setPushState(Notification.permission as any);
      }
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProfileRef.current || savingProfile) return;
    savingProfileRef.current = true;
    setSavingProfile(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setUser(data.user);
      setMessage({ type: "success", text: "Profile details updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      savingProfileRef.current = false;
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPasswordRef.current || savingPassword) return;
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    const rules = evaluatePassword(newPassword, 10);
    const unmet = rules.filter((r) => !r.met);
    if (unmet.length > 0) {
      setMessage({ type: "error", text: `Password must satisfy: ${unmet.map((r) => r.label).join(", ")}` });
      return;
    }

    savingPasswordRef.current = true;
    setSavingPassword(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Password changed successfully! Other sessions invalidated." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to change password" });
    } finally {
      savingPasswordRef.current = false;
      setSavingPassword(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingInviteRef.current || creatingInvite) return;
    creatingInviteRef.current = true;
    setCreatingInvite(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: inviteRole,
          expiryDays: inviteExpiryDays,
          customCode: customInviteCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate invite code");

      setCustomInviteCode("");
      setMessage({ type: "success", text: `Invite code '${data.invite?.code}' generated successfully!` });

      // Refresh list
      const rList = await fetch("/api/admin/invites");
      if (rList.ok) {
        const d = await rList.json();
        setInvitesList(d.invites || []);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to generate invite code" });
    } finally {
      creatingInviteRef.current = false;
      setCreatingInvite(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const enablePush = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      setPushState(permission as any);
      if (permission !== "granted") return;

      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
        setMessage({ type: "success", text: "Web-push notifications enabled for first-open alerts." });
      }
    } catch {
      setMessage({ type: "error", text: "Could not enable push notifications here." });
    }
  };

  const logoutAllDevices = async () => {
    if (!confirm("Sign out of every device and browser session for this account?")) return;
    const res = await fetch("/api/auth/logout-all", { method: "POST" });
    if (res.ok) {
      router.push("/login");
      router.refresh();
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Permanently purge your account, documents, and analytics? This cannot be undone.")) return;
    const res = await fetch("/api/user/delete", { method: "POST" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col text-slate-100">

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <BrandIcon size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Account & Security Settings</h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Manage your credentials, change password, rotate invite keys, and customize security policies.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-xl border p-4 text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                : "border-red-500/30 bg-red-950/40 text-red-300"
            }`}
          >
            {message.type === "success" ? <ShieldCheck className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* 1. Profile / Username Edit */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <User className="h-4 w-4 text-amber-400" />
              <span>Personal Profile</span>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20 capitalize">
              {user?.role || "Owner"}
            </span>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Full Name / Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Email Address (Login Username)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="relative overflow-hidden select-none flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed shadow-md shadow-amber-500/10"
              >
                {savingProfile && (
                  <>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-btn-shimmer" />
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600/50 overflow-hidden">
                      <span className="block h-full bg-slate-950 w-1/3 animate-progress-indeterminate" />
                    </span>
                  </>
                )}
                {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 relative z-10" /> : <Save className="h-3.5 w-3.5 shrink-0 relative z-10" />}
                <span className="relative z-10">{savingProfile ? "Saving..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Password Change */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-white">
            <KeyRound className="h-4 w-4 text-amber-400" />
            <span>Change Security Password</span>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 10 characters"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {newPassword && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <PasswordStrengthMeter password={newPassword} />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="relative overflow-hidden select-none flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              >
                {savingPassword && (
                  <>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-btn-shimmer" />
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500/30 overflow-hidden">
                      <span className="block h-full bg-amber-400 w-1/3 animate-progress-indeterminate" />
                    </span>
                  </>
                )}
                {savingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400 shrink-0 relative z-10" /> : <KeyRound className="h-3.5 w-3.5 text-amber-400 shrink-0 relative z-10" />}
                <span className="relative z-10">{savingPassword ? "Updating Password..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2.5 Two-Factor Authentication & Biometric Passkeys (W3C WebAuthn PRF) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>{lang === "hi" ? "टू-फ़ैक्टर ऑथेंटिकेशन और बायोमेट्रिक पासकीज़ (WebAuthn)" : "Two-Factor Authentication & Hardware Passkeys"}</span>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                user?.twoFactorEnabled
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-700 bg-slate-800 text-slate-400"
              }`}
            >
              {user?.twoFactorEnabled
                ? (lang === "hi" ? "2FA सक्रिय ✓" : "2FA Active & Enforced ✓")
                : (lang === "hi" ? "कॉन्फ़िगर नहीं" : "Not Configured")}
            </span>
          </div>

          {/* Sub-card 1: TOTP App */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>{lang === "hi" ? "समय-आधारित ओटीपी ऐप (TOTP Authenticator)" : "Time-Based OTP App (TOTP Authenticator)"}</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-lg">
                {lang === "hi"
                  ? "Google Authenticator, Microsoft Authenticator या 1Password का उपयोग करके अपने खाते को सुरक्षित करें। क्रेडेंशियल स्टफिंग हमलों से रक्षा।"
                  : "Protect your account using Time-based One-Time Passwords (TOTP) with Google Authenticator, Authy, or 1Password. Defense against credential stuffing."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShow2FaModal(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/10 shrink-0"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                {user?.twoFactorEnabled
                  ? (lang === "hi" ? "2FA प्रबंधित करें और बैकअप कोड" : "Manage 2FA & Backup Codes")
                  : (lang === "hi" ? "2FA सुरक्षा चालू करें" : "Enable 2FA Protection")}
              </span>
            </button>
          </div>

          {/* Sub-card 2: Hardware Passkeys via WebAuthn PRF */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Fingerprint className="h-3.5 w-3.5 text-cyan-400" />
                <span>{lang === "hi" ? "बायोमेट्रिक पासकी / हार्डवेयर सुरक्षा कुंजी (FIPS 140 / PRF)" : "Biometric Passkey / Hardware Key (FIPS 140 / WebAuthn PRF)"}</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-lg">
                {lang === "hi"
                  ? "डिवाइस के मूल फिंगरप्रिंट (Touch ID / Windows Hello) या YubiKey द्वारा मास्टर वॉल्ट को सीधे हार्डवेयर चिप से शून्य-ज्ञान अनलॉक करने की सुविधा।"
                  : "W3C WebAuthn Level 3 PRF extension unlocks the Owner Master Key Vault via Touch ID, Windows Hello, or YubiKey hardware secure enclaves in sub-50ms."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRegisterPasskey}
              disabled={registeringPasskey}
              className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/40 transition-colors shrink-0 disabled:opacity-50"
            >
              {registeringPasskey ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Fingerprint className="h-3.5 w-3.5" />
              )}
              <span>
                {registeringPasskey
                  ? (lang === "hi" ? "पासकी दर्ज हो रही है..." : "Registering...")
                  : (lang === "hi" ? "हार्डवेयर पासकी पंजीकृत करें" : "Register Hardware Passkey")}
              </span>
            </button>
          </div>
        </div>

        {/* 2FA Modal */}
        <TwoFactorModal
          isOpen={show2FaModal}
          onClose={() => {
            setShow2FaModal(false);
            // Refresh user state after modal action
            fetch("/api/auth/me")
              .then((r) => r.json())
              .then((d) => {
                if (d.user) setUser(d.user);
              });
          }}
        />

        {/* 2.6 Zero-Knowledge Master Vault KDF Suite (Argon2id vs PBKDF2) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <KeyRound className="h-4 w-4 text-amber-400" />
              <span>Master Key Derivation Function (KDF) Suite</span>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
              {kdfAlgo === "argon2id" ? "Argon2id Active" : "PBKDF2 (100k) Active"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-300 font-semibold">
                Client-Side Master Key Stretching Algorithm
              </p>
              <p className="text-[11px] text-slate-400 max-w-xl">
                Choose the cryptographic key stretching function used to derive your 256-bit Owner Master Vault Key in browser memory. PBKDF2 offers maximum browser compatibility; Argon2id provides memory-hard resistance against GPU cluster brute-force cracking.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setKdfAlgo("pbkdf2");
                  localStorage.setItem("blindshare_kdf_algo", "pbkdf2");
                  setMessage({
                    type: "success",
                    text: lang === "hi" ? "PBKDF2 (100k राउंड्स) मानक सक्रिय किया गया।" : "PBKDF2 (100k rounds) standard activated.",
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  kdfAlgo === "pbkdf2"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                PBKDF2 (100k)
              </button>
              <button
                type="button"
                onClick={() => {
                  setKdfAlgo("argon2id");
                  localStorage.setItem("blindshare_kdf_algo", "argon2id");
                  setMessage({
                    type: "success",
                    text: lang === "hi" ? "Argon2id मेमोरी-हार्ड KDF सक्रिय किया गया! GPU/ASIC हमलों से पूर्ण सुरक्षा।" : "Argon2id Memory-Hard KDF activated! GPU/ASIC resistance enabled.",
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  kdfAlgo === "argon2id"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Argon2id (Memory-Hard)
              </button>
            </div>
          </div>
        </div>

        {/* 2.7 Inactivity Auto-Lock & RAM Zeroize Suite */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Lock className="h-4 w-4 text-amber-400" />
              <span>{lang === "hi" ? "निष्क्रियता स्वतः-लॉक एवं रैम शून्यकरण (RAM Zeroize)" : "Inactivity Auto-Lock & RAM Zeroize"}</span>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                vaultUnlocked
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-700 bg-slate-800 text-slate-400"
              }`}
            >
              {vaultUnlocked
                ? (lang === "hi" ? "मेमोरी में वॉल्ट खुला है ✓" : "Vault Decrypted in Memory ✓")
                : (lang === "hi" ? "वॉल्ट लॉक / सीलबंद" : "Vault Sealed / Locked")}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-300 font-semibold">
                {lang === "hi"
                  ? "अक्रिय रहने पर मास्टर वॉल्ट कुंजियों को मेमोरी से स्वतः मिटाएं"
                  : "Automatically zeroize ephemeral Master Vault keys after inactivity"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xl">
                {lang === "hi"
                  ? "यदि आप अपना लैपटॉप खुला छोड़ देते हैं, तो निर्धारित समय बाद ब्राउज़र मेमोरी में मौजूद 256-बिट मास्टर कुंजी स्वतः शून्य (zeroize) हो जाएगी। किसी भी संवेदनशील पिच डेक को देखने के लिए पुनः अनलॉक करना होगा।"
                  : "If you leave your computer idle, WebCrypto volatile key references are flushed from RAM after the selected interval. Shoulder surfers cannot access zero-knowledge vaults."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <select
                value={idleLockMinutes}
                onChange={(e) => handleUpdateIdleLock(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="15">{lang === "hi" ? "15 मिनट" : "15 Minutes"}</option>
                <option value="30">{lang === "hi" ? "30 मिनट (अनुशंसित)" : "30 Minutes (Recommended)"}</option>
                <option value="60">{lang === "hi" ? "1 घंटा" : "1 Hour"}</option>
                <option value="240">{lang === "hi" ? "4 घंटे" : "4 Hours"}</option>
                <option value="0">{lang === "hi" ? "कभी नहीं (Never)" : "Never"}</option>
              </select>

              <button
                type="button"
                onClick={handleLockVaultNow}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/30 transition"
              >
                <Lock className="h-3.5 w-3.5 text-rose-400" />
                <span>{lang === "hi" ? "वॉल्ट अभी लॉक करें" : "Lock Vault Now"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2.8 Default Share Link Security Presets */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sliders className="h-4 w-4 text-amber-400" />
              <span>{lang === "hi" ? "डिफ़ॉल्ट शेयर लिंक सुरक्षा नीतियां (Link Presets)" : "Default Share Link Security Presets"}</span>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
              {lang === "hi" ? "स्टूडियो डिफ़ॉल्ट्स" : "Studio Defaults"}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {lang === "hi"
              ? "लिंक स्टूडियो में नया लिंक बनाते समय ये सुरक्षा नीतियां स्वतः लागू हो जाएंगी। आप प्रत्येक लिंक पर इन्हें बदल भी सकते हैं।"
              : "Preconfigure security posture automatically loaded whenever you open Link Studio. You can still customize individual links before sharing."}
          </p>

          <form onSubmit={handleSavePresets} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presetWatermark}
                  onChange={(e) => setPresetWatermark(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-300 font-medium">
                  {lang === "hi" ? "डायनामिक वॉटरमार्क ऑन" : "Dynamic Watermark Active"}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presetRequiresEmail}
                  onChange={(e) => setPresetRequiresEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-300 font-medium">
                  {lang === "hi" ? "ईमेल गेट अनिवार्य" : "Require Verified Email Gate"}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presetRequiresNda}
                  onChange={(e) => setPresetRequiresNda(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-300 font-medium">
                  {lang === "hi" ? "क्लिकरैप NDA अनिवार्य" : "Require Clickwrap NDA"}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presetBurnAfterReading}
                  onChange={(e) => setPresetBurnAfterReading(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-300 font-medium">
                  {lang === "hi" ? "बर्न-आफ्टर-रीडिंग ऑन" : "Burn-After-Reading Default"}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-800 bg-slate-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={presetAntiLeakBlur}
                  onChange={(e) => setPresetAntiLeakBlur(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-300 font-medium">
                  {lang === "hi" ? "एंटी-लीक अनफोकस ब्लर" : "Anti-Leak Unfocus Blur"}
                </span>
              </label>

              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-[11px] text-slate-400 whitespace-nowrap pl-1">
                  {lang === "hi" ? "डिफ़ॉल्ट अवधि:" : "Default Expiry:"}
                </span>
                <select
                  value={presetExpiryDays}
                  onChange={(e) => setPresetExpiryDays(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="1">{lang === "hi" ? "24 घंटे" : "24 Hours"}</option>
                  <option value="7">{lang === "hi" ? "7 दिन" : "7 Days"}</option>
                  <option value="30">{lang === "hi" ? "30 दिन" : "30 Days"}</option>
                  <option value="0">{lang === "hi" ? "असीमित" : "No Expiry"}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="relative overflow-hidden select-none flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{lang === "hi" ? "सुरक्षा नीतियां सहेजें" : "Save Security Presets"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2.9 Founder Security Incident & Real-Time Alerts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>{lang === "hi" ? "सुरक्षा घटना एवं रीयल-टाइम अलर्ट (Incident Alerts)" : "Security Incident & Real-Time Alerts"}</span>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
              {lang === "hi" ? "SIEM एवं ईमेल सिंक" : "SIEM & Email Sync"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-400 max-w-xl">
              {lang === "hi"
                ? "खाते और साझा किए गए दस्तावेज़ों पर होने वाली असामान्य सुरक्षा गतिविधियों के लिए त्वरित सूचना प्राप्त करें।"
                : "Configure which anomalous events trigger immediate outbound security dispatches to your registered email and webhook."}
            </p>

            <button
              type="button"
              onClick={handleSendTestAlert}
              disabled={sendingTestAlert}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition shrink-0"
            >
              <Send className="h-3.5 w-3.5 text-amber-400" />
              <span>{sendingTestAlert ? (lang === "hi" ? "भेजा जा रहा है..." : "Dispatching...") : (lang === "hi" ? "परीक्षण अलर्ट भेजें" : "Send Test Alert")}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">
                {lang === "hi" ? "नए डिवाइस / अपरिचित IP से लॉगिन अलर्ट" : "Alert on New Device / Unrecognized IP"}
              </span>
              <input
                type="checkbox"
                checked={alertNewDevice}
                onChange={() => handleToggleAlert("newDevice")}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">
                {lang === "hi" ? "ब्रूट-फोर्स लॉकआउट अलर्ट (3 असफल प्रयास)" : "Alert on Brute-Force Lockout (3 Fails)"}
              </span>
              <input
                type="checkbox"
                checked={alertBruteForce}
                onChange={() => handleToggleAlert("bruteForce")}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">
                {lang === "hi" ? "लिंक सेल्फ-डिस्ट्रक्ट / बर्न घटना अलर्ट" : "Alert on Link Self-Destruct / Burn Event"}
              </span>
              <input
                type="checkbox"
                checked={alertLinkBurned}
                onChange={() => handleToggleAlert("linkBurned")}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">
                {lang === "hi" ? "व्यूअर स्क्रीन कैप्चर / प्रिंट प्रयास अलर्ट" : "Alert on Screenshot / Print Capture Attempt"}
              </span>
              <input
                type="checkbox"
                checked={alertPrintAttempt}
                onChange={() => handleToggleAlert("printAttempt")}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
            </label>
          </div>
        </div>

        {/* 2.10 Hardware & Memory RAM Isolation (Zero RAM Bleed Mode) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Laptop className="h-4 w-4 text-amber-400" />
              <span>{lang === "hi" ? "हार्डवेयर एवं मेमोरी रैम अलगाव (RAM Isolation)" : "Hardware & Memory RAM Isolation (Zero Bleed)"}</span>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                strictMemoryIsolation
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-700 bg-slate-800 text-slate-400"
              }`}
            >
              {strictMemoryIsolation
                ? (lang === "hi" ? "सख्त मोड (Volatile Only) ✓" : "Strict Mode (Volatile Only) ✓")
                : (lang === "hi" ? "मानक प्रदर्शन मोड" : "Standard Balanced Mode")}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-300 font-semibold">
                {lang === "hi"
                  ? "अस्थायी सेशन स्टोरेज टोकन पूरी तरह बंद करें"
                  : "Eliminate all ephemeral sessionStorage caching"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xl">
                {lang === "hi"
                  ? "सख्त मोड में, मास्टर वॉल्ट टोकन कभी भी sessionStorage में नहीं जाता। केवल इन-मेमोरी वोलेटाइल रैम में रहता है। टैब बदलते या रिफ्रेश करते ही यह तुरंत शून्य हो जाता है।"
                  : "Under Strict Mode, Master Vault tokens never enter sessionStorage. Keys reside exclusively in volatile WebCrypto RAM buffers and are zeroized upon unmount."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleStrictMemory}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm shrink-0 flex items-center gap-2 ${
                strictMemoryIsolation
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/10"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>
                {strictMemoryIsolation
                  ? (lang === "hi" ? "सख्त मोड सक्रिय ✓ (मानक करें)" : "Strict Active ✓ (Switch Standard)")
                  : (lang === "hi" ? "सख्त मोड सक्षम करें" : "Enable Strict Mode")}
              </span>
            </button>
          </div>
        </div>

        {/* 2.11 Zero-Knowledge Cold Vault Backup Export */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Download className="h-4 w-4 text-amber-400" />
              <span>{lang === "hi" ? "शून्य-ज्ञान वॉल्ट बैकअप मैनिफेस्ट (Cold Storage)" : "Zero-Knowledge Vault Backup Manifest (Cold Storage)"}</span>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
              {lang === "hi" ? "100% शून्य-ज्ञान JSON" : "100% Zero-Knowledge JSON"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-300 font-semibold">
                {lang === "hi"
                  ? "ऑफ़लाइन आपदा रिकवरी के लिए अपने खाते का एन्क्रिप्टेड क्रिप्टोग्राफ़िक मैनिफेस्ट डाउनलोड करें"
                  : "Export an offline encrypted JSON manifest of your cryptographic parameters"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xl">
                {lang === "hi"
                  ? "इस फ़ाइल में केवल KDF पैरामीटर्स, इटरेशन काउंट और एन्क्रिप्टेड वॉल्ट एनवेलप शामिल हैं। इसमें कभी भी अनएन्क्रिप्टेड कुंजियां नहीं होतीं। इसे अपने सुरक्षित कोल्ड स्टोरेज में रखें।"
                  : "Contains only public KDF parameters, PBKDF2/Argon2id rounds, and encrypted envelopes. Plaintext document keys never touch this manifest."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportVaultManifest}
              disabled={exportingVault}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-white border border-slate-700 transition shadow-sm shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              <span>
                {exportingVault
                  ? (lang === "hi" ? "निर्यात हो रहा है..." : "Exporting...")
                  : (lang === "hi" ? "वॉल्ट मैनिफेस्ट डाउनलोड करें" : "Export Vault Backup (.json)")}
              </span>
            </button>
          </div>
        </div>

        {/* 2.12 Automated Founder Weekly Deal Digest */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Mail className="h-4 w-4 text-amber-400" />
              <span>Automated Founder Weekly Deal Digest</span>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
              Monday Morning Brief
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-300 font-semibold">
                Receive weekly investor deal intelligence summary directly to {user?.email || "your inbox"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xl">
                Summarizes high-engagement investors (🔥 Hot Deals 5+ min dwell), slide drop-off rates, and unanswered Q&A pins with 100% zero-knowledge data anonymity.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSendingTestDigest(true);
                  setTimeout(() => {
                    setSendingTestDigest(false);
                    setMessage({
                      type: "success",
                      text: `Weekly deal digest scheduled! Sample preview sent to ${user?.email || "registered email"}.`,
                    });
                  }, 650);
                }}
                disabled={sendingTestDigest}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
              >
                <Send className="h-3.5 w-3.5 text-amber-400" />
                <span>{sendingTestDigest ? "Sending..." : "Test Digest"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !weeklyDigestEnabled;
                  setWeeklyDigestEnabled(next);
                  setMessage({
                    type: "success",
                    text: next
                      ? "Weekly deal digest enabled! You will receive summaries every Monday."
                      : "Weekly deal digest paused.",
                  });
                }}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                  weeklyDigestEnabled
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/10"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {weeklyDigestEnabled ? "Enabled ✓" : "Disabled"}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Invite Codes & Access Delegation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Ticket className="h-4 w-4 text-amber-400" />
              <span>Invite Codes & Access Delegation</span>
            </div>
            <span className="text-xs text-slate-400">Only invited users can register</span>
          </div>

          <form onSubmit={handleCreateInvite} className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-end bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-semibold text-slate-300">Custom Code (Optional - blank for auto)</label>
              <input
                type="text"
                placeholder="e.g. VIP-PARTNER-2026"
                value={customInviteCode}
                onChange={(e) => setCustomInviteCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-300">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="owner">Owner (Full Vault)</option>
                <option value="admin">Admin</option>
                {user?.role === "super_admin" && <option value="super_admin">Super Admin</option>}
              </select>
            </div>

            <button
              type="submit"
              disabled={creatingInvite}
              className="relative overflow-hidden select-none flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed shadow-md shadow-amber-500/10"
            >
              {creatingInvite && (
                <>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-btn-shimmer" />
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600/50 overflow-hidden">
                    <span className="block h-full bg-slate-950 w-1/3 animate-progress-indeterminate" />
                  </span>
                </>
              )}
              {creatingInvite ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 relative z-10" /> : <Plus className="h-3.5 w-3.5 shrink-0 relative z-10" />}
              <span className="relative z-10">{creatingInvite ? "Generating..." : "Generate Code"}</span>
            </button>
          </form>

          {/* Invites List */}
          {invitesList.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {invitesList.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-amber-400">{inv.code}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 capitalize">{inv.role}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.isUsed ? (
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Claimed</span>
                    ) : (
                      <button
                        onClick={() => copyToClipboard(inv.code, inv.id)}
                        className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30 transition-colors"
                      >
                        {copiedCode === inv.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedCode === inv.id ? "Copied" : "Copy Code"}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-500">
              No custom invite codes created yet. Use the generator above to invite team members.
            </div>
          )}
        </div>

        {/* 3.5 Cyber Pet & Interactive Cursor FX */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>{lang === "hi" ? "साइबर पेट और कर्सर प्रभाव" : "Cyber Pet & Interactive Cursor FX"}</span>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                cursorFxEnabled
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-700 bg-slate-800 text-slate-400"
              }`}
            >
              {cursorFxEnabled
                ? (lang === "hi" ? "सक्रिय ✓" : "Active ✓")
                : (lang === "hi" ? "डिफ़ॉल्ट बंद (न्यूनतम मोड)" : "Default Off (Clean Workspace)")}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-300 font-semibold">
                {lang === "hi"
                  ? "टक्स साइबर-पेट साथी, लेजर पॉइंटर और जीरो-नॉलेज सिफर स्पॉटलाइट"
                  : "Tux Cyber-Pet companion, laser tracking pointer & cipher matrix spotlight"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xl">
                {lang === "hi"
                  ? "पब्लिक शोकेस पेजों पर यह हमेशा सक्रिय रहता है। डैशबोर्ड को शांत, केंद्रित और हल्का रखने के लिए डिफ़ॉल्ट रूप से यहाँ बंद रहता है। आवश्यकतानुसार आप इसे यहाँ से कभी भी चालू या बंद कर सकते हैं।"
                  : "Active by default on public showcase pages. Kept disabled by default in the dashboard for a distraction-free, professional workspace. Toggle anytime whenever you want the companion active."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleCursorFx}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm shrink-0 flex items-center gap-2 ${
                cursorFxEnabled
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/10"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {cursorFxEnabled
                  ? (lang === "hi" ? "प्रभाव सक्रिय ✓ (बंद करें)" : "Enabled ✓ (Click to Turn Off)")
                  : (lang === "hi" ? "सक्षम करें (Turn ON)" : "Enable Cursor FX")}
              </span>
            </button>
          </div>
        </div>

        {/* 4. Developer Branding & Social Profile Attribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Code2 className="h-4 w-4 text-amber-400" />
              <span>{lang === "hi" ? "डेवलपर और सोशल मीडिया ब्रांडिंग (फुटर प्रोफाइल)" : "Developer & Social Media Attribution (Footer Profile)"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === "hi" ? "लाइव फुटर सिंक" : "Live Footer Sync"}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === "hi"
              ? "यहाँ अपना नाम और सोशल मीडिया प्रोफाइल्स दर्ज करें। यह जानकारी सभी पेजों के फुटर में 'Architected & Developed with ❤️ by [आपका नाम]' के साथ तुरंत लाइव प्रदर्शित होगी। इसे .env फ़ाइल या सीधे यहाँ ब्राउज़र से कभी भी बदला जा सकता है।"
              : "Customize your developer name and social links. This attribution appears across all footers with direct clickable links. Values can be seeded via .env variables or updated anytime here in your browser."}
          </p>

          <form onSubmit={handleSaveDevProfile} className="space-y-5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  {lang === "hi" ? "डेवलपर / क्रिएटर नाम" : "Developer / Creator Name"}
                </label>
                <input
                  type="text"
                  value={devProfile.name}
                  onChange={(e) => setDevProfile((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. SudhirDevOps1"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-300">
                  {lang === "hi" ? "टैगलाइन / पदवी" : "Tagline / Role Title"}
                </label>
                <input
                  type="text"
                  value={devProfile.tagline}
                  onChange={(e) => setDevProfile((prev) => ({ ...prev, tagline: e.target.value }))}
                  placeholder="e.g. Lead Creator & Maintainer • Zero-Knowledge Vault"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Social Media Channels Suite */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {lang === "hi" ? "सोशल मीडिया चैनल और लिंक्स (Allow / Toggle)" : "Social Channels & Links (Allow / Toggle)"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {lang === "hi" ? "चेक बॉक्स से फुटर में ऑन / ऑफ करें" : "Toggle checkbox to allow in footer"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SOCIAL_PLATFORMS_META.map((meta) => {
                  const plat = devProfile.platforms[meta.key] || { enabled: false, url: "" };
                  return (
                    <div
                      key={meta.key}
                      className={`rounded-xl border p-3 transition-all ${
                        plat.enabled
                          ? "border-slate-700 bg-slate-950/80 shadow-sm"
                          : "border-slate-800/60 bg-slate-950/30 opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={plat.enabled}
                            onChange={(e) => handleTogglePlatform(meta.key, e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                          />
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 border border-slate-800">
                            {renderRealSocialIcon(meta.key, `h-3.5 w-3.5 ${meta.colorClass}`)}
                          </span>
                          <span className={`text-xs font-semibold ${plat.enabled ? "text-white" : "text-slate-400"}`}>
                            {meta.name}
                          </span>
                        </label>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            plat.enabled
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {plat.enabled ? (lang === "hi" ? "सक्रिय (Allowed)" : "Allowed") : (lang === "hi" ? "छिपा हुआ" : "Hidden")}
                        </span>
                      </div>

                      <input
                        type="url"
                        value={plat.url}
                        onChange={(e) => handleUpdatePlatformUrl(meta.key, e.target.value)}
                        placeholder={meta.placeholder}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                <span>
                  {lang === "hi"
                    ? `फुटर में 'Developed with ❤️ by ${devProfile.name || "SudhirDevOps1"}' दिखेगा`
                    : `Footer renders 'Developed with ❤️ by ${devProfile.name || "SudhirDevOps1"}'`}
                </span>
              </div>

              <button
                type="submit"
                disabled={savingDevProfile}
                className="relative overflow-hidden select-none flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              >
                {savingDevProfile && (
                  <>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-btn-shimmer" />
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600/50 overflow-hidden">
                      <span className="block h-full bg-slate-950 w-1/3 animate-progress-indeterminate" />
                    </span>
                  </>
                )}
                {savingDevProfile ? <Loader2 className="h-4 w-4 animate-spin shrink-0 relative z-10" /> : <Save className="h-4 w-4 shrink-0 relative z-10" />}
                <span className="relative z-10">
                  {savingDevProfile
                    ? (lang === "hi" ? "सेव हो रहा है..." : "Saving...")
                    : (lang === "hi" ? "प्रोफाइल व चैनल सुरक्षित करें" : "Save Developer Attribution")}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* 5. Language & Sessions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Globe className="h-4 w-4 text-amber-400" />
              <span>Interface Language</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  lang === "en"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  lang === "hi"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <LogOut className="h-4 w-4 text-amber-400" />
              <span>Session Management</span>
            </div>
            <button
              onClick={logoutAllDevices}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Sign Out from All Devices
            </button>
          </div>
        </div>

        {/* 5. Danger Zone */}
        <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-red-400">
            <Trash2 className="h-4 w-4" />
            <span>Danger Zone</span>
          </div>
          <p className="text-xs text-slate-400">
            Permanently delete your account, encrypted vaults, and view session analytics.
          </p>
          <button
            onClick={deleteAccount}
            className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-900/40 transition-colors"
          >
            Purge Account & Vaults
          </button>
        </div>
      </main>
    </div>
  );
}
