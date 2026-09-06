"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export function PrismTracker() {
  const pathname = usePathname();
  const siteId = process.env.NEXT_PUBLIC_PRISM_ANALYTICS_ID;

  const trackPageView = useCallback(() => {
    if (typeof window === "undefined" || !siteId) return;

    try {
      // 1. Gated behind explicit GDPR cookie consent
      const cStr = localStorage.getItem("blindshare_cookie_consent_v1");
      if (!cStr) return;
      const c = JSON.parse(cStr);
      if (!c || c.analytics !== true) return;

      // 2. Ephemeral session ID in sessionStorage
      let sid = sessionStorage.getItem("pa_sid");
      if (!sid) {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
          sid = crypto.randomUUID();
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

      // 3. Post to first-party same-origin endpoint to prevent adblocker ERR_BLOCKED_BY_CLIENT
      const targetUrl = "/api/telemetry";

      if (navigator.sendBeacon) {
        try {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(targetUrl, blob);
        } catch {
          fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } else {
        fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Zero-telemetry silent resilience
    }
  }, [pathname, siteId]);

  useEffect(() => {
    trackPageView();

    const handleConsent = () => trackPageView();
    window.addEventListener("blindshare-consent-updated", handleConsent);
    return () => {
      window.removeEventListener("blindshare-consent-updated", handleConsent);
    };
  }, [trackPageView]);

  return null;
}

