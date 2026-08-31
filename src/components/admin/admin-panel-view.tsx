"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  ShieldAlert,
  Users,
  HardDrive,
  BarChart3,
  Server,
  Key,
  Trash2,
  Ban,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Send,
  Sliders,
  Sparkles,
  Lock,
} from "lucide-react";

export function AdminPanelView() {
  const { t, appName } = useI18n();

  const [tab, setTab] = useState<"overview" | "users" | "invites" | "audit" | "settings">("overview");
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [invitesList, setInvitesList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ maintenance_mode: "false", broadcast_banner: "" });

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Invite creator state
  const [newInviteRole, setNewInviteRole] = useState("owner");
  const [newInviteDays, setNewInviteDays] = useState("7");
  const [customInviteCode, setCustomInviteCode] = useState("");

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/metrics");
      const json = await res.json();
      if (res.ok) setMetricsData(json);
    } catch {}
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (res.ok) setUsersList(json.users || []);
    } catch {}
  };

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/admin/invites");
      const json = await res.json();
      if (res.ok) setInvitesList(json.invites || []);
    } catch {}
  };

  const fetchAudit = async () => {
    try {
      const res = await fetch("/api/admin/audit");
      const json = await res.json();
      if (res.ok) setAuditLogs(json.logs || []);
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (res.ok) setSettings(json.settings || {});
    } catch {}
  };

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchInvites();
    fetchAudit();
    fetchSettings();
  }, []);

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isBlocked: !currentBlocked }),
    });
    if (res.ok) {
      setActionMessage(`User ${!currentBlocked ? "blocked" : "unblocked"} successfully.`);
      fetchUsers();
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    if (res.ok) {
      setActionMessage(`User role updated to ${newRole}.`);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure? This will delete the user and crypto-shred all their uploaded documents.")) {
      return;
    }
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
    if (res.ok) {
      setActionMessage("User and documents purged.");
      fetchUsers();
      fetchMetrics();
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: newInviteRole,
        expiryDays: newInviteDays,
        customCode: customInviteCode || undefined,
      }),
    });
    if (res.ok) {
      setActionMessage("New invite code generated!");
      setCustomInviteCode("");
      fetchInvites();
    }
  };

  const handleSaveSettings = async () => {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maintenanceMode: settings.maintenance_mode === "true",
        broadcastBanner: settings.broadcast_banner,
      }),
    });
    if (res.ok) {
      setActionMessage("Platform settings saved!");
      fetchSettings();
    }
  };

  const handleRunSweeps = async () => {
    const res = await fetch("/api/admin/sweeps", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setActionMessage(`Storage sweep finished: ${json.purgedOrphanCount} orphaned ciphertext objects purged.`);
      fetchMetrics();
    }
  };

  if (loading && !metricsData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <span>{t.admin.title}</span>
            </h1>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
              Blind Admin Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t.admin.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunSweeps}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
            <span>{t.admin.runSweeps}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        {[
          { id: "overview", label: "Overview & Ledger" },
          { id: "users", label: t.admin.userMgmt },
          { id: "invites", label: t.admin.invites },
          { id: "audit", label: t.admin.auditLogs },
          { id: "settings", label: "System Controls" },
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id as any)}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              tab === tabItem.id
                ? "bg-amber-500 text-slate-950 font-bold"
                : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Budget Ledger */}
      {tab === "overview" && metricsData && (
        <div className="space-y-6">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-400 mb-1">{t.admin.totalUsers}</div>
              <div className="text-2xl font-bold text-white">{metricsData.metrics.totalUsers}</div>
              <div className="text-[10px] text-slate-500 mt-1">Platform account holders</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-400 mb-1">{t.admin.totalCipherBlobs}</div>
              <div className="text-2xl font-bold text-white">{metricsData.metrics.totalDocuments}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {metricsData.metrics.totalLinks} active links
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-400 mb-1">Encrypted Storage</div>
              <div className="text-2xl font-bold text-white">{metricsData.metrics.storageMb} MB</div>
              <div className="text-[10px] text-slate-500 mt-1">
                Budget Limit: {metricsData.metrics.storageBudgetMb} MB
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-400 mb-1">Views Today</div>
              <div className="text-2xl font-bold text-amber-400">{metricsData.metrics.viewsToday}</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {metricsData.metrics.totalSessions} lifetime views
              </div>
            </div>
          </div>

          {/* Storage Gauge */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-white">{t.admin.storageBudget}</span>
              </div>
              <span className="font-mono text-slate-300">
                {metricsData.metrics.storageMb} MB / 8,192 MB ({metricsData.metrics.storageUsagePercent}%)
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-500"
                style={{ width: `${Math.max(metricsData.metrics.storageUsagePercent, 2)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Strictly adheres to ₹0 free tiers (Backblaze B2 10GB / Cloudflare R2 egress-free budget).
            </p>
          </div>

          {/* Free-Tier Budget Ledger Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-sm font-bold text-white mb-3">Free-Tier Budget Ledger (₹0 Proof)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="pb-2">Service Target</th>
                    <th className="pb-2">Free Limit</th>
                    <th className="pb-2">Current Utilization</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {metricsData.budgetLedger.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium text-white">{row.service}</td>
                      <td className="py-2.5 text-slate-300 font-mono">{row.limit}</td>
                      <td className="py-2.5 text-slate-400">{row.currentEst}</td>
                      <td className="py-2.5">
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Management */}
      {tab === "users" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm font-bold text-white mb-4">{t.admin.userMgmt}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3 pl-2">Name & Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Registered</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-3 pl-2">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                    </td>
                    <td className="py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-amber-300"
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="py-3">
                      {u.isBlocked ? (
                        <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
                          Blocked
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-2 text-right space-x-2">
                      <button
                        onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          u.isBlocked
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        }`}
                      >
                        {u.isBlocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40"
                        title="Purge user and data"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Invites */}
      {tab === "invites" && (
        <div className="space-y-6">
          {/* Create Invite Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-sm font-bold text-white mb-3">{t.admin.createInvite}</h3>
            <form onSubmit={handleCreateInvite} className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={customInviteCode}
                onChange={(e) => setCustomInviteCode(e.target.value)}
                placeholder="Custom code (blank for random)"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500"
              />
              <select
                value={newInviteRole}
                onChange={(e) => setNewInviteRole(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              >
                <option value="owner">Role: Owner</option>
                <option value="admin">Role: Admin</option>
                <option value="super_admin">Role: Super Admin</option>
              </select>
              <select
                value={newInviteDays}
                onChange={(e) => setNewInviteDays(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
              >
                <option value="3">Expires in 3 Days</option>
                <option value="7">Expires in 7 Days</option>
                <option value="30">Expires in 30 Days</option>
              </select>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Generate Invite
              </button>
            </form>
          </div>

          {/* Invites List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-sm font-bold text-white mb-4">Active & Historic Invites</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="pb-3 pl-2">Invite Code</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2">Expires At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invitesList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30">
                      <td className="py-3 pl-2 font-mono font-semibold text-amber-400 select-all">
                        {inv.code}
                      </td>
                      <td className="py-3 capitalize text-slate-300">{inv.role}</td>
                      <td className="py-3">
                        {inv.isUsed ? (
                          <span className="text-slate-500">Claimed</span>
                        ) : new Date(inv.expiresAt) < new Date() ? (
                          <span className="text-red-400">Expired</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Valid</span>
                        )}
                      </td>
                      <td className="py-3 pr-2 text-slate-400 font-mono text-[11px]">
                        {new Date(inv.expiresAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {tab === "audit" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm font-bold text-white mb-2">{t.admin.auditLogs}</h3>
          <p className="text-xs text-slate-400 mb-4">
            Blind audit ledger showing administrative and security actions without exposing document contents
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3 pl-2">Timestamp</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Actor Type</th>
                  <th className="pb-3">Resource</th>
                  <th className="pb-3 pr-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 pl-2 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 font-bold text-amber-400 font-mono">{log.action}</td>
                    <td className="py-2.5 text-slate-300 capitalize">{log.actorType}</td>
                    <td className="py-2.5 text-slate-300">
                      {log.resourceType} {log.resourceId ? `(${log.resourceId.substring(0, 8)}...)` : ""}
                    </td>
                    <td className="py-2.5 pr-2 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                      {log.detailsJson}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: System Controls */}
      {tab === "settings" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <h3 className="text-sm font-bold text-white mb-3">Platform Broadcast & Maintenance Controls</h3>

          {/* Maintenance Mode */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">{t.admin.maintenance}</div>
              <div className="text-xs text-slate-400">
                When active, non-admin viewers will see a maintenance notice.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenance_mode === "true"}
              onChange={(e) =>
                setSettings({ ...settings, maintenance_mode: e.target.checked ? "true" : "false" })
              }
              className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
            />
          </div>

          {/* Broadcast Banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <div className="text-sm font-semibold text-white">{t.admin.broadcastBanner}</div>
            <p className="text-xs text-slate-400">
              Optional announcement banner shown at top of viewer and dashboard.
            </p>
            <input
              type="text"
              value={settings.broadcast_banner || ""}
              onChange={(e) => setSettings({ ...settings, broadcast_banner: e.target.value })}
              placeholder="e.g. Scheduled maintenance tonight at 02:00 UTC."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10"
          >
            {t.admin.saveSettings}
          </button>
        </div>
      )}
    </div>
  );
}
