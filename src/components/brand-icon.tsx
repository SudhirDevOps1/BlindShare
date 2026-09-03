import React from "react";

interface BrandIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showGlow?: boolean;
}

const sizeClasses = {
  sm: "h-7 w-7 rounded-xl p-1",
  md: "h-9 w-9 rounded-xl p-1.5",
  lg: "h-11 w-11 rounded-2xl p-1.5",
  xl: "h-14 w-14 rounded-2xl p-2",
};

export function BrandIcon({
  className = "",
  size = "md",
  showGlow = true,
}: BrandIconProps) {
  const baseSize = sizeClasses[size] || sizeClasses.md;
  const glow = showGlow ? "shadow-md shadow-amber-500/20" : "";

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/40 ${baseSize} ${glow} ${className}`}
    >
      <img
        src="/brand/02-favicon.svg"
        alt="BlindShare"
        className="h-full w-full object-contain pointer-events-none"
      />
    </div>
  );
}
