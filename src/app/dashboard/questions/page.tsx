import { BrandIcon } from "@/components/brand-icon";
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { QuestionDensityHeatmap } from "@/components/analytics/charts/question-density-heatmap";
import { useI18n } from "@/lib/i18n/context";
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Search,
  ExternalLink,
  Filter,
  FileText,
  User,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Check,
} from "lucide-react";

export default function QuestionsPage() {
  const { t } = useI18n();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/questions");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSendReply = async (questionId: string, markResolved = true) => {
    const text = replyTextMap[questionId];
    if (!text || !text.trim()) return;

    try {
      setSubmittingId(questionId);
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          replyText: text.trim(),
          isResolved: markResolved,
        }),
      });

      if (res.ok) {
        setSuccessId(questionId);
        setTimeout(() => setSuccessId(null), 3000);
        // Update local state
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, replyText: text.trim(), isResolved: markResolved, repliedAt: new Date().toISOString() }
              : q
          )
        );
        setReplyTextMap((prev) => ({ ...prev, [questionId]: "" }));
      }
    } catch {}
    setSubmittingId(null);
  };

  const handleToggleResolve = async (questionId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          isResolved: !currentStatus,
        }),
      });

      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, isResolved: !currentStatus } : q))
        );
      }
    } catch {}
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this reader question?")) return;

    try {
      const res = await fetch(`/api/questions?id=${questionId}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      }
    } catch {}
  };

  // Filter & Search Logic
  const filtered = questions.filter((q) => {
    if (filter === "pending" && q.isResolved) return false;
    if (filter === "resolved" && !q.isResolved) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchDoc = q.docTitle?.toLowerCase().includes(term);
      const matchText = q.questionText?.toLowerCase().includes(term);
      const matchAsker = q.askerName?.toLowerCase().includes(term) || q.askerEmail?.toLowerCase().includes(term);
      if (!matchDoc && !matchText && !matchAsker) return false;
    }
    return true;
  });

  const totalCount = questions.length;
  const pendingCount = questions.filter((q) => !q.isResolved).length;
  const resolvedCount = questions.filter((q) => q.isResolved).length;

  return (
    <div className="flex flex-col text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <BrandIcon size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">In-Doc Q&A & Reader Inquiries</h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Manage real-time slide question pins, investor inquiries, and publish official founder replies.
              </p>
            </div>
          </div>

          {/* Stat Badges */}
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Questions</span>
              <span className="text-lg font-bold text-white">{totalCount}</span>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-center">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Pending Reply</span>
              <span className="text-lg font-bold text-amber-300">{pendingCount}</span>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-center">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Resolved</span>
              <span className="text-lg font-bold text-emerald-300">{resolvedCount}</span>
            </div>
          </div>
        </div>

        {/* Slide Question Density Heatmap (40) */}
        <div className="mb-8">
          <QuestionDensityHeatmap questions={questions} totalPages={10} />
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Segmented Filter */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 w-full sm:w-auto">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === "all" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === "pending" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("resolved")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === "resolved" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions or askers..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No Reader Questions Found</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {search ? "No questions match your search filters." : "When readers pin questions on your slides in the Document Viewer, they will appear here in real-time."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((q) => {
              const isResolved = q.isResolved;
              const hasReply = Boolean(q.replyText);

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-5 transition-all backdrop-blur-md ${
                    isResolved
                      ? "border-slate-800/70 bg-slate-900/30 opacity-80"
                      : "border-slate-700/80 bg-slate-900/80 shadow-xl shadow-black/20"
                  }`}
                >
                  {/* Top Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isResolved
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {isResolved ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span>{isResolved ? "Resolved" : "Pending Reply"}</span>
                      </span>

                      {/* Document Name */}
                      <span className="font-bold text-white flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-amber-400" />
                        <span>{q.docTitle || "Document"}</span>
                      </span>

                      {/* Slide Page # */}
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        Slide Page {q.pageNumber}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleResolve(q.id, isResolved)}
                        className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:border-slate-600 transition"
                      >
                        {isResolved ? "Mark Pending" : "Mark Resolved"}
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition rounded-lg hover:bg-slate-800"
                        title="Delete question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Asker & Question Content */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-amber-400">{q.askerName || "Anonymous Reader"}</span>
                      {q.askerEmail && <span className="text-slate-500">({q.askerEmail})</span>}
                      <span className="text-[10px] text-slate-500">
                        • {new Date(q.createdAt).toLocaleDateString()} at {new Date(q.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-100 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
                      "{q.questionText}"
                    </p>
                  </div>

                  {/* Existing Founder Reply */}
                  {hasReply && (
                    <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3.5 text-xs text-emerald-300 space-y-1">
                      <div className="flex items-center justify-between font-bold text-emerald-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Founder Reply
                        </span>
                        {q.repliedAt && (
                          <span className="text-[10px] text-emerald-500">
                            {new Date(q.repliedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed">{q.replyText}</p>
                    </div>
                  )}

                  {/* Reply Composer Form */}
                  <div className="mt-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyTextMap[q.id] !== undefined ? replyTextMap[q.id] : ""}
                        onChange={(e) => setReplyTextMap({ ...replyTextMap, [q.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(q.id, true);
                          }
                        }}
                        placeholder={hasReply ? "Write an updated reply..." : "Write official founder reply to this question..."}
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        onClick={() => handleSendReply(q.id, true)}
                        disabled={submittingId === q.id || !replyTextMap[q.id]?.trim()}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/10"
                      >
                        {successId === q.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-slate-950" />
                            <span>Sent!</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>{hasReply ? "Update Reply" : "Reply & Resolve"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

