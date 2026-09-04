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

const TuxCyberPet = React.forwardRef<HTMLDivElement, {}>(function TuxCyberPet(_, ref) {
  return (
    <div
      ref={ref}
      className="tux-pet tux-idle tux-facing-right relative select-none pointer-events-none"
    >
      <svg
        viewBox="0 0 36 42"
        className="w-8 h-9 drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)] transition-transform duration-150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Ion Thruster Plasma Flame under feet */}
        <ellipse
          cx="18"
          cy="39"
          rx="4.5"
          ry="1.6"
          fill="rgba(56,189,248,0.7)"
          className="tux-thruster animate-pulse"
        />

        {/* Penguin Little Cyber Feet */}
        <ellipse
          cx="12"
          cy="36"
          rx="3.5"
          ry="1.8"
          fill="#F59E0B"
          className="tux-foot-left"
        />
        <ellipse
          cx="24"
          cy="36"
          rx="3.5"
          ry="1.8"
          fill="#F59E0B"
          className="tux-foot-right"
        />

        {/* Penguin Main Body (Obsidian Cyber Chassis) */}
        <ellipse cx="18" cy="21" rx="13" ry="15" fill="#0F172A" stroke="#334155" strokeWidth="1" />

        {/* Left Flipper / Wing */}
        <path
          className="tux-wing-left"
          d="M6 16 C3 20, 2 26, 6 29 C7 29, 8 26, 8 22 Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="0.75"
        />

        {/* Right Flipper / Wing */}
        <path
          className="tux-wing-right"
          d="M30 16 C33 20, 34 26, 30 29 C29 29, 28 26, 28 22 Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="0.75"
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

        {/* Cute Digital LED Visor Eyes with natural blinking & direction tracking */}
        <g className="tux-eyes">
          <ellipse cx="14" cy="11.5" rx="2.4" ry="3" fill="#020617" />
          <circle cx="14.2" cy="11.5" r="1.4" fill="#38BDF8" className="tux-pupil" />
          <circle cx="14.7" cy="11" r="0.6" fill="#FFFFFF" />

          <ellipse cx="22" cy="11.5" rx="2.4" ry="3" fill="#020617" />
          <circle cx="22.2" cy="11.5" r="1.4" fill="#38BDF8" className="tux-pupil" />
          <circle cx="22.7" cy="11" r="0.6" fill="#FFFFFF" />
        </g>

        {/* Cute Head Cyber Antenna with Pulsing LED Beacon */}
        <line x1="18" y1="6" x2="18" y2="2.5" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
        <circle
          cx="18"
          cy="2"
          r="1.2"
          fill="#10B981"
          className="tux-antenna-led animate-ping"
        />
      </svg>
    </div>
  );
});

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
  const petPhysicsRef = useRef<{
    x: number;
    y: number;
    wasRunning: boolean;
    idleFrames: number;
  }>({
    x: -500,
    y: -500,
    wasRunning: false,
    idleFrames: 0,
  });
  const isHoveringRef = useRef<boolean>(false);

  // Direct element references for 60-144 FPS hardware-accelerated transforms
  const laserDotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const petRef = useRef<HTMLDivElement>(null);
  const petInnerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const matrixSpotlightRef = useRef<HTMLDivElement>(null);

  // Detect touch screens or small viewports (< 768px) to disable custom cursor on mobile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkTouch = () => {
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setIsTouchDevice(isCoarse || hasTouch || isSmallScreen || reducedMotion);
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
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

        // 3. Cute Tux Cyber Pet Chase Sprint Physics ("cursor se dur rahein, door jane par follow krein")
        const pet = petPhysicsRef.current;
        if (pet.x === -500) {
          pet.x = tx - 80;
          pet.y = ty + 24;
        }

        // Target spot: pet stays at a friendly trailing distance (80px) from cursor
        const targetSide = tx >= pet.x ? -80 : 80;
        const targetPetX = tx + targetSide;
        const targetPetY = ty + 24;

        const pDx = targetPetX - pet.x;
        const pDy = targetPetY - pet.y;
        const pDist = Math.hypot(pDx, pDy);
        const distFromCursor = Math.hypot(tx - pet.x, ty - pet.y);

        let isRunningNow = false;
        const facingNow: 1 | -1 = tx >= pet.x ? 1 : -1;

        // Follow threshold: Only follow/run when cursor moves away beyond comfortable distance
        const shouldStartRunning = pDist > 48 || distFromCursor > 125;
        const shouldKeepRunning = pet.wasRunning && pDist > 16;

        if (shouldStartRunning || shouldKeepRunning) {
          // Pet is actively running to catch up to its 80px spot!
          isRunningNow = true;
          // Dynamic chase speed: runs fast (up to 14px/frame) if distant
          const chaseSpeed = Math.min(14, Math.max(3.2, pDist * 0.15));
          const angle = Math.atan2(pDy, pDx);
          pet.x += Math.cos(angle) * chaseSpeed;
          pet.y += Math.sin(angle) * chaseSpeed;
          pet.idleFrames = 0;
        } else {
          // If cursor gets too close to the pet (crowding < 55px), pet gently yields space
          if (distFromCursor < 55) {
            pet.x += (pet.x - tx) * 0.06;
            pet.y += (pet.y - ty) * 0.06;
          } else {
            // Smooth idle positioning
            pet.x += pDx * 0.08;
            pet.y += pDy * 0.08;
          }
          pet.idleFrames = (pet.idleFrames || 0) + 1;
          if (pet.idleFrames < 4 && pet.wasRunning) {
            isRunningNow = true;
          }
        }
        pet.wasRunning = isRunningNow;

        if (petRef.current) {
          const hoverBob = isRunningNow ? 0 : Math.sin(Date.now() / 240) * 3;
          petRef.current.style.transform = `translate3d(${Math.round(pet.x)}px, ${Math.round(pet.y + hoverBob)}px, 0)`;

          // Direct class updates on the pet DOM element (instantaneous, 0 React latency)
          if (petInnerRef.current) {
            petInnerRef.current.classList.toggle("tux-running", isRunningNow);
            petInnerRef.current.classList.toggle("tux-idle", !isRunningNow);
            petInnerRef.current.classList.toggle("tux-hovering", isHoveringRef.current);
            petInnerRef.current.classList.toggle("tux-facing-right", facingNow === 1);
            petInnerRef.current.classList.toggle("tux-facing-left", facingNow === -1);
          }
        }

        // 4. Soft focused flashlight glow (tight 180px circle centered around cursor)
        if (spotlightRef.current) {
          spotlightRef.current.style.transform = `translate3d(${Math.round(tx - 90)}px, ${Math.round(ty - 90)}px, 0)`;
        }

        // 5. Circular Spotlight Mask: ONLY where cursor is, inside tight circle of radius 125px!
        // Outside the circle: 100% invisible/dark!
        if (matrixSpotlightRef.current) {
          const mask = `radial-gradient(circle 125px at ${tx}px ${ty}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, transparent 100%)`;
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
        const mask = `radial-gradient(circle 125px at -500px -500px, black 0%, transparent 100%)`;
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
        /* ── Tux Pet Base & Direction ── */
        .tux-pet {
          transition: transform 0.12s ease-out;
          will-change: transform;
        }
        .tux-pet.tux-facing-right {
          transform: scaleX(1);
        }
        .tux-pet.tux-facing-left {
          transform: scaleX(-1);
        }
        .tux-pet.tux-running.tux-facing-right {
          transform: scaleX(1) rotate(14deg);
        }
        .tux-pet.tux-running.tux-facing-left {
          transform: scaleX(-1) rotate(14deg);
        }

        /* ── Eyes Blinking & Running Glow ── */
        .tux-pet .tux-eyes {
          transform-box: fill-box;
          transform-origin: center;
          animation: tuxEyeBlink 3.4s ease-in-out infinite;
        }
        @keyframes tuxEyeBlink {
          0%, 93%, 97%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .tux-pet.tux-running .tux-pupil {
          fill: #F59E0B !important;
          filter: drop-shadow(0 0 4px #F59E0B);
        }
        .tux-pet.tux-hovering .tux-pupil {
          fill: #10B981 !important;
          filter: drop-shadow(0 0 4px #10B981);
        }

        /* ── Wings Flutter & Energetic Run Flap ── */
        .tux-pet .tux-wing-left {
          transform-box: fill-box;
          transform-origin: top right;
          animation: tuxWingHoverLeft 0.75s ease-in-out infinite alternate;
        }
        .tux-pet .tux-wing-right {
          transform-box: fill-box;
          transform-origin: top left;
          animation: tuxWingHoverRight 0.75s ease-in-out infinite alternate;
        }
        .tux-pet.tux-running .tux-wing-left {
          animation: tuxWingRunLeft 0.12s ease-in-out infinite alternate !important;
        }
        .tux-pet.tux-running .tux-wing-right {
          animation: tuxWingRunRight 0.12s ease-in-out infinite alternate !important;
        }

        @keyframes tuxWingHoverLeft {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-22deg); }
        }
        @keyframes tuxWingHoverRight {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(22deg); }
        }
        @keyframes tuxWingRunLeft {
          0% { transform: rotate(-10deg) scaleY(0.9); }
          100% { transform: rotate(-55deg) scaleY(1.15); }
        }
        @keyframes tuxWingRunRight {
          0% { transform: rotate(10deg) scaleY(0.9); }
          100% { transform: rotate(55deg) scaleY(1.15); }
        }

        /* ── Running Feet Gait Cycle (Alternating steps) ── */
        .tux-pet .tux-foot-left,
        .tux-pet .tux-foot-right {
          transform-box: fill-box;
          transform-origin: center top;
        }
        .tux-pet.tux-running .tux-foot-left {
          animation: tuxStepLeft 0.15s ease-in-out infinite alternate !important;
        }
        .tux-pet.tux-running .tux-foot-right {
          animation: tuxStepRight 0.15s ease-in-out infinite alternate !important;
        }

        @keyframes tuxStepLeft {
          0% { transform: translate(3px, -5px) rotate(-24deg); }
          100% { transform: translate(-4px, 2px) rotate(20deg); }
        }
        @keyframes tuxStepRight {
          0% { transform: translate(-4px, 2px) rotate(20deg); }
          100% { transform: translate(3px, -5px) rotate(-24deg); }
        }

        /* ── Running Body Bounce & Thruster Boost ── */
        .tux-pet.tux-running svg {
          animation: tuxRunBounce 0.15s ease-in-out infinite alternate;
        }
        @keyframes tuxRunBounce {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-4px); }
        }
        .tux-pet.tux-running .tux-thruster {
          fill: rgba(245, 158, 11, 0.9) !important;
          transform: scale(1.6, 2.2);
          filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.8));
        }
        .tux-pet.tux-running .tux-antenna-led {
          fill: #F59E0B !important;
        }
      `}</style>

      {/* ── 1. Circular Cipher Flashlight (Strictly within tight 125px circle around cursor, dark everywhere else) ── */}
      <div
        ref={matrixSpotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[32] select-none overflow-hidden mix-blend-screen opacity-[0.5] transition-opacity duration-300"
        style={{
          WebkitMaskImage: `radial-gradient(circle 125px at -500px -500px, black 0%, transparent 100%)`,
          maskImage: `radial-gradient(circle 125px at -500px -500px, black 0%, transparent 100%)`,
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

      {/* ── 2. Focused Radial Spotlight Aura (Tight 180px, Soft Amber/Emerald Beam) ── */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99990] w-[180px] h-[180px] rounded-full will-change-transform opacity-35 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 75%)",
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
          <TuxCyberPet ref={petInnerRef} />
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


