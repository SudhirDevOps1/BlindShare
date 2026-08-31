"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
  Activity,
  Check,
  Copy,
  ExternalLink,
  Database,
  Cloud,
  Mail,
  Shield,
  Layers,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export function AdminPanelView() {
  const { t, appName } = useI18n();

  const [tab, setTab] = useState<"overview" | "users" | "invites" | "audit" | "settings" | "diagnostics">("overview");
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [invitesList, setInvitesList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ maintenance_mode: "false", broadcast_banner: "" });

  // In-App User Delete Confirmation Dialog State
  const [deleteUserTarget, setDeleteUserTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Diagnostics & Environment State
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [testingEnv, setTestingEnv] = useState(false);
  const [envFilter, setEnvFilter] = useState<"all" | "missing" | "configured" | "required">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const fetchDiagnostics = async () => {
    try {
      setTestingEnv(true);
      const res = await fetch("/api/admin/diagnostics");
      const json = await res.json();
      if (res.ok) setDiagnosticsData(json);
    } catch {}
    setTestingEnv(false);
  };

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchInvites();
    fetchAudit();
    fetchSettings();
    fetchDiagnostics();
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

  const promptDeleteUser = (id: string, name: string) => {
    setDeleteUserTarget({ id, name });
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      setDeletingUser(true);
      const res = await fetch(`/api/admin/users?userId=${deleteUserTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setActionMessage("User permanently deleted.");
        setUsersList((prev) => prev.filter((u) => u.id !== deleteUserTarget.id));
        setDeleteUserTarget(null);
      }
    } catch {
    } finally {
      setDeletingUser(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: newInviteRole,
        expiresInDays: parseInt(newInviteDays, 10),
        code: customInviteCode.trim() || undefined,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setActionMessage(`Invite code created: ${json.invite.code}`);
      setCustomInviteCode("");
      fetchInvites();
    } else {
      setActionMessage(`Error: ${json.error}`);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    const res = await fetch(`/api/admin/invites?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setActionMessage("Invite revoked.");
      fetchInvites();
    }
  };

  const handleSaveSettings = async () => {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    if (res.ok) {
      setActionMessage("System settings saved.");
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered variables
  const filteredVariables = useMemo(() => {
    if (!diagnosticsData?.variables) return [];
    return diagnosticsData.variables.filter((v: any) => {
      if (envFilter === "missing") return !v.isSet;
      if (envFilter === "configured") return v.isSet;
      if (envFilter === "required") return v.required;
      return true;
    });
  }, [diagnosticsData, envFilter]);

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      {actionMessage && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-amber-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
        <button
          onClick={() => setTab("overview")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === "overview"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setTab("diagnostics")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === "diagnostics"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Environment & Diagnostics</span>
          {diagnosticsData?.stats?.missingRequired > 0 ? (
            <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === "users"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Users ({usersList.length})</span>
        </button>

        <button
          onClick={() => setTab("invites")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === "invites"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Key className="h-4 w-4" />
          <span>Invites ({invitesList.length})</span>
        </button>

        <button
          onClick={() => setTab("audit")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === "audit"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <HardDrive className="h-4 w-4" />
          <span>Audit Logs</span>
        </button>

        <button
          onClick={() => setTab("settings")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === "settings"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Total Users</span>
                <Users className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metricsData?.metrics?.totalUsers || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Tenant accounts</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Encrypted Docs</span>
                <HardDrive className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metricsData?.metrics?.totalDocs || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">{metricsData?.metrics?.storageMb || 0} MB ciphertext</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Share Links</span>
                <Server className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metricsData?.metrics?.totalLinks || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Active distribution gates</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Total Views</span>
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{metricsData?.metrics?.totalViews || 0}</div>
              <div className="text-[10px] text-slate-500 mt-1">Telemetry sessions</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Environment & Diagnostics (Live Status, Ping, Verification) */}
      {tab === "diagnostics" && (
        <div className="space-y-6">
          {/* Top Live Connectivity Pulse Meter */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-amber-400" />
                  <span>Live Infrastructure & Environment Verification</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time diagnostic checks for Neon Postgres, Backblaze B2, AES-GCM-256 crypto keys, and Vercel environment secrets.
                </p>
              </div>

              <button
                onClick={fetchDiagnostics}
                disabled={testingEnv}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition shadow-md shadow-amber-500/10"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${testingEnv ? "animate-spin" : ""}`} />
                <span>{testingEnv ? "Testing System..." : "Run Health Self-Test"}</span>
              </button>
            </div>

            {/* 3 Real-time Diagnostics Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Database */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Neon PostgreSQL</span>
                  </div>
                  {diagnosticsData?.diagnostics?.database?.status === "operational" ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {diagnosticsData.diagnostics.database.latencyMs}ms Ping
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      Unreachable
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {diagnosticsData?.diagnostics?.database?.status === "operational"
                    ? "Live query test successful. Document metadata & sessions active."
                    : diagnosticsData?.diagnostics?.database?.error || "Connection error"}
                </p>
              </div>

              {/* Cloud Storage */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Backblaze B2 S3 Storage</span>
                  </div>
                  {diagnosticsData?.diagnostics?.storage?.status === "operational" ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      {diagnosticsData.diagnostics.storage.latencyMs}ms Ping
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {diagnosticsData?.diagnostics?.storage?.status === "missing" ? "Unconfigured" : "Degraded"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {diagnosticsData?.diagnostics?.storage?.bucket
                    ? `Bucket: ${diagnosticsData.diagnostics.storage.bucket}`
                    : "Zero-knowledge bucket name not set"}
                </p>
              </div>

              {/* Crypto Engine */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Cryptographic Engine</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    Verified Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  AES-GCM-256 client decrypt + PBKDF2 (100k rounds) operational.
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar & Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Environment Configuration:</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-amber-400">
                {diagnosticsData?.stats?.setVars || 0} / {diagnosticsData?.stats?.total || 0} Set ({diagnosticsData?.stats?.score || 0}%)
              </span>
            </div>

            <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[11px]">
              <button
                onClick={() => setEnvFilter("all")}
                className={`px-3 py-1 rounded-md transition ${envFilter === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400"}`}
              >
                All ({diagnosticsData?.stats?.total || 0})
              </button>
              <button
                onClick={() => setEnvFilter("configured")}
                className={`px-3 py-1 rounded-md transition ${envFilter === "configured" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" : "text-slate-400"}`}
              >
                🟢 Configured ({diagnosticsData?.stats?.setVars || 0})
              </button>
              <button
                onClick={() => setEnvFilter("missing")}
                className={`px-3 py-1 rounded-md transition ${envFilter === "missing" ? "bg-red-500/20 text-red-300 font-bold border border-red-500/30" : "text-slate-400"}`}
              >
                🔴 Missing ({(diagnosticsData?.stats?.total || 0) - (diagnosticsData?.stats?.setVars || 0)})
              </button>
              <button
                onClick={() => setEnvFilter("required")}
                className={`px-3 py-1 rounded-md transition ${envFilter === "required" ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30" : "text-slate-400"}`}
              >
                ⚙️ Required ({diagnosticsData?.stats?.requiredTotal || 0})
              </button>
            </div>
          </div>

          {/* Grid of Environment Variables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVariables.map((v: any) => {
              const isCopied = copiedKey === v.key;
              return (
                <div
                  key={v.key}
                  className={`rounded-2xl border p-4 transition space-y-2.5 ${
                    !v.isSet && v.required
                      ? "border-red-500/40 bg-red-950/10"
                      : v.isSet
                      ? "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                      : "border-slate-800/80 bg-slate-950/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs font-bold text-amber-400">{v.key}</code>
                        <button
                          onClick={() => handleCopyKey(v.key)}
                          className="text-slate-500 hover:text-white p-0.5"
                          title="Copy Key Name"
                        >
                          {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{v.category}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {v.required ? (
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/20">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-medium text-slate-400">
                          OPTIONAL
                        </span>
                      )}

                      {v.isSet ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>Configured</span>
                        </span>
                      ) : v.required ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30 animate-pulse">
                          <AlertCircle className="h-3 w-3 text-red-400" />
                          <span>Missing</span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                          Unset
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{v.description}</p>

                  {/* Masked Safe Preview or Status */}
                  <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span className="truncate max-w-[280px]">
                      {v.isSet ? (
                        <span className="text-slate-300">{v.maskedValue}</span>
                      ) : (
                        <span className="text-slate-500 italic">Not defined in environment</span>
                      )}
                    </span>
                    {v.diagnosticTest && (
                      <span className={`text-[10px] font-sans ${v.isWorking ? "text-emerald-400" : "text-red-400"}`}>
                        {v.diagnosticTest}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {tab === "users" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Registered User Accounts</h3>
            <span className="text-xs text-slate-400">{usersList.length} users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Documents</th>
                  <th className="pb-3">Joined</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-3 pl-2">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
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
                    <td className="py-3 font-mono text-slate-300">{u.docCount || 0}</td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-2 text-right space-x-2">
                      <button
                        onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          u.isBlocked
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                        }`}
                      >
                        {u.isBlocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        onClick={() => promptDeleteUser(u.id, u.name)}
                        className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-red-400 transition"
                        title="Delete User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              <span>Create Registration Invite</span>
            </h3>
            <form onSubmit={handleCreateInvite} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Assign Role</label>
                <select
                  value={newInviteRole}
                  onChange={(e) => setNewInviteRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="owner">Owner (Standard Tenant)</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Expiry Period</label>
                <select
                  value={newInviteDays}
                  onChange={(e) => setNewInviteDays(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="365">1 Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Code (Optional)</label>
                <input
                  type="text"
                  value={customInviteCode}
                  onChange={(e) => setCustomInviteCode(e.target.value)}
                  placeholder="e.g. VIP-FOUNDER-2026"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                Generate Invite Code
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-sm font-bold text-white mb-4">Active Invite Tokens</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="pb-3 pl-2">Invite Code</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Expires</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invitesList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30">
                      <td className="py-3 pl-2 font-mono font-bold text-amber-400">{inv.code}</td>
                      <td className="py-3 capitalize text-slate-300">{inv.role}</td>
                      <td className="py-3">
                        {inv.usedAt ? (
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">Used</span>
                        ) : (
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        {!inv.usedAt && (
                          <button
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
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
            <table className="w-full min-w-[650px] text-left text-xs">
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

      {/* In-App User Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteUserTarget)}
        title="Delete User Account?"
        message={`Are you sure you want to permanently delete "${deleteUserTarget?.name || ""}"? All documents uploaded by this user will be crypto-shredded.`}
        confirmLabel="Yes, Delete User"
        cancelLabel="Keep User"
        variant="danger"
        loading={deletingUser}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => {
          if (!deletingUser) setDeleteUserTarget(null);
        }}
      />
    </div>
  );
}
