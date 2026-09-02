"use client";

import React, { useRef, useState } from "react";

const TECH = [
  { name: "Next.js 16",     color: "#fff",    bg: "rgba(255,255,255,0.06)",  mono: true  },
  { name: "TypeScript",     color: "#3b82f6", bg: "rgba(59,130,246,0.08)",   mono: false },
  { name: "WebCrypto API",  color: "#10b981", bg: "rgba(16,185,129,0.08)",   mono: false },
  { name: "AES-GCM-256",    color: "#f59e0b", bg: "rgba(245,158,11,0.08)",   mono: true  },
  { name: "PDF.js",         color: "#e74c3c", bg: "rgba(231,76,60,0.08)",    mono: false },
  { name: "PostgreSQL",     color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   mono: false },
  { name: "Tailwind CSS",   color: "#38bdf8", bg: "rgba(56,189,248,0.08)",   mono: false },
  { name: "Drizzle ORM",    color: "#a78bfa", bg: "rgba(167,139,250,0.08)",  mono: false },
  { name: "Backblaze B2",   color: "#f97316", bg: "rgba(249,115,22,0.08)",   mono: false },
  { name: "Zod 4",          color: "#34d399", bg: "rgba(52,211,153,0.08)",   mono: false },
  { name: "RFC 3986",       color: "#fbbf24", bg: "rgba(251,191,36,0.08)",   mono: true  },
  { name: "MIT License",    color: "#94a3b8", bg: "rgba(148,163,184,0.07)",  mono: false },
];

export function TrustBar() {
  return (
    <div style={{
      borderTop: "1px solid rgba(30,41,59,0.8)",
      borderBottom: "1px solid rgba(30,41,59,0.8)",
      padding: "20px 24px",
      background: "rgba(8,13,24,0.8)",
      backdropFilter: "blur(12px)",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Label */}
      <div style={{
        textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
        color: "rgba(100,116,139,0.6)", textTransform: "uppercase", marginBottom: 16,
      }}>
        Built with &amp; Powered by
      </div>

      {/* Scrolling badge strip — duplicated for seamless loop */}
      <div style={{ overflow: "hidden", position: "relative" }}>
        <style>{`
          @keyframes scrollLeft {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .trust-strip {
            display: flex;
            gap: 12px;
            width: max-content;
            animation: scrollLeft 22s linear infinite;
          }
          .trust-strip:hover { animation-play-state: paused; }
        `}</style>
        <div className="trust-strip">
          {[...TECH, ...TECH].map((t, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                borderRadius: 999, padding: "5px 14px",
                border: `1px solid ${t.color}25`,
                background: t.bg,
                fontSize: 11, fontWeight: t.mono ? 700 : 600,
                color: t.color,
                whiteSpace: "nowrap",
                fontFamily: t.mono ? "ui-monospace, monospace" : "inherit",
                flexShrink: 0,
                letterSpacing: t.mono ? "0.02em" : "normal",
              }}
            >
              {t.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
