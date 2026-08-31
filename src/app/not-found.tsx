import Link from "next/link";
import { ShieldOff, Home } from "lucide-react";

export default function NotFound() {
  const appName = process.env.PUBLIC_APP_NAME || "BlindShare";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-100">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-amber-400">
        <ShieldOff className="h-8 w-8" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-white">404 — Page Not Found</h1>
      <p className="mb-6 max-w-md text-sm text-slate-400">
        The page you requested does not exist. If this was meant to be a share link, double-check the full URL
        including anything after the <code className="text-amber-400">#</code> — {appName} needs the complete link to
        work.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
      >
        <Home className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
