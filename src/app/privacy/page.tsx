"use client";

import React from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import { FORMAT_TABLE } from "@/lib/formats";
import { EyeOff, Lock, BarChart3, Server, ShieldCheck } from "lucide-react";

const QUADRANTS = [
  {
    icon: EyeOff,
    tone: "emerald",
    title: "1. NEVER COLLECTED",
    items: [
      "Document plaintext / readable file bytes",
      "DocKeys (AES-GCM-256 keys live only in the link fragment or your browser memory)",
      "Password plaintext (only bcrypt hash + PBKDF2 wrap parameters are stored)",
      "Third-party ad or analytics trackers — there are none",
    ],
    retention: "N/A — never exists on the server.",
  },
  {
    icon: Lock,
    tone: "amber",
    title: "2. CIPHERTEXT",
    items: [
      "Encrypted document bytes (AES-GCM-256)",
      "Encrypted thumbnails generated on the owner's device",
      "Initialization vectors and wrap parameters (useless without the key)",
    ],
    retention: "Kept until the owner deletes the document (crypto-shred) or DOC_TTL_SWEEP_DAYS purges it.",
  },
  {
    icon: BarChart3,
    tone: "blue",
    title: "3. METADATA-LITE",
    items: [
      "Session id, page number + dwell seconds (batched every 10s)",
      "UA class (browser / OS / device class), coarse country from provider header",
      "Salted daily IP hash (raw IP storage is OFF by default)",
      "Viewer e-mail ONLY when the owner enabled the e-mail gate and the viewer typed it",
    ],
    retention: "page_events 180 days · view sessions 180 days · audit log 30 days rolling.",
  },
  {
    icon: Server,
    tone: "slate",
    title: "4. PLATFORM LOGS",
    items: [
      "Hosting/CDN provider request logs (IP, timestamp) governed by that provider's own policy",
      "Object-storage access logs at Backblaze B2 / Cloudflare R2",
      "Application logs contain ids, latencies and counts only — no filenames, keys or e-mails",
    ],
    retention: "Per provider policy; BlindShare does not copy these into its own database.",
  },
];

export default function PrivacyPage() {
  const { appName } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Policy matches the actual code paths</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h1>
          <p className="text-sm text-slate-400">
            {appName} is a zero-knowledge document courier. This page describes exactly what the server can and cannot
            see — a four-quadrant data inventory.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {QUADRANTS.map((q) => {
            const Icon = q.icon;
            return (
              <div key={q.title} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-amber-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">{q.title}</h2>
                </div>
                <ul className="space-y-1.5 text-xs leading-relaxed text-slate-300">
                  {q.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <span className="text-amber-500">•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-[11px] text-slate-400">
                  <strong className="text-slate-300">Retention:</strong> {q.retention}
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-bold text-white">Honest limitations (no DRM claims)</h2>
          <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
            <li>
              <strong className="text-amber-400">Watermarks are a deterrent.</strong> A determined viewer can photograph
              the screen. We never claim otherwise.
            </li>
            <li>
              <strong className="text-amber-400">Download-off is a deterrent.</strong> Once bytes are decrypted for
              rendering they exist in the viewer's browser memory.
            </li>
            <li>
              <strong className="text-amber-400">Link forwarding is outside our control.</strong> Anyone holding the full
              URL (including the <code className="text-amber-300">#k=</code> fragment) can decrypt. Use password, e-mail
              gate, expiry and view caps for defence-in-depth.
            </li>
            <li>
              <strong className="text-amber-400">Geo/country gates are coarse.</strong> They rely on provider headers and
              can be bypassed with a VPN.
            </li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-bold text-white">Per-format handling</h2>
          <p className="text-xs text-slate-400">
            Every supported format is decrypted in your browser before rendering. The server never parses content.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 font-semibold text-slate-400">
                <tr>
                  <th className="pb-2">Format</th>
                  <th className="pb-2">Client renderer</th>
                  <th className="pb-2">Analytics captured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {FORMAT_TABLE.map((r) => (
                  <tr key={r.format}>
                    <td className="py-2 font-medium text-white">{r.format}</td>
                    <td className="py-2 text-slate-300">{r.renderer}</td>
                    <td className="py-2 text-slate-400">{r.analytics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-bold text-white">Your rights</h2>
          <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
            <li>
              <strong className="text-white">Owners:</strong> export all of your data at{" "}
              <code className="text-amber-300">/api/user/export</code> or purge everything from Settings → Delete
              Account (crypto-shred of stored ciphertext).
            </li>
            <li>
              <strong className="text-white">Viewers:</strong> the platform stores only minimal metadata about your read
              session. To request erasure, contact the document owner who shared the link with you — they control the
              link and its analytics.
            </li>
            <li>
              <strong className="text-white">No ads, no data sale, no third-party analytics.</strong>
            </li>
          </ul>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
