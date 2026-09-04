"use client";

import React from "react";
import { Trophy, ExternalLink, Copy, Check, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { hexToBuffer, docKeyToFragment } from "@/lib/crypto-core";
import { syncVaultDocumentKeys } from "@/lib/vault/master-vault";

interface TopLinksLeaderboardProps {
  links?: any[];
  linkPerformance?: any[];
}

export function TopLinksLeaderboard({ links = [], linkPerformance = [] }: TopLinksLeaderboardProps) {
  const { t } = useI18n();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const perfMap = React.useMemo(() => {
    const map = new Map<string, any>();
    if (linkPerformance) {
      linkPerformance.forEach((p) => {
        if (p.linkId) map.set(p.linkId, p);
      });
    }
    return map;
  }, [linkPerformance]);

  const topItems = React.useMemo(() => {
    if (links && links.length > 0) {
      return [...links]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map((l) => {
          const perf = perfMap.get(l.id);
          return {
            id: l.id,
            title: l.name || l.slug,
            viewCount: l.viewCount || 0,
            avgDwell: perf?.formattedAvgDwell || (l.viewCount > 0 ? "0m 45s" : "0s"),
            score: perf?.score !== undefined ? perf.score : (l.viewCount > 0 ? 50 : 0),
            code: l.slug,
            docId: l.docId,
            ownerEncryptedKeyHex: l.ownerEncryptedKeyHex,
            ownerEncryptedKeyIvHex: l.ownerEncryptedKeyIvHex,
            hasPassword: l.hasPassword,
            isReal: true,
          };
        });
    }
    return [];
  }, [links, perfMap]);

  const maxViews = Math.max(...topItems.map((item) => item.viewCount || 1), 1);

  const getStoredKeyHex = (item: any): string | null => {
    if (typeof window === "undefined") return null;
    return (
      (item.docId && sessionStorage.getItem(`blindshare_key_${item.docId}`)) ||
      (item.docId && localStorage.getItem(`blindshare_key_${item.docId}`)) ||
      (item.id && sessionStorage.getItem(`blindshare_key_${item.id}`)) ||
      (item.id && localStorage.getItem(`blindshare_key_${item.id}`)) ||
      sessionStorage.getItem(`blindshare_link_key_${item.code}`) ||
      localStorage.getItem(`blindshare_link_key_${item.code}`) ||
      sessionStorage.getItem(`blindshare_key_${item.code}`) ||
      localStorage.getItem(`blindshare_key_${item.code}`) ||
      null
    );
  };

  const buildFullUrl = (item: any) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let url = `${origin}/v/${item.code}`;

    const storedHex = getStoredKeyHex(item);
    if (storedHex) {
      try {
        const docKey = hexToBuffer(storedHex);
        url += `#k=${docKeyToFragment(docKey)}`;
      } catch {}
    }
    return url;
  };

  const handleCopy = async (item: any) => {
    let storedHex = getStoredKeyHex(item);

    // If key is missing in storage, attempt immediate auto-unwrap via active master vault
    if (!storedHex && (item.ownerEncryptedKeyHex || item.docId)) {
      try {
        await syncVaultDocumentKeys([], [item]);
        storedHex = getStoredKeyHex(item);
      } catch {}
    }

    const url = buildFullUrl(item);
    navigator.clipboard.writeText(url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.leaderboard?.title || "Top Performing Pitch Decks & Share Links"}
            </h3>
            <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Ranked Velocity
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.leaderboard?.subtitle || "Ranked comparison by investor interest and average attention velocity"}
          </p>
        </div>
      </div>

      {/* Leaderboard Rows */}
      {topItems.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-8 text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="text-xs font-bold text-white">No share links yet</div>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Generate your first tracked link to see real investor velocity and engagement rankings here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
        {topItems.map((item, index) => {
          const ratio = (item.viewCount || 0) / maxViews;
          const rankColors = ["text-amber-400", "text-slate-300", "text-amber-600", "text-slate-500", "text-slate-600"];

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-base font-black font-mono w-5 text-center ${rankColors[index] || "text-slate-500"}`}>
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                    {item.title || item.code}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                    <span>
                      {item.viewCount || 0} {t.charts?.leaderboard?.views || "views"}
                    </span>
                    <span>•</span>
                    <span>{item.avgDwell || "0s"}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">
                      {item.score !== undefined ? item.score : 0} {t.charts?.leaderboard?.score || "Score"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Actions */}
              <div className="flex items-center gap-3 sm:w-48 justify-end">
                <div className="w-24 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(item)}
                  className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Copy Share Link"
                >
                  {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>

                <Link
                  href={`/dashboard/analytics/${item.id}`}
                  className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-1.5 text-amber-400 hover:bg-amber-500/20 transition"
                  title="View Analytics"
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
