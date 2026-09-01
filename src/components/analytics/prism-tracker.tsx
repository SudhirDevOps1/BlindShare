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
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
          sid = crypto.randomUUID();
        } else if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
          const arr = new Uint8Array(16);
          crypto.getRandomValues(arr);
          sid = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
        } else {
          sid = `sid_${Date.now()}`;
        }
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
