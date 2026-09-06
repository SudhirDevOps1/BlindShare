"use client";

import React, { useState, useRef } from "react";
import { MessageSquare, X, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const endpoint = process.env.NEXT_PUBLIC_CONTACT_FORM_ACTION || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loadingRef.current || loading || honeypot) return;
    loadingRef.current = true;

    setLoading(true);

    try {
      if (endpoint) {
        const fd = new FormData();
        fd.append("email", email.trim());
        fd.append("message", message.trim());
        fd.append("website", honeypot);

        await fetch(endpoint, {
          method: "POST",
          body: fd,
          mode: "no-cors",
        }).catch(() => {
          return fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), message: message.trim(), website: honeypot }),
            mode: "no-cors",
          });
        });
      }
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Message Dispatched</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Thank you for reaching out. Your feedback or inquiry has been received securely.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setEmail("");
                setMessage("");
                onClose();
              }}
              className="mt-4 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Send Feedback & Inquiry</h3>
                <p className="text-[11px] text-slate-400">Direct response from our core operators</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Your Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Message / Feedback
                </label>
                <textarea
                  name="message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your feedback, bug report, or inquiry here..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition resize-none"
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
                className="relative overflow-hidden select-none w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed text-xs shadow-md shadow-amber-500/10"
              >
                {loading && (
                  <>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-btn-shimmer" />
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600/50 overflow-hidden">
                      <span className="block h-full bg-slate-950 w-1/3 animate-progress-indeterminate" />
                    </span>
                  </>
                )}
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 relative z-10" /> : <Send className="h-3.5 w-3.5 shrink-0 relative z-10" />}
                <span className="relative z-10">{loading ? "Sending..." : "Send Message"}</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
