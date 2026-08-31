"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PrismTracker() {
  const pathname = usePathname();
  const siteId = process.env.NEXT_PUBLIC_PRISM_ANALYTICS_ID;
  const trackUrl = process.env.NEXT_PUBLIC_PRISM_ANALYTICS_URL;

  useEffect(() => {
    if (!siteId || !trackUrl || typeof window === "undefined") return;

    try {
      let sid = sessionStorage.getItem("pa_sid");
      if (!sid) {
        sid = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        sessionStorage.setItem("pa_sid", sid);
      }

      const q = new URLSearchParams(window.location.search);
      const payload = JSON.stringify({
        site_id: siteId,
        pathname: pathname || window.location.pathname,
        referrer: document.referrer || "",
        screen_size: `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`,
        session_id: sid,
        event_name: "pageview",
        utm_source: q.get("utm_source") || undefined,
        utm_medium: q.get("utm_medium") || undefined,
        utm_campaign: q.get("utm_campaign") || undefined,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(trackUrl, payload);
      } else {
        fetch(trackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
          mode: "no-cors",
        }).catch(() => {});
      }
    } catch {
      // Zero-telemetry silent resilience
    }
  }, [pathname, siteId, trackUrl]);

  return null;
}
