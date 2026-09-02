"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  Lock,
  Link as LinkIcon,
  Cloud,
  Share2,
  Eye,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Shield,
} from "lucide-react";

interface Step {
  num: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  title: string;
  detail: string;
  code: string;
  codeColor: string;
  tag: string;
  who: "owner" | "viewer" | "server";
}

const STEPS: Step[] = [
  {
    num: 1,
    icon: Upload,
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.1)",
    title: "Drag & Drop PDF",
    detail: "You drop a PDF into BlindShare. The browser reads it as an ArrayBuffer using the File API — completely local, no upload yet.",
    code: "const buf = await file.arrayBuffer(); // local only",
    codeColor: "#fbbf24",
    tag: "Client Browser",
    who: "owner",
  },
  {
    num: 2,
    icon: Lock,
    color: "#a78bfa",
    bgColor: "rgba(167,139,250,0.1)",
    title: "AES-GCM-256 Encryption",
    detail: "WebCrypto API generates a cryptographically random 256-bit DocKey + 96-bit IV. Your PDF bytes are encrypted into ciphertext in-memory. Server sees nothing.",
    code: "const key = await crypto.subtle.generateKey(\n  {name:'AES-GCM',length:256}, true, ['encrypt']);\nconst ct = await crypto.subtle.encrypt(\n  {name:'AES-GCM',iv}, key, buf);",
    codeColor: "#c4b5fd",
    tag: "Zero-Knowledge",
    who: "owner",
  },
  {
    num: 3,
    icon: LinkIcon,
    color: "#60a5fa",
    bgColor: "rgba(96,165,250,0.1)",
    title: "Fragment Key (#k=...)",
    detail: "The DocKey is base64url-encoded and placed in the URL fragment. Per RFC 3986, browsers NEVER transmit fragments in HTTP requests. The server is cryptographically blind.",
    code: "// Fragment never sent to server!\nconst url = `/v/${code}#k=${base64url(rawKey)}`;\n// RFC 3986 §3.5 — fragment is client-only",
    codeColor: "#93c5fd",
    tag: "RFC 3986",
    who: "owner",
  },
  {
    num: 4,
    icon: Cloud,
    color: "#34d399",
    bgColor: "rgba(52,211,153,0.1)",
    title: "Upload Only Ciphertext",
    detail: "Only the encrypted ciphertext is uploaded to Backblaze B2 / Supabase / S3. The server stores random bytes — even a compromised server cannot read your document.",
    code: "// Server stores ONLY this:\nPOST /api/upload { ciphertext: <ArrayBuffer> }\n// DocKey stays in URL fragment — never here",
    codeColor: "#6ee7b7",
    tag: "Server Blind Courier",
    who: "server",
  },
  {
    num: 5,
    icon: Share2,
    color: "#fb923c",
    bgColor: "rgba(251,146,60,0.1)",
    title: "Share the Link",
    detail: "You send the full URL (with #k=...) to your investor or client. BlindShare can enforce email gate, password, expiry date, and max-view count before access is granted.",
    code: "https://blind-share.vercel.app/v/xK92pQ\n  #k=AES256_DocKey_base64url_here\n// + email gate + expiry + view limit",
    codeColor: "#fdba74",
    tag: "Access Control",
    who: "owner",
  },
  {
    num: 6,
    icon: Eye,
    color: "#e879f9",
    bgColor: "rgba(232,121,249,0.1)",
    title: "Viewer Decrypts In-Browser",
    detail: "The viewer's browser reads #k= from the URL, fetches the ciphertext from the server, and decrypts it locally using WebCrypto. PDF.js renders it with a live forensic watermark overlay.",
    code: "const rawKey = base64url.decode(location.hash.slice(3));\nconst key = await importKey(rawKey);\nconst pdf = await decrypt(ciphertext, key, iv);\n// → Rendered by PDF.js + watermark overlay",
    codeColor: "#f0abfc",
    tag: "In-Browser Decrypt",
    who: "viewer",
  },
  {
    num: 7,
    icon: BarChart3,
    color: "#10b981",
    bgColor: "rgba(16,185,129,0.1)",
    title: "Real-Time Analytics Fire",
    detail: "Every 10 seconds, buffered dwell-time heartbeats are sent per page. BlindShare tracks page-by-page reading time, scroll depth, completion %, and sends you a Web Push the moment someone opens your link.",
    code: "// Heartbeat every 10s per page:\nPOST /api/heartbeat { page: 3, dwell_ms: 42000 }\n// → Your dashboard shows sparklines instantly",
    codeColor: "#6ee7b7",
    tag: "Deep Analytics",
    who: "viewer",
  },
];

const WHO_COLORS = {
  owner:  { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#fbbf24", label: "You (Owner)" },
  viewer: { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)",  text: "#93c5fd", label: "Viewer"       },
  server: { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.3)",  text: "#6ee7b7", label: "Server"       },
};

function StepCard({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});
  const [hov, setHov] = useState(false);
  const Icon = step.icon;
  const who = WHO_COLORS[step.who];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    setTiltStyle({
      transform: `perspective(700px) rotateX(${-y * 10}deg) rotateY(${x * 12}deg) translateZ(8px) scale(1.01)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({ transform: "perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)" });
    setHov(false);
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`,
      }}
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setHov(true)}
        style={{
          borderRadius: 20,
          border: `1px solid ${hov ? step.color + "44" : "rgba(51,65,85,0.45)"}`,
          background: hov
            ? `radial-gradient(circle at 30% 20%, ${step.color}10, rgba(12,18,38,0.95))`
            : "rgba(12,18,38,0.9)",
          backdropFilter: "blur(20px)",
          padding: 24,
          cursor: "default",
          transition: "border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease",
          boxShadow: hov
            ? `0 24px 48px -8px ${step.color}20, 0 0 0 1px ${step.color}25, inset 0 1px 0 rgba(255,255,255,0.05)`
            : "0 4px 20px rgba(0,0,0,0.3)",
          transformStyle: "preserve-3d",
          ...tiltStyle,
        }}
      >
        {/* Top row: number + who badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Step circle */}
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: step.bgColor, border: `1px solid ${step.color}35`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              transform: hov ? "scale(1.12) rotate(6deg)" : "scale(1)",
              boxShadow: hov ? `0 0 16px ${step.color}40` : "none",
            }}>
              <Icon style={{ width: 18, height: 18, color: step.color }} />
            </div>
            {/* Step number */}
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
              color: step.color, opacity: 0.7, textTransform: "uppercase",
            }}>
              Step {step.num} of {STEPS.length}
            </span>
          </div>
          {/* Who badge */}
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            borderRadius: 999, padding: "3px 10px",
            background: who.bg, border: `1px solid ${who.border}`, color: who.text,
          }}>
            {who.label}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 16, fontWeight: 800, color: "#f8fafc",
          letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.3,
        }}>
          {step.title}
        </h3>

        {/* Detail */}
        <p style={{
          fontSize: 12.5, color: "#94a3b8", lineHeight: 1.65, marginBottom: 16,
        }}>
          {step.detail}
        </p>

        {/* Code block */}
        <div style={{
          borderRadius: 12,
          background: "rgba(8,14,26,0.9)",
          border: `1px solid rgba(51,65,85,0.5)`,
          padding: "12px 14px",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 10.5,
          color: step.codeColor,
          lineHeight: 1.7,
          whiteSpace: "pre",
          overflowX: "auto",
          position: "relative",
        }}>
          {/* Tag */}
          <span style={{
            position: "absolute", top: 8, right: 10,
            fontSize: 9, fontWeight: 700, color: step.color,
            background: step.bgColor, border: `1px solid ${step.color}30`,
            borderRadius: 6, padding: "2px 8px",
          }}>
            {step.tag}
          </span>
          {step.code}
        </div>
      </div>
    </div>
  );
}

export function WorkflowTimeline() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVis, setHeaderVis] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setHeaderVis(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="workflow"
      style={{
        padding: "100px 16px",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid rgba(30,41,59,0.8)",
      }}
    >
      {/* Background orbs */}
      <div style={{
        position: "absolute", top: "10%", left: "-5%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,139,250,0.07), transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "5%", right: "-5%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div
          ref={headerRef}
          style={{
            textAlign: "center", marginBottom: 72,
            opacity: headerVis ? 1 : 0,
            transform: headerVis ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.65s ease, transform 0.65s ease",
          }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            borderRadius: 999, border: "1px solid rgba(96,165,250,0.3)",
            background: "rgba(96,165,250,0.08)", padding: "6px 18px",
            fontSize: 11, fontWeight: 700, color: "#93c5fd",
            marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <Shield style={{ width: 12, height: 12 }} />
            Complete Workflow
          </div>

          <h2 style={{
            fontSize: "clamp(26px, 4.5vw, 42px)",
            fontWeight: 900, color: "#f8fafc",
            letterSpacing: "-0.03em", lineHeight: 1.15,
            margin: "0 0 16px",
          }}>
            How BlindShare Works —{" "}
            <span style={{
              background: "linear-gradient(135deg,#f59e0b 0%,#fde68a 50%,#f59e0b 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Step by Step
            </span>
          </h2>
          <p style={{
            fontSize: 14, color: "#64748b", maxWidth: 560, margin: "0 auto",
            lineHeight: 1.7,
          }}>
            From drag-drop to real-time analytics — every step happens in your browser first.
            The server is a blind courier that never reads your documents.
          </p>

          {/* Legend */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 20, marginTop: 28, flexWrap: "wrap",
          }}>
            {Object.entries(WHO_COLORS).map(([key, val]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: val.text, boxShadow: `0 0 6px ${val.text}`,
                }} />
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{val.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps — 2-col grid on desktop, 1-col on mobile */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 480px), 1fr))",
          gap: 20,
        }}>
          {STEPS.map((step, i) => (
            <StepCard key={step.num} step={step} index={i} />
          ))}
        </div>

        {/* End badge */}
        <div style={{
          textAlign: "center", marginTop: 56,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            borderRadius: 999, border: "1px solid rgba(16,185,129,0.35)",
            background: "rgba(16,185,129,0.08)", padding: "10px 24px",
            fontSize: 13, fontWeight: 700, color: "#34d399",
          }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            Server never sees your DocKey — guaranteed by cryptography, not policy.
          </div>
        </div>
      </div>
    </section>
  );
}
