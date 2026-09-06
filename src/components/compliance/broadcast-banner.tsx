"use client";

import React, { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

export function BroadcastBanner() {
  const [banner, setBanner] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/public-settings")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.broadcast_banner && typeof data.broadcast_banner === "string") {
          const text = data.broadcast_banner.trim();
          if (text) {
            const key = "blindshare_banner_dismissed_" + encodeURIComponent(text);
            if (sessionStorage.getItem(key) !== "true") {
              setBanner(text);
            }
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  if (!banner || dismissed) return null;

  return (
    <aside
      aria-label="Platform Announcement"
      className="relative isolate flex items-center justify-between gap-x-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md z-40"
    >
      <div className="flex items-center gap-2 mx-auto text-center truncate">
        <Megaphone className="h-4 w-4 shrink-0 text-slate-950 animate-bounce" />
        <span className="font-bold tracking-wide truncate">{banner}</span>
      </div>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          try {
            sessionStorage.setItem("blindshare_banner_dismissed_" + encodeURIComponent(banner), "true");
          } catch {}
        }}
        className="p-1 rounded-md text-slate-950/80 hover:text-slate-950 hover:bg-black/10 transition shrink-0"
        title="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </aside>
  );
}
