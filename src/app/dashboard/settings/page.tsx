"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { PasswordStrengthMeter, evaluatePassword } from "@/components/auth/password-strength";

export default function SettingsPage() {
  const router = useRouter();
  const { t, lang, setLang, appName } = useI18n();

  const [user, setUser] = useState<any>(null);
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
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setSavingPassword(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">Account & Security Settings</h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage your credentials, change password, rotate invite keys, and customize security policies.
          </p>
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
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingProfile ? "Saving..." : "Save Profile"}</span>
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
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                <span>{savingPassword ? "Updating Password..." : "Update Password"}</span>
              </button>
            </div>
          </form>
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
              className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{creatingInvite ? "Creating..." : "Generate Code"}</span>
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

        {/* 4. Language & Sessions */}
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
