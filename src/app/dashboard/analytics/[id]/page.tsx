"use client";

import React, { use } from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { LinkAnalyticsView } from "@/components/analytics/link-analytics-view";

export default function AnalyticsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <LinkAnalyticsView linkId={id} />
      </main>
      <BrandFooter />
    </div>
  );
}
