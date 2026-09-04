"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

interface SonarPing {
  id: number;
  x: number;
  y: number;
}

// Granular cryptographic fragment definitions
const FRAGMENT_DEFS = [
  { gen: (i: number) => `#k=aes256_gcm_${((i * 1337) % 9999).toString(16)}`, color: "text-amber-400/50" },
  { gen: () => "•", color: "text-slate-600/60" },
  { gen: () => "PBKDF2_100K", color: "text-emerald-400/50" },
  { gen: () => "•", color: "text-slate-600/60" },
  { gen: () => "ZERO_KNOWLEDGE_COURIER", color: "text-blue-400/45" },
  { gen: () => "•", color: "text-slate-600/60" },
  { gen: () => "RFC3986_FRAGMENT", color: "text-amber-300/50" },
  { gen: () => "•", color: "text-slate-600/60" },
  { gen: () => "CLIENT_SIDE_RAM", color: "text-emerald-300/45" },
  { gen: () => "•", color: "text-slate-600/60" },
  { gen: () => "DUCKDB_TELEMETRY", color: "text-indigo-400/45" },
  { gen: () => "•", color: "text-slate-600/60" },
  { gen: () => "AES_GCM_256", color: "text-cyan-400/45" },
  { gen: () => "•", color: "text-slate-600/60" },
  { gen: () => "ZERO_PII_VAULT", color: "text-amber-400/45" },
  { gen: () => "•", color: "text-slate-600/60" },
];

// Precomputed 1400 granular tokens to densely fill entire screen wall-to-wall up to 4K displays
const CIPHER_STREAM = Array.from({ length: 1400 }).map((_, i) => {
  const def = FRAGMENT_DEFS[i % FRAGMENT_DEFS.length];
  return {
    id: i,
    text: def.gen(i),
    color: def.color,
  };
});

function TuxCyberPet({ isHovering }: { isHovering: boolean }) {
  return (
    <div className="relative select-none pointer-events-none">
      <svg
        viewBox="0 0 36 42"
        className={`w-7 h-8 transition-transform duration-200 ${
          isHovering
            ? "scale-110 drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
            : "scale-100 drop-shadow-[0_2px_5px_rgba(16,185,129,0.2)]"
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Ion Thruster Plasma Flame under feet */}
        <ellipse
          cx="18"
          cy="39"
          rx="4.5"
          ry="1.5"
          fill={isHovering ? "rgba(245,158,11,0.45)" : "rgba(56,189,248,0.35)"}
          className="animate-pulse"
        />

        {/* Penguin Little Cyber Feet */}
        <ellipse cx="12" cy="36" rx="3.5" ry="1.8" fill="#F59E0B" />
        <ellipse cx="24" cy="36" rx="3.5" ry="1.8" fill="#F59E0B" />

        {/* Penguin Main Body (Obsidian Cyber Chassis) */}
        <ellipse cx="18" cy="21" rx="13" ry="15" fill="#0F172A" stroke="#334155" strokeWidth="1" />

        {/* Left Flipper / Wing (Flapping) */}
        <path
          d="M6 16 C3 20, 2 26, 6 29 C7 29, 8 26, 8 22 Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="0.75"
          style={{
            transformOrigin: "6px 16px",
            animation: isHovering
              ? "tuxWingLeft 0.25s ease-in-out infinite alternate"
              : "tuxWingLeft 0.65s ease-in-out infinite alternate",
          }}
        />

        {/* Right Flipper / Wing (Flapping) */}
        <path
          d="M30 16 C33 20, 34 26, 30 29 C29 29, 28 26, 28 22 Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="0.75"
          style={{
            transformOrigin: "30px 16px",
            animation: isHovering
              ? "tuxWingRight 0.25s ease-in-out infinite alternate"
              : "tuxWingRight 0.65s ease-in-out infinite alternate",
          }}
        />

        {/* Classic Tux White Tummy Plate */}
        <ellipse cx="18" cy="23" rx="8.5" ry="11" fill="#F8FAFC" />

        {/* ZK Cyber Emblem on Tummy */}
        <path
          d="M16 23 L20 23 L20 26 C20 27.5, 16 27.5, 16 26 Z"
          fill="#F59E0B"
          opacity="0.85"
        />
        <circle
          cx="18"
          cy="21.5"
          r="1.5"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="0.8"
          opacity="0.85"
        />

        {/* Cute Beak */}
        <polygon points="15.5,14 20.5,14 18,17.5" fill="#F59E0B" />

        {/* Eyes (Cute Digital LED Visor Eyes) */}
        {isHovering ? (
          <>
            <circle cx="14" cy="11" r="2.2" fill="#020617" />
            <circle cx="14" cy="11" r="1.2" fill="#F59E0B" className="animate-pulse" />
            <circle cx="22" cy="11" r="2.2" fill="#020617" />
            <circle cx="22" cy="11" r="1.2" fill="#F59E0B" className="animate-pulse" />
          </>
        ) : (
          <>
            <ellipse cx="14" cy="11.5" rx="2" ry="2.6" fill="#020617" />
            <circle cx="14.5" cy="11" r="1" fill="#38BDF8" />
            <ellipse cx="22" cy="11.5" rx="2" ry="2.6" fill="#020617" />
            <circle cx="21.5" cy="11" r="1" fill="#38BDF8" />
          </>
        )}

        {/* Cute Head Cyber Antenna with Soft LED Beacon */}
        <line x1="18" y1="6" x2="18" y2="2.5" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
        <circle
          cx="18"
          cy="2"
          r="1.2"
          fill={isHovering ? "#F59E0B" : "#10B981"}
          className="animate-ping"
        />
      </svg>
    </div>
  );
}

export function CryptoCursor() {
  const pathname = usePathname();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(true);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState<boolean>(false);
  const [sonarPings, setSonarPings] = useState<SonarPing[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Check whether cursor is enabled: ON by default in showcase/public, OFF by default in dashboard/admin
  useEffect(() => {
    if (typeof window === "undefined") return;

    const evaluateEnabled = () => {
      const isDashboardRoute =
        pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");
      if (isDashboardRoute) {
        // In dashboard app: OFF by default, ON if explicitly enabled by user
        const pref = localStorage.getItem("blindshare_crypto_cursor_dashboard");
        setIsEnabled(pref === "true");
      } else {
        // In showcase / public landing: ON by default, OFF if explicitly disabled by user
        const pref = localStorage.getItem("blindshare_crypto_cursor_public");
        setIsEnabled(pref !== "false");
      }
    };

    evaluateEnabled();

    const handleToggle = () => evaluateEnabled();
    window.addEventListener("blindshare-cursor-toggle", handleToggle);
    window.addEventListener("storage", handleToggle);

    return () => {
      window.removeEventListener("blindshare-cursor-toggle", handleToggle);
      window.removeEventListener("storage", handleToggle);
    };
  }, [pathname]);

  // High-performance mutable coordinates in refs to prevent React re-renders on mousemove
  const coordsRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -500,
    y: -500,
    active: false,
  });
  const lerpRef = useRef<{ x: number; y: number }>({ x: -500, y: -500 });
  const isHoveringRef = useRef<boolean>(false);

  // Direct element references for 60-144 FPS hardware-accelerated transforms
  const laserDotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const petRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const matrixSpotlightRef = useRef<HTMLDivElement>(null);

  // Detect touch screens or coarse pointers to disable custom cursor
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkTouch = () => {
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setIsTouchDevice(isCoarse || hasTouch || reducedMotion);
    };
    checkTouch();
  }, []);

  // Synchronize hovering state to ref for animation frame loop
  useEffect(() => {
    isHoveringRef.current = isHoveringInteractive;
  }, [isHoveringInteractive]);

  // Ultra-smooth 60-144 FPS hardware-accelerated RAF animation loop
  useEffect(() => {
    if (isTouchDevice || !isEnabled) return;
    let animationFrameId: number;

    const animate = () => {
      const target = coordsRef.current;
      if (target.active) {
        // Lerp damping calculation: targetX + (mouseX - targetX) * 0.22
        const dx = target.x - lerpRef.current.x;
        const dy = target.y - lerpRef.current.y;
        lerpRef.current.x += dx * 0.22;
        lerpRef.current.y += dy * 0.22;

        const lx = lerpRef.current.x;
        const ly = lerpRef.current.y;
        const tx = target.x;
        const ty = target.y;

        // 1. Zero-latency center laser dot (instant)
        if (laserDotRef.current) {
          laserDotRef.current.style.transform = `translate3d(${tx - 2.5}px, ${ty - 2.5}px, 0)`;
        }

        // 2. Inertia laser halo with magnetic scale
        if (haloRef.current) {
          const scale = isHoveringRef.current ? 1.3 : 1.0;
          haloRef.current.style.transform = `translate3d(${lx - 14}px, ${ly - 14}px, 0) scale(${scale})`;
        }

        // 3. Cute Tux Cyber Pet Companion floating alongside with organic levitation
        if (petRef.current) {
          const hoverBob = Math.sin(Date.now() / 280) * 3;
          petRef.current.style.transform = `translate3d(${lx + 16}px, ${ly - 16 + hoverBob}px, 0)`;
        }

        // 4. Soft ambient spotlight beam
        if (spotlightRef.current) {
          spotlightRef.current.style.transform = `translate3d(${tx - 240}px, ${ty - 240}px, 0)`;
        }

        // 5. Active spotlight mask over the cipher matrix
        if (matrixSpotlightRef.current) {
          const mask = `radial-gradient(460px circle at ${tx}px ${ty}px, black 20%, transparent 85%)`;
          matrixSpotlightRef.current.style.webkitMaskImage = mask;
          matrixSpotlightRef.current.style.maskImage = mask;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isTouchDevice, isEnabled]);

  // Passive window listeners for mouse tracking & clicks
  useEffect(() => {
    if (isTouchDevice || !isEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      coordsRef.current = { x: e.clientX, y: e.clientY, active: true };
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      const isInteractive = !!target?.closest(
        "button, a, input, select, textarea, [role='button'], .cursor-pointer, [data-interactive='true']"
      );
      setIsHoveringInteractive(isInteractive);
    };

    const handleMouseLeave = () => {
      coordsRef.current.active = false;
      setIsVisible(false);
      setIsHoveringInteractive(false);
      if (matrixSpotlightRef.current) {
        const mask = `radial-gradient(460px circle at -500px -500px, black 20%, transparent 85%)`;
        matrixSpotlightRef.current.style.webkitMaskImage = mask;
        matrixSpotlightRef.current.style.maskImage = mask;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const pingId = Date.now();
      setSonarPings((prev) => [...prev.slice(-4), { id: pingId, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setSonarPings((prev) => prev.filter((p) => p.id !== pingId));
      }, 550);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
    };
  }, [isTouchDevice, isVisible, isEnabled]);

  if (isTouchDevice || !isVisible || !isEnabled) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes tuxWingLeft {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-22deg); }
        }
        @keyframes tuxWingRight {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(22deg); }
        }
      `}</style>

      {/* ── 1. Full-Screen Continuous Ambient Watermark Matrix (Across ENTIRE Screen, Soft Dim Glow) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[34] select-none overflow-hidden opacity-[0.14] mix-blend-screen"
      >
        <div className="absolute inset-0 p-5 font-mono text-[10px] font-bold uppercase tracking-widest leading-loose select-none overflow-hidden break-words text-justify">
          {CIPHER_STREAM.map((item) => (
            <span key={`amb-${item.id}`} className={`${item.color} mr-2.5 inline-block`}>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* ── 2. Interactive Spotlight Illumination Layer (Brightens Softly around Cursor) ── */}
      <div
        ref={matrixSpotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[35] select-none overflow-hidden mix-blend-screen opacity-[0.55]"
        style={{
          WebkitMaskImage: `radial-gradient(460px circle at -500px -500px, black 20%, transparent 85%)`,
          maskImage: `radial-gradient(460px circle at -500px -500px, black 20%, transparent 85%)`,
        }}
      >
        <div className="absolute inset-0 p-5 font-mono text-[10px] font-bold uppercase tracking-widest leading-loose select-none overflow-hidden break-words text-justify">
          {CIPHER_STREAM.map((item) => (
            <span key={`spot-${item.id}`} className={`${item.color} mr-2.5 inline-block`}>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. Soft Ambient Radial Beam (Subtle Glow, Not Blinding) ── */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99990] w-[480px] h-[480px] rounded-full will-change-transform opacity-60 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.04) 0%, rgba(59, 130, 246, 0.015) 45%, transparent 75%)",
        }}
      />

      {/* ── 4. Cryptographic Overlays & Tux Cyber-Pet (No Text, Soft Luminescence) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
      >
        {/* Soft Inertia Halo Ring */}
        <div
          ref={haloRef}
          className={`absolute top-0 left-0 w-7 h-7 rounded-full border transition-colors duration-150 flex items-center justify-center will-change-transform ${
            isHoveringInteractive
              ? "border-amber-400/80 bg-amber-400/10 shadow-[0_0_16px_rgba(245,158,11,0.4)]"
              : "border-amber-500/40 bg-amber-500/5 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
          }`}
        >
          {/* Subtle Precision Crosshair Notches on Halo */}
          <div className="absolute top-0 w-0.5 h-1 bg-amber-400/70" />
          <div className="absolute bottom-0 w-0.5 h-1 bg-amber-400/70" />
          <div className="absolute left-0 h-0.5 w-1 bg-amber-400/70" />
          <div className="absolute right-0 h-0.5 w-1 bg-amber-400/70" />
        </div>

        {/* Precision Laser Center Micro-Dot */}
        <div
          ref={laserDotRef}
          className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] will-change-transform"
        />

        {/* Cute Linux Tux Cyber-Pet Companion (Animated, Compact, No Text) */}
        <div
          ref={petRef}
          className="absolute top-0 left-0 will-change-transform pointer-events-none"
        >
          <TuxCyberPet isHovering={isHoveringInteractive} />
        </div>

        {/* Click Sonar Ping Waves */}
        {sonarPings.map((ping) => (
          <div
            key={ping.id}
            className="absolute rounded-full border border-amber-400/70 bg-amber-400/15 pointer-events-none animate-ping"
            style={{
              left: `${ping.x - 26}px`,
              top: `${ping.y - 26}px`,
              width: "52px",
              height: "52px",
              animationDuration: "0.55s",
            }}
          />
        ))}
      </div>
    </>
  );
}


