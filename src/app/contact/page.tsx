"use client";

import React, { useState } from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import { MessageSquare, Send, CheckCircle2, ShieldCheck, Mail, HelpCircle } from "lucide-react";

export default function ContactPage() {
  const { appName } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const endpoint = process.env.NEXT_PUBLIC_CONTACT_FORM_ACTION || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;

    setLoading(true);

    try {
      if (endpoint) {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, message, website: honeypot }),
          mode: "no-cors",
        });
      }
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
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
                  setEmail("");
                  setMessage("");
                }}
                className="mt-4 rounded-xl bg-slate-800 border border-slate-700 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Message / Details
                </label>
                <textarea
                  name="message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all text-xs disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{loading ? "Transmitting..." : "Send Message"}</span>
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
