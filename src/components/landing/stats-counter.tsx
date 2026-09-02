"use client";

import React, { useEffect, useRef, useState } from "react";

interface StatItem {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  sub: string;
  color: string;
}

const STATS: StatItem[] = [
  { value: 20,  suffix: "",   label: "Security Tests",     sub: "All passing, CodeQL verified",        color: "#10b981" },
  { value: 256, suffix: "-bit", label: "AES-GCM Key",      sub: "Client-side WebCrypto standard",      color: "#f59e0b" },
  { value: 100, suffix: "%",  label: "Zero-Knowledge",     sub: "Server never sees plaintext",         color: "#a78bfa" },
  { value: 0,   suffix: "",  prefix: "₹", label: "Monthly Cost", sub: "Three free-tier hosting presets", color: "#34d399" },
  { value: 3,   suffix: "",   label: "Free Presets",       sub: "Vercel · Docker · Cloudflare",        color: "#60a5fa" },
];

function useCountUp(target: number, duration = 1600, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ item, started, index }: { item: StatItem; started: boolean; index: number }) {
  const count = useCountUp(item.value, 1400, started);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 20,
        border: `1px solid ${hovered ? item.color + "55" : "rgba(51,65,85,0.5)"}`,
        background: hovered
          ? `radial-gradient(circle at 50% 0%, ${item.color}12, rgba(15,23,42,0.9))`
          : "rgba(15,23,42,0.75)",
        backdropFilter: "blur(16px)",
        padding: "28px 24px",
        textAlign: "center",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? `0 20px 48px -8px ${item.color}25, 0 0 0 1px ${item.color}30`
          : "0 4px 24px rgba(0,0,0,0.3)",
        opacity: 1,
        animationDelay: `${index * 0.12}s`,
      }}
    >
      {/* Glow orb */}
      <div style={{
        width: 48, height: 48, borderRadius: "50%", margin: "0 auto 16px",
        background: `radial-gradient(circle, ${item.color}30, transparent 70%)`,
        border: `1px solid ${item.color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform 0.3s ease",
        transform: hovered ? "scale(1.18) rotate(8deg)" : "scale(1)",
      }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: item.color }}>
          {item.prefix || ""}{count}{item.suffix === "-bit" ? "" : item.suffix}
        </span>
      </div>

      <div style={{
        fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em",
        background: `linear-gradient(135deg, #fff 30%, ${item.color})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        lineHeight: 1, marginBottom: 6,
      }}>
        {item.prefix || ""}{count}{item.suffix}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
        {item.label}
      </div>
      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>
        {item.sub}
      </div>
    </div>
  );
}

export function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ padding: "88px 16px", position: "relative", overflow: "hidden" }}>
      {/* Background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.3),transparent)",
      }} />

      <div
        ref={ref}
        style={{
          maxWidth: 1100, margin: "0 auto",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(32px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            borderRadius: 999, border: "1px solid rgba(245,158,11,0.3)",
            background: "rgba(245,158,11,0.08)", padding: "6px 16px",
            fontSize: 11, fontWeight: 700, color: "#fbbf24",
            marginBottom: 16, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            ⚡ Platform at a Glance
          </div>
          <h2 style={{
            fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#f8fafc",
            letterSpacing: "-0.02em", margin: "0 0 12px",
          }}>
            Built for Security. <span style={{
              background: "linear-gradient(135deg,#f59e0b,#fde68a)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Priced at Zero.</span>
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 480, margin: "0 auto" }}>
            Enterprise-grade cryptography with ₹0 free-tier hosting — no credit card required.
          </p>
        </div>

        {/* Stats grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
        }}>
          {STATS.map((s, i) => (
            <StatCard key={s.label} item={s} started={started} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
