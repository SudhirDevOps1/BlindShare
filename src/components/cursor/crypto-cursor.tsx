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

interface TuxCyberPetProps {
  isHovering: boolean;
  isRunning: boolean;
  facing: 1 | -1;
}

function TuxCyberPet({ isHovering, isRunning, facing }: TuxCyberPetProps) {
  return (
    <div
      className="relative select-none pointer-events-none transition-transform duration-100"
      style={{
        transform: `scaleX(${facing}) rotate(${isRunning ? facing * 12 : 0}deg)`,
      }}
    >
      <svg
        viewBox="0 0 36 42"
        className={`w-8 h-9 transition-transform duration-200 ${
          isHovering
            ? "scale-110 drop-shadow-[0_2px_10px_rgba(245,158,11,0.45)]"
            : "scale-100 drop-shadow-[0_2px_6px_rgba(16,185,129,0.3)]"
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Ion Thruster Plasma Flame under feet */}
        <ellipse
          cx="18"
          cy="39"
          rx={isRunning ? 6 : 4.5}
          ry={isRunning ? 2.6 : 1.5}
          fill={isRunning ? "rgba(245,158,11,0.85)" : isHovering ? "rgba(245,158,11,0.5)" : "rgba(56,189,248,0.4)"}
          className="animate-pulse"
        />

        {/* Penguin Little Cyber Feet (running step animation when moving) */}
        <ellipse
          cx="12"
          cy="36"
          rx="3.5"
          ry="1.8"
          fill="#F59E0B"
          style={{
            transformOrigin: "12px 36px",
            animation: isRunning ? "tuxRunFootLeft 0.16s ease-in-out infinite alternate" : undefined,
          }}
        />
        <ellipse
          cx="24"
          cy="36"
          rx="3.5"
          ry="1.8"
          fill="#F59E0B"
          style={{
            transformOrigin: "24px 36px",
            animation: isRunning ? "tuxRunFootRight 0.16s ease-in-out infinite alternate" : undefined,
          }}
        />

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
            animation: isRunning
              ? "tuxWingLeft 0.14s ease-in-out infinite alternate"
              : isHovering
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
            animation: isRunning
              ? "tuxWingRight 0.14s ease-in-out infinite alternate"
              : isHovering
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
        {isHovering || isRunning ? (
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
          fill={isRunning ? "#F59E0B" : isHovering ? "#F59E0B" : "#10B981"}
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
  const [petMotion, setPetMotion] = useState<{ isRunning: boolean; facing: 1 | -1 }>({
    isRunning: false,
    facing: 1,
  });

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
  const petPhysicsRef = useRef<{
    x: number;
    y: number;
    facing: 1 | -1;
    isRunning: boolean;
  }>({
    x: -500,
    y: -500,
    facing: 1,
    isRunning: false,
  });
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
        // Cursor Lerp damping calculation: targetX + (mouseX - targetX) * 0.22
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
          const scale = isHoveringRef.current ? 1.25 : 1.0;
          haloRef.current.style.transform = `translate3d(${lx - 12}px, ${ly - 12}px, 0) scale(${scale})`;
        }

        // 3. Cute Tux Cyber Pet companion running & flowing towards the cursor ("daud ke aaye")
        const pet = petPhysicsRef.current;
        if (pet.x === -500) {
          pet.x = tx - 32;
          pet.y = ty + 12;
        }

        // Target spot for pet is slightly behind cursor depending on movement direction
        const petTargetX = tx + (pet.facing === 1 ? -36 : 36);
        const petTargetY = ty + 12;

        const petDx = petTargetX - pet.x;
        const petDy = petTargetY - pet.y;
        const petDist = Math.hypot(petDx, petDy);

        if (petDist > 18) {
          // Pet is actively running to catch up!
          const newFacing: 1 | -1 = petDx >= 0 ? 1 : -1;
          pet.x += petDx * 0.16; // dynamic sprint
          pet.y += petDy * 0.16;

          if (!pet.isRunning || pet.facing !== newFacing) {
            pet.isRunning = true;
            pet.facing = newFacing;
            setPetMotion({ isRunning: true, facing: newFacing });
          }
        } else {
          // Pet has arrived at cursor, smooth idle float
          pet.x += petDx * 0.08;
          pet.y += petDy * 0.08;

          if (pet.isRunning) {
            pet.isRunning = false;
            setPetMotion((prev) => ({ ...prev, isRunning: false }));
          }
        }

        if (petRef.current) {
          const hoverBob = pet.isRunning ? 0 : Math.sin(Date.now() / 260) * 2.5;
          petRef.current.style.transform = `translate3d(${Math.round(pet.x)}px, ${Math.round(pet.y + hoverBob)}px, 0)`;
        }

        // 4. Soft focused flashlight glow (tight circle around cursor)
        if (spotlightRef.current) {
          spotlightRef.current.style.transform = `translate3d(${tx - 150}px, ${ty - 150}px, 0)`;
        }

        // 5. Circular Spotlight Mask: ONLY where cursor is, inside circle of radius 220px!
        // Outside the circle: 100% invisible/dark!
        if (matrixSpotlightRef.current) {
          const mask = `radial-gradient(circle 220px at ${tx}px ${ty}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, transparent 100%)`;
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
        const mask = `radial-gradient(circle 220px at -500px -500px, black 0%, transparent 100%)`;
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
          100% { transform: rotate(-24deg); }
        }
        @keyframes tuxWingRight {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(24deg); }
        }
        @keyframes tuxRunFootLeft {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-4px) rotate(-20deg); }
        }
        @keyframes tuxRunFootRight {
          0% { transform: translateY(-4px) rotate(-20deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>

      {/* ── 1. Circular Cipher Flashlight (Strictly within 220px circle around cursor, dark everywhere else) ── */}
      <div
        ref={matrixSpotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[32] select-none overflow-hidden mix-blend-screen opacity-[0.45] transition-opacity duration-300"
        style={{
          WebkitMaskImage: `radial-gradient(circle 220px at -500px -500px, black 0%, transparent 100%)`,
          maskImage: `radial-gradient(circle 220px at -500px -500px, black 0%, transparent 100%)`,
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

      {/* ── 2. Focused Radial Spotlight Aura (Tight, Soft, Non-Blinding) ── */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99990] w-[300px] h-[300px] rounded-full will-change-transform opacity-30 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(16, 185, 129, 0.03) 45%, transparent 70%)",
        }}
      />

      {/* ── 3. Cryptographic Overlays & Tux Cyber-Pet Follower ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
      >
        {/* Crisp Laser Halo Ring */}
        <div
          ref={haloRef}
          className={`absolute top-0 left-0 w-6 h-6 rounded-full border transition-colors duration-150 flex items-center justify-center will-change-transform ${
            isHoveringInteractive
              ? "border-amber-400/90 bg-amber-400/10 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
              : "border-amber-500/50 bg-amber-500/5 shadow-[0_0_6px_rgba(245,158,11,0.2)]"
          }`}
        >
          {/* Micro Precision Crosshair Notches on Halo */}
          <div className="absolute top-0 w-0.5 h-1 bg-amber-400/80" />
          <div className="absolute bottom-0 w-0.5 h-1 bg-amber-400/80" />
          <div className="absolute left-0 h-0.5 w-1 bg-amber-400/80" />
          <div className="absolute right-0 h-0.5 w-1 bg-amber-400/80" />
        </div>

        {/* Pinpoint Precision Laser Center Micro-Dot */}
        <div
          ref={laserDotRef}
          className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_#f59e0b] will-change-transform"
        />

        {/* Tux Cyber-Pet Companion: Runs & flows to cursor ("daud ke aaye") */}
        <div
          ref={petRef}
          className="absolute top-0 left-0 will-change-transform pointer-events-none"
        >
          <TuxCyberPet
            isHovering={isHoveringInteractive}
            isRunning={petMotion.isRunning}
            facing={petMotion.facing}
          />
        </div>

        {/* Click Sonar Ping Waves */}
        {sonarPings.map((ping) => (
          <div
            key={ping.id}
            className="absolute rounded-full border border-amber-400/70 bg-amber-400/15 pointer-events-none animate-ping"
            style={{
              left: `${ping.x - 22}px`,
              top: `${ping.y - 22}px`,
              width: "44px",
              height: "44px",
              animationDuration: "0.55s",
            }}
          />
        ))}
      </div>
    </>
  );
}


