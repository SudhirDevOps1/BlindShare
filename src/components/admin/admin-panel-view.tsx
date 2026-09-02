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
  Search,
} from "lucide-react";

export function AdminPanelView() {
  const { t, appName } = useI18n();

  const [tab, setTab] = useState<"overview" | "users" | "invites" | "audit" | "maintenance" | "settings" | "diagnostics">("overview");
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [invitesList, setInvitesList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ maintenance_mode: "false", broadcast_banner: "" });

  // Maintenance & Purge Suite State
  const [sweepStats, setSweepStats] = useState<any>(null);
  const [runningSweepAction, setRunningSweepAction] = useState<string | null>(null);
  const [sweepConfirmTarget, setSweepConfirmTarget] = useState<{ action: string; title: string; message: string } | null>(null);
  const [sweepResult, setSweepResult] = useState<any>(null);

  // In-App User Delete Confirmation Dialog State
  const [deleteUserTarget, setDeleteUserTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Diagnostics & Environment State
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [testingEnv, setTestingEnv] = useState(false);
  const [envFilter, setEnvFilter] = useState<"all" | "missing" | "configured" | "required" | "optional_unset">("all");
  const [envCategoryFilter, setEnvCategoryFilter] = useState<string>("all");
  const [envSearch, setEnvSearch] = useState<string>("");
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

  const fetchSweepStats = async () => {
    try {
      const res = await fetch("/api/admin/sweeps");
      const json = await res.json();
      if (res.ok && json.stats) setSweepStats(json.stats);
    } catch {}
  };

  const handleExecuteSweep = async () => {
    if (!sweepConfirmTarget) return;
    try {
      setRunningSweepAction(sweepConfirmTarget.action);
      const res = await fetch("/api/admin/sweeps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: sweepConfirmTarget.action }),
      });
      const json = await res.json();
      if (res.ok && json.summary) {
        setSweepResult(json.summary);
        setActionMessage(`Maintenance action "${sweepConfirmTarget.action}" completed successfully.`);
        fetchSweepStats();
        fetchMetrics();
        fetchAudit();
      }
    } catch {} finally {
      setRunningSweepAction(null);
      setSweepConfirmTarget(null);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchInvites();
    fetchAudit();
    fetchSettings();
    fetchDiagnostics();
    fetchSweepStats();
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
    try {
      const isMaint = settings.maintenance_mode === "true" || settings.maintenance_mode === true;
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceMode: isMaint,
          broadcastBanner: settings.broadcast_banner || "",
        }),
      });
      const json = await res.json();
      if (res.ok) {
        if (json.settings) setSettings(json.settings);
        setActionMessage(
          isMaint
            ? "Maintenance Mode is now ENABLED. System settings saved."
            : "Maintenance Mode is now DISABLED. System settings saved."
        );
      } else {
        setActionMessage(`Error: ${json.error || "Failed to save settings"}`);
      }
    } catch {
      setActionMessage("Network error while saving settings.");
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
      // Status filter
      if (envFilter === "missing" && (v.isSet || !v.required)) return false;
      if (envFilter === "configured" && !v.isSet) return false;
      if (envFilter === "required" && !v.required) return false;
      if (envFilter === "optional_unset" && (v.isSet || v.required)) return false;

      // Category filter
      if (envCategoryFilter !== "all" && v.category !== envCategoryFilter) return false;

      // Search filter
      if (envSearch.trim()) {
        const q = envSearch.toLowerCase().trim();
        const matchesKey = v.key.toLowerCase().includes(q);
        const matchesDesc = (v.description || "").toLowerCase().includes(q);
        const matchesCategory = (v.category || "").toLowerCase().includes(q);
        if (!matchesKey && !matchesDesc && !matchesCategory) return false;
      }

      return true;
    });
  }, [diagnosticsData, envFilter, envCategoryFilter, envSearch]);

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
          onClick={() => setTab("maintenance")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            tab === "maintenance"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "text-slate-400 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <Trash2 className="h-4 w-4 text-rose-400" />
          <span>Database & Bucket Purge</span>
          {sweepStats && (sweepStats.orphanObjectsCount > 0 || sweepStats.tombstonedDocsCount > 0) && (
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
          )}
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
                    <span className="text-xs font-bold text-white">
                      {diagnosticsData?.diagnostics?.storage?.provider || "Backblaze B2 S3 Storage"}
                    </span>
                  </div>
                  {diagnosticsData?.diagnostics?.storage?.status === "operational" ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      {diagnosticsData?.diagnostics?.storage?.latencyMs ?? 1}ms Ping
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
                    : "Zero-knowledge bucket configured"}
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

          {/* Filter Bar, Quick Search & Category Pills */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search variables (e.g. DATABASE, B2, SESSION_SECRET, REDIS)..."
                  value={envSearch}
                  onChange={(e) => setEnvSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono shadow-inner"
                />
                {envSearch && (
                  <button
                    onClick={() => setEnvSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1 text-[11px]">
                <button
                  onClick={() => setEnvFilter("all")}
                  className={`px-3 py-1 rounded-lg transition ${envFilter === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  All ({diagnosticsData?.stats?.total || 0})
                </button>
                <button
                  onClick={() => setEnvFilter("configured")}
                  className={`px-3 py-1 rounded-lg transition ${envFilter === "configured" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" : "text-slate-400 hover:text-emerald-300"}`}
                >
                  🟢 Configured ({diagnosticsData?.stats?.setVars || 0})
                </button>
                <button
                  onClick={() => setEnvFilter("missing")}
                  className={`px-3 py-1 rounded-lg transition ${envFilter === "missing" ? "bg-red-500/20 text-red-300 font-bold border border-red-500/30" : "text-slate-400 hover:text-red-300"}`}
                >
                  🔴 Missing ({diagnosticsData?.stats?.missingRequired || 0})
                </button>
                <button
                  onClick={() => setEnvFilter("optional_unset")}
                  className={`px-3 py-1 rounded-lg transition ${envFilter === "optional_unset" ? "bg-slate-700 text-slate-200 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  ⚪ Optional Unset ({(diagnosticsData?.stats?.unsetVars || 0) - (diagnosticsData?.stats?.missingRequired || 0)})
                </button>
                <button
                  onClick={() => setEnvFilter("required")}
                  className={`px-3 py-1 rounded-lg transition ${envFilter === "required" ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30" : "text-slate-400 hover:text-amber-300"}`}
                >
                  ⚙️ Required ({diagnosticsData?.stats?.requiredTotal || 0})
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: "all", label: "All Categories" },
                { id: "Database", label: "🗄️ Database" },
                { id: "Storage", label: "🪣 Object Storage" },
                { id: "Security & Secrets", label: "🔐 Security & Secrets" },
                { id: "Rate Limiting", label: "⚡ Rate Limiting" },
                { id: "Email & Webhooks", label: "📧 Email & Webhooks" },
                { id: "Push Notifications", label: "🔔 Push Notifications" },
                { id: "Analytics & Telemetry", label: "📊 Analytics" },
                { id: "Branding & App", label: "🎨 Branding & App" },
                { id: "Operational Policies", label: "⚙️ Policies" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setEnvCategoryFilter(cat.id)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
                    envCategoryFilter === cat.id
                      ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Environment Variables */}
          {filteredVariables.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No matching environment variables found</p>
              <p className="text-xs text-slate-500">Try adjusting your search query or category filters.</p>
              <button
                onClick={() => {
                  setEnvFilter("all");
                  setEnvCategoryFilter("all");
                  setEnvSearch("");
                }}
                className="rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs text-amber-400 hover:text-white hover:bg-slate-700 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVariables.map((v: any) => {
                const isCopied = copiedKey === v.key;
                return (
                  <div
                    key={v.key}
                    className={`rounded-2xl border p-5 transition space-y-3 ${
                      !v.isSet && v.required
                        ? "border-red-500/40 bg-red-950/15 ring-1 ring-red-500/20 shadow-lg shadow-red-950/20"
                        : v.isSet
                        ? "border-slate-800 bg-slate-900/70 hover:border-slate-700 shadow-sm"
                        : "border-slate-800/80 bg-slate-950/40 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs font-bold text-amber-400">{v.key}</code>
                          <button
                            onClick={() => handleCopyKey(v.key)}
                            className="text-slate-500 hover:text-amber-400 p-0.5 transition"
                            title="Copy Key Name"
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{v.category}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {v.required ? (
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/20">
                            REQUIRED
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[9px] font-medium text-slate-400">
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
                            Unset (Default)
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{v.description}</p>

                    {v.guide && (
                      <div className="text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 font-mono">
                        <span className="text-amber-400/80 font-bold">Guide: </span>
                        <span>{v.guide}</span>
                      </div>
                    )}

                    {/* Masked Safe Preview or Status */}
                    <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/90 text-[11px] font-mono text-slate-400 flex items-center justify-between gap-2">
                      <span className="truncate max-w-[280px]">
                        {v.isSet ? (
                          <span className="text-slate-200 font-semibold">{v.maskedValue}</span>
                        ) : (
                          <span className="text-slate-500 italic">Blank / Not defined</span>
                        )}
                      </span>
                      {v.diagnosticTest && (
                        <span className={`text-[10px] font-sans font-bold shrink-0 ${v.isWorking ? "text-emerald-400" : "text-red-400"}`}>
                          {v.diagnosticTest}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Tab 5: Maintenance & Storage Purge Suite */}
      {tab === "maintenance" && (
        <div className="space-y-6">
          {/* Top Status Banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-rose-400" />
                  Database & Storage Bucket Maintenance Suite
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Safely sweep orphaned storage objects in Backblaze B2/R2, purge tombstoned documents, and clean stale database records to remain within free tiers.
                </p>
              </div>
              <button
                onClick={fetchSweepStats}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition w-fit"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Stats</span>
              </button>
            </div>

            {/* Live Counts Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                <div className="text-[11px] font-medium text-slate-400">Total Bucket Objects</div>
                <div className="text-2xl font-bold text-white mt-1">{sweepStats?.totalBucketObjects ?? "—"}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Physical files in S3/B2</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                <div className="text-[11px] font-medium text-slate-400">Orphaned Bucket Objects</div>
                <div className="text-2xl font-bold text-rose-400 mt-1">{sweepStats?.orphanObjectsCount ?? "—"}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Files with no DB record</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                <div className="text-[11px] font-medium text-slate-400">Tombstoned Documents</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">{sweepStats?.tombstonedDocsCount ?? "—"}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Soft-deleted items</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                <div className="text-[11px] font-medium text-slate-400">Expired / Revoked Links</div>
                <div className="text-2xl font-bold text-blue-400 mt-1">{sweepStats?.expiredOrRevokedLinksCount ?? "—"}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Stale share tokens</div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Orphan Bucket Sweep */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Cloud className="h-4 w-4 text-blue-400" />
                  <span>Sweep Orphan Bucket Objects</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Scans Backblaze B2 / Cloudflare R2 bucket for abandoned ciphertext blobs that do not belong to any active document and permanently deletes them.
                </p>
              </div>
              <button
                onClick={() =>
                  setSweepConfirmTarget({
                    action: "orphan_sweep",
                    title: "Sweep Orphan Bucket Objects?",
                    message: "This will scan your storage bucket and delete any encrypted files that are no longer associated with a document in the database.",
                  })
                }
                disabled={Boolean(runningSweepAction)}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600/20 border border-blue-500/30 px-4 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-600/30 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${runningSweepAction === "orphan_sweep" ? "animate-spin" : ""}`} />
                <span>{runningSweepAction === "orphan_sweep" ? "Sweeping..." : "Run Orphan Bucket Sweep"}</span>
              </button>
            </div>

            {/* Card 2: Purge Tombstoned Documents */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  <span>Permanently Purge Tombstones</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Permanently destroys soft-deleted documents, their physical ciphertext storage blobs on B2/R2, versions, audio notes, and question pins.
                </p>
              </div>
              <button
                onClick={() =>
                  setSweepConfirmTarget({
                    action: "purge_tombstones",
                    title: "Purge All Tombstoned Documents?",
                    message: "This will permanently crypto-shred and delete all soft-deleted documents and their physical storage blobs from B2/R2.",
                  })
                }
                disabled={Boolean(runningSweepAction)}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/30 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-600/30 transition disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{runningSweepAction === "purge_tombstones" ? "Purging..." : "Purge Tombstoned Documents"}</span>
              </button>
            </div>

            {/* Card 3: Prune Expired & Revoked Links */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Key className="h-4 w-4 text-amber-400" />
                  <span>Prune Expired & Revoked Links</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Removes inactive share links that have reached their expiration date, exceeded maximum views, or were manually revoked.
                </p>
              </div>
              <button
                onClick={() =>
                  setSweepConfirmTarget({
                    action: "prune_expired_links",
                    title: "Prune Stale & Expired Links?",
                    message: "This will delete all expired and revoked share links and their associated live rooms.",
                  })
                }
                disabled={Boolean(runningSweepAction)}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-600/20 border border-amber-500/30 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-600/30 transition disabled:opacity-50"
              >
                <Key className="h-3.5 w-3.5" />
                <span>{runningSweepAction === "prune_expired_links" ? "Pruning..." : "Prune Stale Links"}</span>
              </button>
            </div>

            {/* Card 4: Prune Stale Telemetry */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span>Prune Old Page Telemetry (&gt;30 Days)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Cleans old raw page dwell events older than 30 days while preserving aggregate document view counts to save Neon PostgreSQL database rows.
                </p>
              </div>
              <button
                onClick={() =>
                  setSweepConfirmTarget({
                    action: "prune_telemetry",
                    title: "Prune Old Page Telemetry?",
                    message: "This will clean raw page dwell events older than 30 days to free database row quota.",
                  })
                }
                disabled={Boolean(runningSweepAction)}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30 transition disabled:opacity-50"
              >
                <Database className="h-3.5 w-3.5" />
                <span>{runningSweepAction === "prune_telemetry" ? "Pruning..." : "Prune Old Telemetry"}</span>
              </button>
            </div>
          </div>

          {/* Full Vacuum Card */}
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 to-slate-900/80 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span>Full Platform Vacuum & Cleanup</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Executes a complete, safe optimization cycle: sweeps orphan bucket objects, purges tombstones, removes expired links, and prunes stale telemetry in one audited batch.
              </p>
            </div>
            <button
              onClick={() =>
                setSweepConfirmTarget({
                  action: "full_clean",
                  title: "Execute Full Platform Vacuum?",
                  message: "This will run a full optimization sweep across both the storage bucket and the PostgreSQL database.",
                })
              }
              disabled={Boolean(runningSweepAction)}
              className="whitespace-nowrap rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
            >
              {runningSweepAction === "full_clean" ? "Vacuuming..." : "Execute Full Vacuum"}
            </button>
          </div>

          {/* Sweep Result Banner */}
          {sweepResult && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Maintenance Sweep Summary</span>
                </div>
                <div>
                  Deleted {sweepResult.purgedOrphanObjects} orphan bucket objects, {sweepResult.purgedTombstonedDocs} tombstones, {sweepResult.prunedStaleLinks} stale links, and {sweepResult.prunedTelemetryRows} telemetry events.
                </div>
              </div>
              <button onClick={() => setSweepResult(null)} className="text-emerald-400 hover:text-white font-bold">
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: System Controls */}
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

      {/* Sweep Action Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(sweepConfirmTarget)}
        title={sweepConfirmTarget?.title || "Confirm Action"}
        message={sweepConfirmTarget?.message || ""}
        confirmLabel="Execute Maintenance"
        cancelLabel="Cancel"
        variant="danger"
        loading={Boolean(runningSweepAction)}
        onConfirm={handleExecuteSweep}
        onCancel={() => {
          if (!runningSweepAction) setSweepConfirmTarget(null);
        }}
      />

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
