"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import { Bell, Download, Trash2, User, ShieldCheck, Globe, LogOut } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { t, lang, setLang, appName } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [pushState, setPushState] = useState<"unsupported" | "default" | "granted" | "denied">("default");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});

    if (typeof window !== "undefined") {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setPushState("unsupported");
      } else {
        setPushState(Notification.permission as any);
      }
    }
  }, []);

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
        setMessage("Web-push notifications enabled for first-open alerts.");
      } else {
        setMessage(
          "Service worker registered. Configure VAPID keys in env to complete push subscription; in-app alerts stay active."
        );
      }
    } catch {
      setMessage("Could not enable push here — in-app notifications remain active.");
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Purge your account, all ciphertext objects and analytics? This cannot be undone.")) return;
    const res = await fetch("/api/user/delete", { method: "POST" });
    if (res.ok) {
      router.push("/");
      router.refresh();
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

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">Account & Privacy Settings</h1>
          <p className="mt-1 text-xs text-slate-400">
            GDPR-lite controls: export everything you own, or purge it permanently.
          </p>
        </div>

        {message && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
            {message}
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <User className="h-4 w-4 text-amber-400" />
            <span>Profile</span>
          </div>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-slate-400">Name</div>
              <div className="font-semibold text-white">{user?.name || "—"}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-slate-400">Email</div>
              <div className="truncate font-mono text-white">{user?.email || "—"}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-slate-400">Role</div>
              <div className="font-semibold capitalize text-amber-400">{user?.role || "—"}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Globe className="h-4 w-4 text-amber-400" />
            <span>Interface Language</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang("en")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold ${
                lang === "en" ? "bg-amber-500 text-slate-950" : "border border-slate-800 bg-slate-950 text-slate-300"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`rounded-xl px-4 py-2 text-xs font-semibold ${
                lang === "hi" ? "bg-amber-500 text-slate-950" : "border border-slate-800 bg-slate-950 text-slate-300"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Bell className="h-4 w-4 text-amber-400" />
            <span>First-Open Notifications</span>
          </div>
          <p className="text-xs text-slate-400">
            Get alerted the moment someone opens a link. Web-push uses VAPID; e-mail is off by default (needs your own
            domain + Resend/SMTP).
          </p>
          <button
            onClick={enablePush}
            disabled={pushState === "unsupported"}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
          >
            {pushState === "granted" ? "Re-sync Push Subscription" : "Enable Web Push"}
          </button>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <LogOut className="h-4 w-4 text-amber-400" />
            <span>Session Security</span>
          </div>
          <p className="text-xs text-slate-400">
            Signed in on a device you no longer trust? Instantly invalidate every active session — including this one
            — by bumping your account's session version.
          </p>
          <button
            onClick={logoutAllDevices}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out of All Devices</span>
          </button>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Your Data Rights</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/user/export"
              download
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              <span>Export My Data (JSON)</span>
            </a>
            <button
              onClick={deleteAccount}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Account & Crypto-Shred</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            {appName} cannot export plaintext documents — it never had the keys. Exports list ciphertext inventory plus
            your metadata.
          </p>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
