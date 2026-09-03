"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, Eye, Layers, Sparkles, ExternalLink, CheckCircle2, ArrowRight } from "lucide-react";

interface ShowcaseItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  svgPath: string;
  description: string;
  bulletPoints: string[];
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: "zk-flow",
    title: "Zero-Knowledge Encryption Flow",
    subtitle: "RFC 3986 URL Fragment (#k=...) Architecture",
    badge: "Cryptographic Standard",
    svgPath: "/brand/03-hero-zero-knowledge-flow.svg",
    description:
      "Witness how unencrypted document bytes are locked inside client-side WebCrypto RAM. Only AES-GCM ciphertext reaches storage. The decryption key travels strictly via the URL fragment, which browsers never send to HTTP servers.",
    bulletPoints: [
      "Client-side 256-bit AES-GCM CSPRNG key generation",
      "URL fragment (#k=...) is never transmitted over HTTP wire",
      "Backblaze B2 & Neon PostgreSQL only store encrypted ciphertext",
      "Zero server-side plaintext decryption (Blind Courier standard)",
    ],
  },
  {
    id: "blind-courier",
    title: "The Blind Courier Metaphor",
    subtitle: "Delivering Sealed Vaults Without Possessing The Key",
    badge: "Core Philosophy",
    svgPath: "/brand/04-blind-courier-illustration.svg",
    description:
      "BlindShare operates like an armored courier delivering a biometric safe. The courier transports the locked container across the world but possesses neither the combination nor the tools to open it.",
    bulletPoints: [
      "Zero server trust required — mathematically enforced",
      "Root database admins cannot inspect pitch deck slides",
      "Immune to server-side subpoena and data breaches",
      "Recipient browser decrypts in ephemeral WebAssembly memory",
    ],
  },
  {
    id: "data-flow",
    title: "End-to-End Cryptographic Pipeline",
    subtitle: "Complete Data Flow from Founder Upload to Investor Dwell",
    badge: "Architecture Blueprint",
    svgPath: "/brand/12-data-flow-diagram.svg",
    description:
      "Explore the multi-layer pipeline linking presigned S3 uploads, PBKDF2 Master Key vaults, DuckDB mathematical dwell telemetry, and forensic tamper-resistant canvas watermarking.",
    bulletPoints: [
      "Presigned S3 PUT direct to Backblaze B2 / Cloudflare R2",
      "PBKDF2 100,000 rounds Owner Master Key wrapping",
      "Batched beacon dwell telemetry via navigator.sendBeacon()",
      "Mathematical Catmull-Rom percentile aggregation",
    ],
  },
  {
    id: "lead-scoring",
    title: "AI Investor Lead Intelligence",
    subtitle: "Deep Slide Attention Scoring & Deal Temperature",
    badge: "Pitch Deck Analytics",
    svgPath: "/brand/08-ai-lead-scoring.svg",
    description:
      "Automated heuristic scoring classifies prospective investors into Hot Deals, Warm Leads, and Casual Bounces based on mathematical dwell times, return visits, and completion rates.",
    bulletPoints: [
      "🔥 Hot Deal (85-100): High completion, high dwell on financials",
      "⚡ Warm Lead (60-84): Good engagement across key problem slides",
      "❄️ Cold Bounce (0-59): Abandoned deck within first 2 slides",
      "Instant founder alert when an investor re-opens your deck",
    ],
  },
  {
    id: "mockup",
    title: "Document Studio & Forensic Watermarking",
    subtitle: "Zero-Knowledge Pitch Deck Viewer",
    badge: "Product UI",
    svgPath: "/brand/07-document-sharing-mockup.svg",
    description:
      "High-resolution vector rendering with interactive selectable text, indelible recipient email watermarking, and dynamic anti-leak screenshot deterrence.",
    bulletPoints: [
      "Vector-sharp 2x super-sampled Mozilla PDF.js canvas",
      "Dynamic viewer email & IP watermark matrix",
      "Indelible corner forensic coordinate stamp",
      "Interactive in-document slide Q&A pins with founder reply",
    ],
  },
];

export function ArchitectureShowcase() {
  const [activeTab, setActiveTab] = useState(SHOWCASE_ITEMS[0].id);

  const currentItem = SHOWCASE_ITEMS.find((item) => item.id === activeTab) || SHOWCASE_ITEMS[0];

  return (
    <section className="relative border-t border-slate-900/80 bg-slate-950/80 py-24 px-4 sm:px-6">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 right-10 -z-10 h-96 w-96 rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-xl shadow-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Interactive Architecture & Visual Showcase</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Zero-Knowledge Actually Works Under The Hood
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Inspect the cryptographic mechanics, blind courier transport, and deep telemetry diagrams powering BlindShare.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
          {SHOWCASE_ITEMS.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]"
                    : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Featured Showcase Display Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          {/* Left / Top: High-Resolution Scalable SVG Diagram Display */}
          <div className="lg:col-span-7 relative group">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-inner flex items-center justify-center">
              <img
                src={currentItem.svgPath}
                alt={currentItem.title}
                className="w-full h-auto max-h-[460px] object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <a
                href={currentItem.svgPath}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition shadow-md"
                title="View full vector graphic in new tab"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Enlarge Vector</span>
              </a>
            </div>
          </div>

          {/* Right / Bottom: Technical Breakdown & Capabilities */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                {currentItem.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentItem.title}
              </h3>
              <p className="text-xs font-mono text-amber-400/90 mt-1">
                {currentItem.subtitle}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentItem.description}
            </p>

            {/* Bullet Points */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              {currentItem.bulletPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">100% Vector Scalable (SVG)</span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-emerald-400 font-semibold">Zero-Knowledge Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
