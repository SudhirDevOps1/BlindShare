"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side only: never logs message content that could contain PII;
    // the digest is a safe, non-sensitive correlation id for support requests.
    console.error("[app.error_boundary]", { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-100">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/30 text-red-400">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-white">Something went wrong</h1>
      <p className="mb-1 max-w-md text-sm text-slate-400">
        An unexpected error occurred. Your documents remain encrypted and unaffected.
      </p>
      {error.digest && (
        <p className="mb-6 font-mono text-[11px] text-slate-600">Reference: {error.digest}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
        >
          <RefreshCcw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}
