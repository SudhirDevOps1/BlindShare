"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Shield, Zap, CheckCircle2 } from "lucide-react";

const CHECKLIST = [
  "AES-GCM-256 client-side encryption",
  "Fragment key — server never sees DocKey",
  "Per-page dwell analytics & sparklines",
  "Dynamic forensic watermark overlay",
  "Email gate, expiry & view limits",
  "₹0 free tier — 3 hosting presets",
];

export function CTABanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ padding: "100px 16px", position: "relative", overflow: "hidden" }}>
      {/* Layered BG */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(9,15,28,1) 0%, rgba(12,18,40,1) 50%, rgba(8,13,24,1) 100%)",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 700, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.4),transparent)",
        zIndex: 1,
      }} />
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, opacity: 0.025,
        backgroundImage: "linear-gradient(rgba(248,250,252,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(248,250,252,0.4) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      <div
        ref={ref}
        style={{
          position: "relative", zIndex: 1,
          maxWidth: 960, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr auto",
          gap: 56, alignItems: "center",
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(36px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
        className="cta-banner-grid"
      >
        <style>{`
          @media (max-width: 768px) {
            .cta-banner-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* Left */}
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            borderRadius: 999, border: "1px solid rgba(245,158,11,0.3)",
            background: "rgba(245,158,11,0.08)", padding: "6px 16px",
            fontSize: 11, fontWeight: 700, color: "#fbbf24",
            marginBottom: 24, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <Zap style={{ width: 12, height: 12 }} /> Free Forever
          </div>

          <h2 style={{
            fontSize: "clamp(28px, 4.5vw, 44px)",
            fontWeight: 900, color: "#f8fafc",
            letterSpacing: "-0.03em", lineHeight: 1.1,
            margin: "0 0 16px",
          }}>
            Start Sharing Securely
            <br />
            <span style={{
              background: "linear-gradient(135deg,#f59e0b,#fde68a,#f59e0b)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              In Under 60 Seconds.
            </span>
          </h2>

          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
            No credit card. No vendor lock-in. No plaintext on the server.
            BlindShare is MIT open-source — self-host for free or deploy to Vercel in one click.
          </p>

          {/* Checklist */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", marginBottom: 36 }}>
            {CHECKLIST.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <CheckCircle2 style={{ width: 14, height: 14, color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                borderRadius: 14, padding: "14px 28px",
                background: "linear-gradient(135deg,#f59e0b,#d97706)",
                color: "#1e293b", fontSize: 14, fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 8px 32px rgba(245,158,11,0.35), 0 0 0 1px rgba(245,158,11,0.2)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.01)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(245,158,11,0.45), 0 0 0 1px rgba(245,158,11,0.3)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(245,158,11,0.35), 0 0 0 1px rgba(245,158,11,0.2)";
              }}
            >
              <Lock style={{ width: 16, height: 16 }} />
              Get Started Free
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>

            <a
              href="https://github.com/SudhirDevOps1/BlindShare"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                borderRadius: 14, padding: "14px 24px",
                border: "1px solid rgba(51,65,85,0.7)",
                background: "rgba(15,23,42,0.7)",
                color: "#94a3b8", fontSize: 14, fontWeight: 600,
                textDecoration: "none", backdropFilter: "blur(8px)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,116,139,0.7)";
                (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(51,65,85,0.7)";
                (e.currentTarget as HTMLElement).style.color = "#94a3b8";
              }}
            >
              ⭐ Star on GitHub
            </a>
          </div>
        </div>

        {/* Right — Security badge card */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 220,
            borderRadius: 24,
            border: "1px solid rgba(245,158,11,0.2)",
            background: "linear-gradient(160deg,rgba(20,30,50,0.95),rgba(10,15,28,0.98))",
            backdropFilter: "blur(24px)",
            padding: "32px 24px",
            textAlign: "center",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
            {/* Shield icon with glow */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "radial-gradient(circle,rgba(245,158,11,0.2),rgba(245,158,11,0.05))",
              border: "1px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 0 32px rgba(245,158,11,0.2)",
              animation: "glowPulse 2.8s ease-in-out infinite",
            }}>
              <Shield style={{ width: 28, height: 28, color: "#f59e0b" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", marginBottom: 6 }}>
              Zero-Knowledge
            </div>
            <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
              Cryptographically guaranteed.<br />
              Not a marketing promise.
            </div>
            {[
              { label: "Encryption", value: "AES-GCM-256", color: "#fbbf24" },
              { label: "Key Derive", value: "PBKDF2 250k", color: "#a78bfa" },
              { label: "Fragment",   value: "RFC 3986",    color: "#34d399" },
            ].map((row) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid rgba(30,41,59,0.8)",
              }}>
                <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: row.color, fontFamily: "monospace" }}>{row.value}</span>
              </div>
            ))}
            <div style={{
              marginTop: 16, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              color: "#10b981", textTransform: "uppercase",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", display: "inline-block" }} />
              20 / 20 Security Tests Passing
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
