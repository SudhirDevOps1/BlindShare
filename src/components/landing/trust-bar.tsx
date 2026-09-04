"use client";

import React, { memo } from "react";

interface TechStackItem {
  name: string;
  tag?: string;
  color: string;
  bg: string;
  border: string;
  mono?: boolean;
  icon: React.ReactNode;
}

function NextJsIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.328 14.863l-5.617-7.234v7.234H8.25V7.137h1.461l5.617 7.233V7.137h1.461v9.726h-1.461z" />
    </svg>
  );
}

function ReactIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="-11.5 -10.23 23 20.46" fill="currentColor">
      <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
      <g stroke="#61DAFB" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}

function TypeScriptIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#3178C6" />
      <path
        d="M5.5 10h5m-2.5 0v8m4-8h4.5m-2.25 0v8m-1.75 0h3.5"
        stroke="#FFFFFF"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TailwindIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#38BDF8">
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
    </svg>
  );
}

function PostgresIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#60A5FA">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 16h-2a3 3 0 0 1-3-3 4 4 0 0 1 4-4h1a4 4 0 0 1 4 4 3 3 0 0 1-3 3h-1z" />
    </svg>
  );
}

function NeonIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5h3.5l8.5 10V5H20v14h-3.5L8 9v10H4z" fill="#00E599" />
    </svg>
  );
}

function DrizzleIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#C5F74F">
      <path d="M12 2.5C9.5 7 5 12 5 16a7 7 0 0 0 14 0c0-4-4.5-9-7-13.5zm0 17.5a4 4 0 0 1-4-4c0-2.3 2.6-5.4 4-7 1.4 1.6 4 4.7 4 7a4 4 0 0 1-4 4z" />
    </svg>
  );
}

function BackblazeIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#F97316">
      <path d="M12 2C8 6 6 9.5 6 13.5A6 6 0 0 0 12 22a6 6 0 0 0 6-8.5c0-4-2-7.5-6-11.5zm0 17a3 3 0 0 1-3-3c0-2 1.5-4 3-6 1.5 2 3 4 3 6a3 3 0 0 1-3 3z" />
    </svg>
  );
}

function CloudflareIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#F38020">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
    </svg>
  );
}

function DockerIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#2496ED">
      <path d="M13.98 10.15h2.15v2.15h-2.15v-2.15zm-3.1 0h2.15v2.15h-2.15v-2.15zm-3.1 0h2.15v2.15H7.78v-2.15zm6.2-3.1h2.15v2.15h-2.15V7.05zm-3.1 0h2.15v2.15h-2.15V7.05zm-3.1 0h2.15v2.15H7.78V7.05zm-3.1 3.1h2.15v2.15H4.68v-2.15zm17.9 3.1c-.2-.1-.9-.3-1.8-.3-.5 0-1 .1-1.4.3-.4-1.3-1.6-2.2-3-2.2H2.2c-.4 0-.8.2-1 .5-.2.3-.3.7-.2 1.1.9 3.8 4.3 6.6 8.3 6.6 5.3 0 9.7-3.9 10.3-9.1.7.3 1.6.4 2.1.4.3 0 .7 0 1-.1.2-.1.3-.2.3-.4-.1-.3-.3-.5-.4-.6z" />
    </svg>
  );
}

function WebCryptoIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M12 12.5V16" />
    </svg>
  );
}

function AesGcmIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1.5" fill="#F59E0B" />
    </svg>
  );
}

function PdfJsIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function DuckDbIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#FCD34D">
      <path d="M19.5 12c-.5-1.5-2-2.5-3.5-2.5h-1c-.5-2-2.5-3.5-4.5-3.5-2.5 0-4.5 2-4.5 4.5 0 .5.1 1 .3 1.5-2.5.5-4.3 2.7-4.3 5.5 0 3 2.5 5.5 5.5 5.5h8c3 0 5.5-2.5 5.5-5.5 0-1.5-.7-3-1.8-4l1.3-1.5z" />
    </svg>
  );
}

function ZodIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 22 22 7 12 2" />
      <path d="M8 9h8l-8 6h8" />
    </svg>
  );
}

function WebPushIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function TursoIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#4FF8D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function LitestreamIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function AltchaIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function Rfc3986Icon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function MitLicenseIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M3 7l9-4 9 4" />
      <path d="M6 15l-3-6h6l-3 6a3 3 0 0 1-6 0" />
      <path d="M18 15l-3-6h6l-3 6a3 3 0 0 1-6 0" />
    </svg>
  );
}

const TECH_STACK: TechStackItem[] = [
  {
    name: "Next.js 16",
    tag: "v16.2",
    color: "#FFFFFF",
    bg: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.18)",
    mono: true,
    icon: <NextJsIcon />,
  },
  {
    name: "React 19",
    tag: "v19.2",
    color: "#61DAFB",
    bg: "rgba(97, 218, 251, 0.07)",
    border: "rgba(97, 218, 251, 0.25)",
    mono: false,
    icon: <ReactIcon />,
  },
  {
    name: "TypeScript",
    tag: "v5.9",
    color: "#60A5FA",
    bg: "rgba(96, 165, 250, 0.07)",
    border: "rgba(96, 165, 250, 0.25)",
    mono: false,
    icon: <TypeScriptIcon />,
  },
  {
    name: "WebCrypto API",
    tag: "W3C Native",
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.07)",
    border: "rgba(52, 211, 153, 0.25)",
    mono: false,
    icon: <WebCryptoIcon />,
  },
  {
    name: "AES-GCM-256",
    tag: "E2EE",
    color: "#FBBF24",
    bg: "rgba(251, 191, 36, 0.07)",
    border: "rgba(251, 191, 36, 0.25)",
    mono: true,
    icon: <AesGcmIcon />,
  },
  {
    name: "PostgreSQL",
    tag: "v16+",
    color: "#93C5FD",
    bg: "rgba(147, 197, 253, 0.07)",
    border: "rgba(147, 197, 253, 0.25)",
    mono: false,
    icon: <PostgresIcon />,
  },
  {
    name: "Neon Serverless",
    tag: "Preset A",
    color: "#00E599",
    bg: "rgba(0, 229, 153, 0.07)",
    border: "rgba(0, 229, 153, 0.25)",
    mono: false,
    icon: <NeonIcon />,
  },
  {
    name: "Tailwind CSS v4",
    tag: "v4.1",
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.07)",
    border: "rgba(56, 189, 248, 0.25)",
    mono: false,
    icon: <TailwindIcon />,
  },
  {
    name: "Drizzle ORM",
    tag: "Zero-Overhead",
    color: "#C5F74F",
    bg: "rgba(197, 247, 79, 0.07)",
    border: "rgba(197, 247, 79, 0.25)",
    mono: false,
    icon: <DrizzleIcon />,
  },
  {
    name: "Backblaze B2",
    tag: "S3 Compatible",
    color: "#FB923C",
    bg: "rgba(251, 146, 60, 0.07)",
    border: "rgba(251, 146, 60, 0.25)",
    mono: false,
    icon: <BackblazeIcon />,
  },
  {
    name: "PDF.js",
    tag: "Client Canvas",
    color: "#F87171",
    bg: "rgba(248, 113, 113, 0.07)",
    border: "rgba(248, 113, 113, 0.25)",
    mono: false,
    icon: <PdfJsIcon />,
  },
  {
    name: "DuckDB",
    tag: "In-Memory SQL",
    color: "#FDE047",
    bg: "rgba(253, 224, 71, 0.07)",
    border: "rgba(253, 224, 71, 0.25)",
    mono: false,
    icon: <DuckDbIcon />,
  },
  {
    name: "Zod 4",
    tag: "Validation",
    color: "#6EE7B7",
    bg: "rgba(110, 231, 183, 0.07)",
    border: "rgba(110, 231, 183, 0.25)",
    mono: false,
    icon: <ZodIcon />,
  },
  {
    name: "ALTCHA PoW",
    tag: "Anti-Bot",
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.07)",
    border: "rgba(52, 211, 153, 0.25)",
    mono: true,
    icon: <AltchaIcon />,
  },
  {
    name: "Cloudflare Pages",
    tag: "Preset C",
    color: "#FDBA74",
    bg: "rgba(253, 186, 116, 0.07)",
    border: "rgba(253, 186, 116, 0.25)",
    mono: false,
    icon: <CloudflareIcon />,
  },
  {
    name: "Turso libSQL",
    tag: "Edge DB",
    color: "#5EEAD4",
    bg: "rgba(94, 234, 212, 0.07)",
    border: "rgba(94, 234, 212, 0.25)",
    mono: false,
    icon: <TursoIcon />,
  },
  {
    name: "Docker Engine",
    tag: "Preset B",
    color: "#60A5FA",
    bg: "rgba(96, 165, 250, 0.07)",
    border: "rgba(96, 165, 250, 0.25)",
    mono: false,
    icon: <DockerIcon />,
  },
  {
    name: "Litestream",
    tag: "B2 WAL Sync",
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.07)",
    border: "rgba(56, 189, 248, 0.25)",
    mono: false,
    icon: <LitestreamIcon />,
  },
  {
    name: "Web Push",
    tag: "RFC 8292",
    color: "#C084FC",
    bg: "rgba(192, 132, 252, 0.07)",
    border: "rgba(192, 132, 252, 0.25)",
    mono: false,
    icon: <WebPushIcon />,
  },
  {
    name: "RFC 3986",
    tag: "#k= Fragment",
    color: "#FCD34D",
    bg: "rgba(252, 211, 77, 0.07)",
    border: "rgba(252, 211, 77, 0.25)",
    mono: true,
    icon: <Rfc3986Icon />,
  },
  {
    name: "MIT License",
    tag: "Open Source",
    color: "#CBD5E1",
    bg: "rgba(203, 213, 225, 0.07)",
    border: "rgba(203, 213, 225, 0.25)",
    mono: false,
    icon: <MitLicenseIcon />,
  },
];

export const TrustBar = memo(function TrustBar() {
  const [isManualPaused, setIsManualPaused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const isPaused = isManualPaused || isHovered;

  return (
    <section aria-label="Technology Stack and Security Standards" className="relative border-y border-slate-800/80 bg-slate-950/80 py-6 backdrop-blur-xl overflow-hidden">
      {/* Subtle radial center ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* Section Header Badge */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className={`h-1.5 w-1.5 rounded-full ${isPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 select-none">
          Built with &amp; Powered by
        </span>
        <button
          type="button"
          onClick={() => setIsManualPaused((prev) => !prev)}
          className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/30 transition cursor-pointer"
          title="Click to toggle manual pause"
        >
          {isManualPaused ? "▶ Resume" : isHovered ? "⏸ Hover Paused" : "⏸ Pause"}
        </button>
      </div>

      {/* Infinite Seamless Scrolling Marquee with Hover-to-Pause and Leave-to-Resume */}
      <div
        className="relative overflow-hidden w-full select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Hover to pause ticker, move cursor away to resume"
      >
        {/* Left & Right gradient fade masks for high-end look */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

        <style>{`
          @keyframes infiniteScroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .trust-marquee {
            display: flex;
            gap: 12px;
            width: max-content;
            animation: infiniteScroll 72s linear infinite;
            will-change: transform;
          }
          .trust-marquee.paused {
            animation-play-state: paused !important;
          }
        `}</style>

        <div className={`trust-marquee ${isPaused ? "paused" : ""}`} role="list">
          {[...TECH_STACK, ...TECH_STACK].map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              role="listitem"
              className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 border transition-all duration-200 hover:scale-105 hover:brightness-125 cursor-default shrink-0 select-none backdrop-blur-md shadow-sm group"
              style={{
                backgroundColor: item.bg,
                borderColor: item.border,
                color: item.color,
              }}
              title={`${item.name} (${item.tag || "Core Tech"})`}
            >
              <span className="flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              <span className={`text-xs font-semibold whitespace-nowrap ${item.mono ? "font-mono" : ""}`}>
                {item.name}
              </span>
              {item.tag && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
