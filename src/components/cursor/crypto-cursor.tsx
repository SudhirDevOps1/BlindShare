"use client";

import React, { useEffect, useState, useRef } from "react";
import { useI18n } from "@/lib/i18n/context";

interface SonarPing {
  id: number;
  x: number;
  y: number;
}

export function CryptoCursor() {
  const { t } = useI18n();
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(true);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState<boolean>(false);
  const [sonarPings, setSonarPings] = useState<SonarPing[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // High-performance mutable coords in refs to prevent React re-renders on mousemove
  const coordsRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -500,
    y: -500,
    active: false,
  });
  const lerpRef = useRef<{ x: number; y: number }>({ x: -500, y: -500 });
  const isHoveringRef = useRef<boolean>(false);

  // Direct element references for 60-144 FPS GPU transforms
  const laserDotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

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

        // Zero-latency center laser dot (instant)
        if (laserDotRef.current) {
          laserDotRef.current.style.transform = `translate3d(${tx - 3}px, ${ty - 3}px, 0)`;
        }

        // Inertia laser halo with magnetic scale
        if (haloRef.current) {
          const scale = isHoveringRef.current ? 1.35 : 1.0;
          haloRef.current.style.transform = `translate3d(${lx - 16}px, ${ly - 16}px, 0) scale(${scale})`;
        }

        // Micro brand badge floating alongside halo
        if (badgeRef.current) {
          badgeRef.current.style.transform = `translate3d(${lx + 20}px, ${ly - 10}px, 0)`;
        }

        // Ambient cipher spotlight beam
        if (spotlightRef.current) {
          spotlightRef.current.style.transform = `translate3d(${tx - 250}px, ${ty - 250}px, 0)`;
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

  const brandBadgeText =
    t.architectureShowcase?.cursor?.brandBadge || "BlindShare • ZK-SECURE";
  const brandInspectText =
    t.architectureShowcase?.cursor?.brandInspect || "BlindShare • ZK-INSPECT";

  return (
    <>
      {/* Option 2: Zero-Knowledge Ambient Cipher Spotlight Beam (Global) */}
      <div
        ref={spotlightRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99990] w-[500px] h-[500px] rounded-full will-change-transform opacity-70 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.045) 0%, rgba(59, 130, 246, 0.02) 45%, transparent 75%)",
        }}
      />

      {/* Option 1: Cryptographic Laser Pointer Overlays */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
      >
        {/* 1. Inertia Laser Halo Circle trailing pointer */}
        <div
          ref={haloRef}
          className={`absolute top-0 left-0 w-8 h-8 rounded-full border transition-colors duration-150 flex items-center justify-center will-change-transform ${
            isHoveringInteractive
              ? "border-amber-400 bg-amber-400/15 shadow-[0_0_24px_rgba(245,158,11,0.6)]"
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

        {/* 3. Subtle Brand Name & Cryptographic Context Micro-Badge */}
        <div
          ref={badgeRef}
          className={`absolute top-0 left-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9.5px] font-mono font-semibold tracking-wider uppercase transition-all duration-150 backdrop-blur-md will-change-transform shadow-md ${
            isHoveringInteractive
              ? "bg-amber-950/80 border-amber-400/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              : "bg-slate-950/70 border-slate-800 text-slate-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isHoveringInteractive ? "bg-amber-400 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span>{isHoveringInteractive ? brandInspectText : brandBadgeText}</span>
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
