"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { AdminPanelView } from "@/components/admin/admin-panel-view";
import { ShieldAlert } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user && (d.user.role === "super_admin" || d.user.role === "admin")) {
          setState("allowed");
        } else {
          setState("denied");
        }
      })
      .catch(() => setState("denied"));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {state === "loading" && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        )}

        {state === "denied" && (
          <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-8 w-8 text-red-400" />
            <h1 className="mb-2 text-lg font-bold text-white">Admin Access Required</h1>
            <p className="mb-6 text-xs text-slate-400">
              RBAC is enforced on every /api/admin route as well — this page alone is never the security boundary.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Sign in as Administrator
            </button>
          </div>
        )}

        {state === "allowed" && <AdminPanelView />}
      </main>
      <BrandFooter />
    </div>
  );
}
