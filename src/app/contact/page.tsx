"use client";

import React, { useState, useRef } from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import { MessageSquare, Send, CheckCircle2, ShieldCheck, Mail, Loader2, User, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const { appName } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Turnstile-Styled ALTCHA Anti-Spam state
  const widgetRef = useRef<HTMLElement | null>(null);
  const [altchaSolvedMs, setAltchaSolvedMs] = useState<number | null>(null);
  const [altchaPayload, setAltchaPayload] = useState<string>("");

  const endpoint =
    process.env.NEXT_PUBLIC_FORMFORGE_ENDPOINT ||
    process.env.NEXT_PUBLIC_CONTACT_FORM_ACTION ||
    "";
  const challengeUrl =
    process.env.NEXT_PUBLIC_ALTCHA_CHALLENGE_URL ||
    endpoint ||
    "/api/altcha";

  React.useEffect(() => {
    // Dynamic import of ALTCHA bundle (self-hosted first for CSP 'self' compliance, CDN fallback)
    if (typeof window !== "undefined" && !customElements.get("altcha-widget")) {
      const s = document.createElement("script");
      s.type = "module";
      s.src = "/vendor/altcha.min.js";
      s.async = true;
      s.defer = true;
      s.onerror = () => {
        const fallback = document.createElement("script");
        fallback.type = "module";
        fallback.src = "https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js";
        fallback.async = true;
        fallback.defer = true;
        document.head.appendChild(fallback);
      };
      document.head.appendChild(s);
    }

    const el = widgetRef.current;
    if (!el) return;
    let s = 0;
    const onStateChange = (e: any) => {
      if (e.detail?.state === "verifying") s = performance.now();
      if (e.detail?.state === "verified") {
        const ms = Math.round(performance.now() - s);
        setAltchaSolvedMs(ms);
        if (e.detail?.payload) {
          setAltchaPayload(e.detail.payload);
        }
      }
    };
    el.addEventListener("statechange", onStateChange);
    return () => el.removeEventListener("statechange", onStateChange);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loadingRef.current || loading || honeypot) return; // Guard against in-flight double submit & bot spam
    loadingRef.current = true;

    setLoading(true);
    setError("");

    const formEl = e.currentTarget;
    const altchaInput = formEl.querySelector<HTMLInputElement>('input[name="altcha"]');
    const token = altchaPayload || altchaInput?.value || "";

    const payload = {
      name: name.trim() || undefined,
      email: email.trim(),
      message: message.trim(),
      website: honeypot || undefined,
      altcha: token || undefined,
    };

    try {
      // 1. Primary submit to our internal /api/contact route
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to dispatch message. Please check your inputs and try again.");
      }

      // 2. FormForge / external webhook sync if configured (JSON payload compliant with ALTCHA)
      if (endpoint) {
        try {
          await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim() || "Anonymous",
              email: email.trim(),
              message: message.trim(),
              website: honeypot,
              altcha: token,
            }),
          });
        } catch {
          // Graceful fallback if external FormForge endpoint has network/CORS restrictions
        }
      }

      // 3. Local storage backup
      try {
        const past = JSON.parse(localStorage.getItem("blindshare.feedback") || "[]");
        past.push({ name: name.trim(), email: email.trim(), message: message.trim(), at: new Date().toISOString() });
        localStorage.setItem("blindshare.feedback", JSON.stringify(past.slice(-20)));
      } catch {}

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send message. Please retry.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6 flex flex-col justify-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Contact & Operator Feedback</h1>
            <p className="text-xs text-slate-400">
              Have questions, security disclosures, or feature suggestions for {appName}?
            </p>
          </div>

          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Message Dispatched!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Thank you. We have received your inquiry securely.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setName("");
                  setEmail("");
                  setMessage("");
                  setError("");
                }}
                className="mt-4 rounded-xl bg-slate-800 border border-slate-700 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Your Name (e.g. Alex Doe)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Your Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Message / Details
                  </label>
                  <span className="text-[10px] text-slate-500">Min. 5 characters</span>
                </div>
                <textarea
                  name="message"
                  required
                  minLength={5}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Describe your inquiry, feedback, or bug report..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition resize-none"
                />
              </div>

              {/* Honeypot Bot Trap */}
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                style={{ display: "none" }}
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />

              {/* Turnstile-Styled ALTCHA Proof-of-Work Anti-Spam Widget */}
              <div className="pt-1 pb-1">
                {React.createElement("altcha-widget", {
                  ref: widgetRef,
                  challengeurl: challengeUrl,
                  style: {
                    "--altcha-max-width": "100%",
                    "--altcha-border-radius": "12px",
                    "--altcha-color-base": "#0f172a",
                    "--altcha-color-border": "#334155",
                    "--altcha-color-text": "#f8fafc",
                  } as React.CSSProperties,
                })}
                {altchaSolvedMs !== null && (
                  <div
                    id="altcha-timer"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "#34d399",
                      marginTop: "4px",
                    }}
                  >
                    ⚡ Solved in {altchaSolvedMs}ms (Proof-of-Work)
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden select-none w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all text-xs disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed shadow-md shadow-amber-500/10"
              >
                {loading && (
                  <>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-btn-shimmer" />
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-700/50 overflow-hidden">
                      <span className="block h-full bg-slate-950 w-1/3 animate-progress-indeterminate" />
                    </span>
                  </>
                )}
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 relative z-10" /> : <Send className="h-3.5 w-3.5 shrink-0 relative z-10" />}
                <span className="relative z-10">{loading ? "Transmitting..." : "Send Message"}</span>
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Bot Protected
            </span>
            <span>Zero-Spam Form</span>
          </div>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
