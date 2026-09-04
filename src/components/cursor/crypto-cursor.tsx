"use client";

import React, { useEffect, useState, useRef } from "react";
import { useI18n } from "@/lib/i18n/context";

interface SonarPing {
  id: number;
  x: number;
  y: number;
}

// Granular cryptographic fragment definitions
const FRAGMENT_DEFS = [
  { gen: (i: number) => `#k=aes256_gcm_${((i * 1337) % 9999).toString(16)}`, color: "text-amber-300/55" },
  { gen: () => "•", color: "text-slate-600/70" },
  { gen: () => "PBKDF2_100K", color: "text-emerald-400/55" },
  { gen: () => "•", color: "text-slate-600/70" },
  { gen: () => "ZERO_KNOWLEDGE_COURIER", color: "text-blue-400/50" },
  { gen: () => "•", color: "text-slate-600/70" },
  { gen: () => "RFC3986_FRAGMENT", color: "text-amber-400/55" },
  { gen: () => "•", color: "text-slate-600/70" },
  { gen: () => "CLIENT_SIDE_RAM", color: "text-emerald-300/50" },
  { gen: () => "•", color: "text-slate-600/70" },
  { gen: () => "DUCKDB_TELEMETRY", color: "text-indigo-400/50" },
  { gen: () => "•", color: "text-slate-600/70" },
  { gen: () => "AES_GCM_256", color: "text-cyan-400/50" },
  { gen: () => "•", color: "text-slate-600/70" },
  { gen: () => "ZERO_PII_VAULT", color: "text-amber-400/50" },
  { gen: () => "•", color: "text-slate-600/70" },
];

// Precomputed 1200 granular tokens to densely fill entire screen wall-to-wall up to 4K displays
const CIPHER_STREAM = Array.from({ length: 1200 }).map((_, i) => {
  const def = FRAGMENT_DEFS[i % FRAGMENT_DEFS.length];
  return {
    id: i,
    text: def.gen(i),
    color: def.color,
  };
});

export function CryptoCursor() {
  const { t } = useI18n();
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(true);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState<boolean>(false);
  const [sonarPings, setSonarPings] = useState<SonarPing[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false);

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
  const matrixRef = useRef<HTMLDivElement>(null);

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
    if (isTouchDevice) return;
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
          laserDotRef.current.style.transform = `translate3d(${tx - 3}px, ${ty - 3}px, 0)`;
        }

        // 2. Inertia laser halo with magnetic scale
        if (haloRef.current) {
          const scale = isHoveringRef.current ? 1.35 : 1.0;
          haloRef.current.style.transform = `translate3d(${lx - 16}px, ${ly - 16}px, 0) scale(${scale})`;
        }

        // 3. Cyber Robot Pet Companion floating alongside with organic levitation
        if (petRef.current) {
          const hoverBob = Math.sin(Date.now() / 260) * 3.5;
          petRef.current.style.transform = `translate3d(${lx + 24}px, ${ly - 18 + hoverBob}px, 0)`;
        }

        // 4. Ambient cipher spotlight beam
        if (spotlightRef.current) {
          spotlightRef.current.style.transform = `translate3d(${tx - 260}px, ${ty - 260}px, 0)`;
        }

        // 5. Global Zero-Knowledge Cipher Spotlight Watermark Matrix mask
        if (matrixRef.current) {
          const mask = `radial-gradient(420px circle at ${tx}px ${ty}px, black 25%, transparent 85%)`;
          matrixRef.current.style.webkitMaskImage = mask;
          matrixRef.current.style.maskImage = mask;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isTouchDevice]);

  // Passive window listeners for mouse tracking & clicks
  useEffect(() => {
    if (isTouchDevice) return;

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
      if (matrixRef.current) {
        const mask = `radial-gradient(420px circle at -500px -500px, black 25%, transparent 85%)`;
        matrixRef.current.style.webkitMaskImage = mask;
        matrixRef.current.style.maskImage = mask;
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
  }, [isTouchDevice, isVisible]);

  if (isTouchDevice || !isVisible) {
    return null;
  }

  const petNormalText =
    t.architectureShowcase?.cursor?.petStatusNormal || "B-Bot • ZK-SECURE";
  const petInspectText =
    t.architectureShowcase?.cursor?.petStatusInspect || "B-Bot • SCANNING...";

  return (
    <>
      {/* Option 2: Global Full-Screen Zero-Knowledge Cipher Spotlight Matrix */}
      <div
        ref={matrixRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[35] select-none overflow-hidden mix-blend-screen opacity-80"
        style={{
          WebkitMaskImage: `radial-gradient(420px circle at -500px -500px, black 25%, transparent 85%)`,
          maskImage: `radial-gradient(420px circle at -500px -500px, black 25%, transparent 85%)`,
        }}
      >
        {/* Continuous Fluid Typography Grid Covering 100vw × 100vh with Zero Empty Margins */}
        <div className="absolute inset-0 p-5 font-mono text-[10.5px] font-bold uppercase tracking-widest leading-loose select-none overflow-hidden break-words text-justify">
          {CIPHER_STREAM.map((item) => (
            <span key={item.id} className={`${item.color} mr-2 inline-block`}>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Ambient Radial Spotlight Beam (Global) */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99990] w-[520px] h-[520px] rounded-full will-change-transform opacity-75 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.055) 0%, rgba(59, 130, 246, 0.025) 45%, transparent 75%)",
        }}
      />

      {/* Option 1: Cryptographic Laser Pointer & Cyber Robot Pet Companion Overlays */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
      >
        {/* 1. Inertia Laser Halo Circle trailing pointer */}
        <div
          ref={haloRef}
          className={`absolute top-0 left-0 w-8 h-8 rounded-full border transition-colors duration-150 flex items-center justify-center will-change-transform ${
            isHoveringInteractive
              ? "border-amber-400 bg-amber-400/15 shadow-[0_0_24px_rgba(245,158,11,0.65)]"
              : "border-amber-500/50 bg-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
          }`}
        >
          {/* Subtle Precision Crosshair Notches on Halo */}
          <div className="absolute top-0 w-0.5 h-1 bg-amber-400/80" />
          <div className="absolute bottom-0 w-0.5 h-1 bg-amber-400/80" />
          <div className="absolute left-0 h-0.5 w-1 bg-amber-400/80" />
          <div className="absolute right-0 h-0.5 w-1 bg-amber-400/80" />
        </div>

        {/* 2. Precision Laser Center Dot (0-latency tracking) */}
        <div
          ref={laserDotRef}
          className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b,0_0_14px_#f59e0b] will-change-transform"
        />

        {/* 3. Cyber Robot Pet Companion Drone ("B-Bot") */}
        <div
          ref={petRef}
          className="absolute top-0 left-0 flex items-center gap-2 will-change-transform"
        >
          {/* Robot Droid Chassis */}
          <div
            className={`relative flex flex-col items-center justify-center w-7 h-7 rounded-xl border transition-all duration-200 backdrop-blur-md shadow-lg ${
              isHoveringInteractive
                ? "bg-slate-950/95 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.6)] scale-110"
                : "bg-slate-950/90 border-slate-700/80 shadow-[0_0_10px_rgba(16,185,129,0.3)] scale-100"
            }`}
          >
            {/* Robot Antenna with Blinking LED Beacon */}
            <div className="absolute -top-2 flex flex-col items-center">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isHoveringInteractive
                    ? "bg-amber-400 animate-ping shadow-[0_0_8px_#f59e0b]"
                    : "bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]"
                }`}
              />
              <div className="w-0.5 h-1 bg-slate-400" />
            </div>

            {/* Robot Dual Cybernetic LED Visor Eyes */}
            <div className="flex items-center gap-1.5 px-1 py-0.5 rounded-md bg-slate-900/90 border border-slate-800">
              <div
                className={`rounded-full transition-all duration-150 ${
                  isHoveringInteractive
                    ? "w-1.5 h-1.5 bg-amber-400 shadow-[0_0_8px_#f59e0b] ring-1 ring-amber-300 animate-pulse"
                    : "w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_6px_#10b981]"
                }`}
              />
              <div
                className={`rounded-full transition-all duration-150 ${
                  isHoveringInteractive
                    ? "w-1.5 h-1.5 bg-amber-400 shadow-[0_0_8px_#f59e0b] ring-1 ring-amber-300 animate-pulse"
                    : "w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_6px_#10b981]"
                }`}
              />
            </div>

            {/* Robot Micro Ion Thruster Flame */}
            <div className="absolute -bottom-1.5 flex justify-center">
              <div
                className={`w-1.5 h-1.5 rounded-b-full blur-[0.5px] animate-pulse ${
                  isHoveringInteractive
                    ? "bg-gradient-to-b from-amber-400 to-transparent h-2"
                    : "bg-gradient-to-b from-cyan-400 to-transparent"
                }`}
              />
            </div>
          </div>

          {/* Robot Dialogue / Status HUD Speech Bubble */}
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9.5px] font-mono font-semibold tracking-wider uppercase transition-all duration-150 backdrop-blur-md shadow-md ${
              isHoveringInteractive
                ? "bg-amber-950/85 border-amber-400/70 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                : "bg-slate-950/80 border-slate-800 text-slate-300"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isHoveringInteractive ? "bg-amber-400 animate-ping" : "bg-emerald-400"
              }`}
            />
            <span>{isHoveringInteractive ? petInspectText : petNormalText}</span>
          </div>
        </div>

        {/* 4. Click Sonar Ping Waves */}
        {sonarPings.map((ping) => (
          <div
            key={ping.id}
            className="absolute rounded-full border border-amber-400 bg-amber-400/20 pointer-events-none animate-ping"
            style={{
              left: `${ping.x - 30}px`,
              top: `${ping.y - 30}px`,
              width: "60px",
              height: "60px",
              animationDuration: "0.55s",
            }}
          />
        ))}
      </div>
    </>
  );
}

