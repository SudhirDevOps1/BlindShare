"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PrismTracker() {
  const pathname = usePathname();
  const siteId = process.env.NEXT_PUBLIC_PRISM_ANALYTICS_ID;
  const trackUrl = process.env.NEXT_PUBLIC_PRISM_ANALYTICS_URL;

  useEffect(() => {
    if (!siteId || !trackUrl || typeof window === "undefined") return;

    // Zero-telemetry safe beacon
    try {
      fetch(trackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          path: pathname,
          referrer: document.referrer || "direct",
          title: document.title,
          screen: `${window.innerWidth}x${window.innerHeight}`,
        }),
        mode: "no-cors",
        keepalive: true,
      }).catch(() => {
        // Silently ignore telemetry failure
      });
    } catch {
      // Ignore
    }
  }, [pathname, siteId, trackUrl]);

  return null;
}
