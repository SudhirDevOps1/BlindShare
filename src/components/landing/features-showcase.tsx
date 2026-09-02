"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  BarChart3,
  Lock,
  Zap,
  FolderLock,
  Layers,
  Key,
  Eye,
  FileText,
  Sliders,
  Sparkles,
  ServerOff,
  Flame,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Scale,
  RefreshCw,
} from "lucide-react";

export function FeaturesShowcase() {
  // 1. Watermark Interactive Simulator State
  const [watermarkText, setWatermarkText] = useState("investor@sequoia-capital.vc");
  const [watermarkOpacity, setWatermarkOpacity] = useState(22);
  const [watermarkAngle, setWatermarkAngle] = useState(-28);
  const watermarkCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Redraw Canvas Watermark whenever text, opacity, or angle changes
  React.useEffect(() => {
    const canvas = watermarkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 700;
    const height = canvas.parentElement?.clientHeight || 420;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((watermarkAngle * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    const opacityFrac = Math.max(0.08, Math.min(0.6, watermarkOpacity / 100));
    ctx.fillStyle = `rgba(245, 158, 11, ${opacityFrac})`;
    ctx.font = "bold 12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";

    const label = `${watermarkText.trim() || "CONFIDENTIAL"} • IP: 198.51.100.42 • ${new Date().toISOString().substring(0, 10)}`;

    const stepX = 360;
    const stepY = 110;

    for (let x = -width * 1.5; x < width * 2.5; x += stepX) {
      for (let y = -height * 1.5; y < height * 2.5; y += stepY) {
        ctx.fillText(label, x, y);
      }
    }
    ctx.restore();
  }, [watermarkText, watermarkOpacity, watermarkAngle]);

  // 2. Heatmap Dwell Simulator State
  const [activeSlide, setActiveSlide] = useState(3);
  const slidesData = [
    { slide: 1, title: "Executive Summary", seconds: 14, dropoff: "2%", intent: "⚡ WARM" },
    { slide: 2, title: "Problem & Opportunity", seconds: 28, dropoff: "5%", intent: "⚡ WARM" },
    { slide: 3, title: "Zero-Knowledge Architecture", seconds: 94, dropoff: "8%", intent: "🔥 HOT DEAL" },
    { slide: 4, title: "DuckDB Analytics Engine", seconds: 62, dropoff: "11%", intent: "🔥 HOT DEAL" },
    { slide: 5, title: "Business Model & Unit Economics", seconds: 85, dropoff: "15%", intent: "🔥 HOT DEAL" },
    { slide: 6, title: "Go-to-Market Strategy", seconds: 32, dropoff: "18%", intent: "⚡ WARM" },
    { slide: 7, title: "Team & Security Credentials", seconds: 19, dropoff: "20%", intent: "⚡ WARM" },
    { slide: 8, title: "Financial Projections & Ask", seconds: 110, dropoff: "22%", intent: "🔥 HOT DEAL" },
  ];

  // 3. FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How is BlindShare mathematically Zero-Knowledge?",
      a: "BlindShare generates an unguessable 256-bit AES-GCM encryption key directly inside your browser RAM using WebCrypto CSPRNG. The document is encrypted locally before transmission. The key is appended to the share link as a URL fragment (#k=...), which according to RFC 3986 is NEVER sent over HTTP to the server or database. The server acts exclusively as a blind storage courier.",
    },
    {
      q: "What happens if I clear my browser cache or use a new device?",
      a: "Your account is protected by an Enterprise-Grade Owner Master Key Vault. When you register or log in with your password, your browser derives a 256-bit Master Key using 100,000 PBKDF2-SHA256 rounds. This unlocks and unwraps all your encrypted document keys directly in memory without ever exposing plaintext keys to the server.",
    },
    {
      q: "Can the server administrators or database providers view my documents?",
      a: "No. Even with full root access to the PostgreSQL database, Backblaze B2 object storage, or hosting servers, administrators only see random encrypted ciphertext bytes and cryptographic IVs. Without the client's URL fragment key or Master Password, decryption is mathematically infeasible.",
    },
    {
      q: "How does BlindShare operate completely on a ₹0 Free Tier?",
      a: "BlindShare is architected with zero-cost edge presets: Next.js on Vercel/Cloudflare, SQLite/PostgreSQL on Turso/Supabase Free Tier (500MB), Backblaze B2 Free Tier (10GB storage, 3x egress), and client-side in-memory Mozilla PDF.js rendering. There are no mandatory background daemon servers or recurring cloud costs.",
    },
    {
      q: "How do dynamic watermarks prevent confidential leaks?",
      a: "When a recipient opens a tracked share link, BlindShare renders an immutable diagonal overlay on every slide displaying their authenticated email address, IP address, and link ID. If the recipient takes a screenshot or photo with a phone, the forensic watermark immediately traces the leak origin back to them.",
    },
  ];

  return (
    <div className="space-y-28 py-12">
      {/* 1. Interactive Live Watermark Studio Demo */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Forensic Screenshot Deterrence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Interactive Dynamic Watermark Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            Test how BlindShare burns real-time tiled forensic watermarks across every slide. Notice how the watermark matrix distributes cleanly across the entire canvas without obscuring slide typography.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls Panel */}
          <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-800/80 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-amber-400" />
              <span>Watermark Matrix Settings</span>
            </h3>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Venture Partner", text: "partner@sequoia.vc" },
                  { label: "M&A Advisory", text: "dealteam@morganstanley.com" },
                  { label: "Board Member", text: "director@board.internal" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setWatermarkText(preset.text)}
                    className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Viewer Identifier (Email / IP / Token)</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Matrix Opacity</span>
                <span className="font-mono text-amber-400 font-semibold">{watermarkOpacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Tiled Tilt Angle</span>
                <span className="font-mono text-amber-400 font-semibold">{watermarkAngle}°</span>
              </div>
              <input
                type="range"
                min="-60"
                max="60"
                value={watermarkAngle}
                onChange={(e) => setWatermarkAngle(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Drawn directly via HTML5 2D Canvas in browser memory before rasterization.</span>
            </div>
          </div>

          {/* Live Document Preview Card with True Tiled HTML5 Canvas Watermark */}
          <div className="lg:col-span-7 relative">
            <div className="rounded-3xl border border-slate-700/80 bg-slate-900/95 shadow-2xl p-6 sm:p-8 aspect-[16/10] relative overflow-hidden flex flex-col justify-between select-none">
              {/* Document Content Layer */}
              <div className="space-y-4 z-10">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 text-xs font-black">
                      B
                    </div>
                    <span className="font-bold text-white text-xs">Series A Pitch Deck · Confidential</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Slide 3 of 12</span>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">Q4 Zero-Knowledge Financial Growth</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                    Targeting 340% YoY expansion with zero infrastructure operational costs. Cryptographic zero-knowledge invariants protect all proprietary algorithms.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3">
                  <div className="rounded-xl bg-slate-950/90 p-3.5 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium">ARR Runway</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">$4.2M</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/90 p-3.5 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium">Gross Margin</div>
                    <div className="text-base font-bold text-amber-400 mt-0.5">92.4%</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/90 p-3.5 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium">Egress Cost</div>
                    <div className="text-base font-bold text-blue-400 mt-0.5">$0.00</div>
                  </div>
                </div>
              </div>

              {/* True Real-time HTML5 Tiled Canvas Watermark Matrix */}
              <canvas
                ref={watermarkCanvasRef}
                className="pointer-events-none absolute inset-0 block h-full w-full z-20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Deep Reading Analytics Simulator */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>DuckDB Micro-Engine Analytics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Per-Page Dwell Heatmap & AI Lead Conviction
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            Experience how BlindShare calculates dwell curves (p50, p90) and categorizes high-intent investors in real time.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl space-y-6">
          {/* Slide Selector Carousel Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {slidesData.map((s) => (
              <button
                key={s.slide}
                onClick={() => setActiveSlide(s.slide)}
                className={`rounded-2xl p-3 text-center border transition-all ${
                  activeSlide === s.slide
                    ? "bg-amber-500/20 border-amber-500/50 shadow-md shadow-amber-500/10 scale-105"
                    : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 text-slate-400"
                }`}
              >
                <div className="text-[10px] font-semibold text-slate-400">Slide {s.slide}</div>
                <div className="text-sm font-bold text-white mt-1">{s.seconds}s</div>
                <div className="text-[9px] font-mono mt-1 text-amber-400">{s.intent.split(" ")[0]}</div>
              </button>
            ))}
          </div>

          {/* Active Slide Detail Card */}
          {slidesData[activeSlide - 1] && (
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-inner">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                    Slide {slidesData[activeSlide - 1].slide}
                  </span>
                  <h4 className="text-base font-bold text-white">
                    {slidesData[activeSlide - 1].title}
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  Calculated via mathematical percentiles (p50: {slidesData[activeSlide - 1].seconds - 4}s, p90: {slidesData[activeSlide - 1].seconds + 12}s).
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Audience Attention</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {slidesData[activeSlide - 1].seconds} seconds
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                  <div className="text-[10px] text-slate-400">Lead Classification</div>
                  <div className="text-xs font-bold text-amber-300">
                    {slidesData[activeSlide - 1].intent}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Architectural Comparison Matrix */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
            <Scale className="h-3.5 w-3.5" />
            <span>Architectural Transparency</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How BlindShare Compares to Legacy Platforms
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            Transparent comparison of cryptographic invariants, privacy boundaries, and operational pricing.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-4 pl-3">Security & Architectural Metric</th>
                <th className="pb-4 text-amber-400 font-bold">BlindShare (Zero-Knowledge)</th>
                <th className="pb-4 text-slate-400">Traditional Cloud Platforms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-4 pl-3 font-semibold text-white">Client-Side E2EE WebCrypto</td>
                <td className="py-4 text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> 100% Client Browser RAM
                </td>
                <td className="py-4 text-slate-400">❌ Server holds plaintext PDFs</td>
              </tr>
              <tr>
                <td className="py-4 pl-3 font-semibold text-white">Storage Provider Access</td>
                <td className="py-4 text-emerald-400 font-bold">Zero (Sees only blind ciphertext)</td>
                <td className="py-4 text-slate-400">❌ Storage vendor can inspect bytes</td>
              </tr>
              <tr>
                <td className="py-4 pl-3 font-semibold text-white">Owner Master Key Vault</td>
                <td className="py-4 text-emerald-400 font-bold">PBKDF2-SHA256 (100k rounds)</td>
                <td className="py-4 text-slate-400">❌ Plain server-side database lookup</td>
              </tr>
              <tr>
                <td className="py-4 pl-3 font-semibold text-white">Operating Cost & Hosting</td>
                <td className="py-4 text-emerald-400 font-bold">100% ₹0 Free-Tier Presets</td>
                <td className="py-4 text-slate-400">❌ $20-$100+ / user / month</td>
              </tr>
              <tr>
                <td className="py-4 pl-3 font-semibold text-white">License & Portability</td>
                <td className="py-4 text-emerald-400 font-bold">MIT Open Source · Self-Hostable</td>
                <td className="py-4 text-slate-400">❌ Proprietary SaaS Lock-in</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Comprehensive Interactive FAQ Accordion */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Everything you need to know about BlindShare's cryptographic guarantees, key persistence, and self-hosting.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden transition-all shadow-md"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-amber-300 transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="h-4 w-4 text-amber-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
