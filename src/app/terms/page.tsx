"use client";

import React from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import { ScrollText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Acceptance & scope",
    body: "By using this deployment you agree to these terms. This software is provided on an AS-IS basis with no warranty of any kind. It has not undergone an external security audit.",
  },
  {
    title: "2. Owner responsibility for content",
    body: "Document owners are solely responsible for what they upload and with whom they share it. The operator of this deployment cannot inspect document contents — the platform is cryptographically blind — and therefore cannot moderate content proactively.",
  },
  {
    title: "3. Acceptable use",
    body: "No malware, no illegal material, no infringement of third-party rights, no attempts to break rate-limits, enumerate share codes, or attack the underlying infrastructure. Accounts violating these rules may be blocked and their objects purged.",
  },
  {
    title: "4. No DRM claims",
    body: "Watermark overlays, disabled download affordances and present-mode locks are deterrents. They are not digital rights management and cannot prevent screenshots, photographs, or memory inspection by a determined viewer.",
  },
  {
    title: "5. Availability & free-tier limits",
    body: "This deployment is designed to run within free service tiers. Storage caps, per-day request budgets, cold starts and database auto-suspend may affect availability. No uptime SLA is offered.",
  },
  {
    title: "6. Data & deletion",
    body: "Owners can export or purge their data at any time from Settings. Deleting a document crypto-shreds its stored ciphertext; because the operator never holds the decryption key, deletion of the object makes the content unrecoverable.",
  },
  {
    title: "7. Key loss is unrecoverable",
    body: "The decryption key lives only in the URL fragment (#k=…) and, for password-mode links, inside a PBKDF2 wrap. If the fragment and the password are both lost, no one — including the operator — can recover the document.",
  },
  {
    title: "8. Changes",
    body: "These terms may be updated as the platform evolves; changes are tracked in CHANGELOG.md within the repository.",
  },
];

export default function TermsPage() {
  const { appName } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-10 sm:px-6">
        <header className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
            <ScrollText className="h-3.5 w-3.5" />
            <span>Plain-language terms</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Terms of Service</h1>
          <p className="text-sm text-slate-400">
            {appName} — self-hostable, zero-knowledge document sharing. Provided as-is, without warranty.
          </p>
        </header>

        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-2 text-sm font-bold text-white">{s.title}</h2>
              <p className="text-xs leading-relaxed text-slate-300">{s.body}</p>
            </section>
          ))}
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
