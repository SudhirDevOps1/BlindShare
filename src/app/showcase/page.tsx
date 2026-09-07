"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import {
  SHOWCASE_ITEMS,
  SHOWCASE_CATEGORIES,
  ShowcaseCategory,
  ShowcaseItem,
} from "@/lib/showcase-data";
import {
  ShieldCheck,
  Search,
  Maximize2,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers,
  Activity,
  Server,
  Mail,
  Eye,
  FileCheck,
  Award,
} from "lucide-react";

export default function ShowcasePage() {
  const { lang, setLang } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<ShowcaseCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalItem, setActiveModalItem] = useState<ShowcaseItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [modalLang, setModalLang] = useState<"en" | "hi">(lang);

  // Sync modalLang with site lang when opened
  useEffect(() => {
    setModalLang(lang);
  }, [lang]);

  // Reset zoom when active item changes
  useEffect(() => {
    setZoomLevel(1);
  }, [activeModalItem]);

  // Filter items
  const filteredItems = useMemo(() => {
    return SHOWCASE_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesQuery =
        item.titleEn.toLowerCase().includes(query) ||
        item.titleHi.toLowerCase().includes(query) ||
        item.descriptionEn.toLowerCase().includes(query) ||
        item.descriptionHi.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query)) ||
        item.proofPoints.some((p) => p.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: SHOWCASE_ITEMS.length };
    SHOWCASE_ITEMS.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Modal navigation
  const navigateModal = useCallback(
    (direction: "prev" | "next") => {
      if (!activeModalItem) return;
      const currentIndex = filteredItems.findIndex((i) => i.id === activeModalItem.id);
      if (currentIndex === -1) return;

      const newIndex =
        direction === "prev"
          ? (currentIndex - 1 + filteredItems.length) % filteredItems.length
          : (currentIndex + 1) % filteredItems.length;

      setActiveModalItem(filteredItems[newIndex]);
    },
    [activeModalItem, filteredItems]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeModalItem) return;
      if (e.key === "Escape") {
        setActiveModalItem(null);
      } else if (e.key === "ArrowLeft") {
        navigateModal("prev");
      } else if (e.key === "ArrowRight") {
        navigateModal("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalItem, navigateModal]);

  const getCategoryBadgeClass = (color?: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "blue":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "rose":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "purple":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "amber":
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30">
      <BrandHeader />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        {/* Glow ambient spots */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-10 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 shadow-sm">
            <Award className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>
              {lang === "hi"
                ? "100% वास्तविक उत्पादन सत्यापन · शून्य डमी डेटा"
                : "100% Real Production Verification · Zero Mock Data"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            {lang === "hi" ? (
              <>
                ब्लाइंडशेयर <span className="text-amber-400">लाइव शोकेस</span> एवं साक्ष्य गैलरी
              </>
            ) : (
              <>
                BlindShare <span className="text-amber-400">Live Showcase</span> & Proof Gallery
              </>
            )}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            {lang === "hi"
              ? "हमारे वास्तविक एंड-टू-एंड परीक्षण से कैप्चर किए गए सभी वास्तविक स्क्रीनशॉट की गहन समीक्षा करें। देखें कि शून्य-ज्ञान सिफरटेक्स्ट, बैकब्लेज B2 स्टोरेज, स्टोट अलर्ट, और डकडीबी एनालिटिक्स वास्तव में कैसे कार्य करते हैं।"
              : "Explore the verified visual proof of BlindShare v1.4.0 in live production. Inspect raw Backblaze B2 ciphertext, Stoat Chat webhooks, Google Apps Script transactional email delivery, and columnar DuckDB dwell analytics."}
          </p>

          {/* Quick Metrics Counter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
              <div className="text-2xl font-black text-amber-400">47</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                {lang === "hi" ? "सत्यापित कैप्चर" : "Verified Captures"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
              <div className="text-2xl font-black text-emerald-400">0 KB</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                {lang === "hi" ? "सर्वर प्लेनटेक्स्ट" : "Server Plaintext"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
              <div className="text-2xl font-black text-blue-400">7</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                {lang === "hi" ? "वास्तुकला स्तंभ" : "Core Categories"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
              <div className="text-2xl font-black text-purple-400">₹0 / mo</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                {lang === "hi" ? "सर्वर इंफ्रा बिल" : "Zero-Cost Infra"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Control Bar: Categories & Search */}
      <section className="sticky top-14 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
            {SHOWCASE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold"
                      : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                  }`}
                >
                  <span>{lang === "hi" ? cat.labelHi : cat.labelEn}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isSelected
                        ? "bg-slate-950/20 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "hi"
                  ? "स्क्रीनशॉट, टैग या फ़ीचर खोजें..."
                  : "Search features, tags, proofs..."
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-slate-900 text-slate-400 border border-slate-800">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">
              {lang === "hi" ? "कोई स्क्रीनशॉट नहीं मिला" : "No captures match your filter"}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "hi"
                ? "कृपया अलग कीवर्ड या श्रेणी चुनकर पुन: प्रयास करें।"
                : "Try adjusting your search query or selecting another category."}
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition mt-2"
            >
              <span>{lang === "hi" ? "फ़िल्टर रीसेट करें" : "Reset Filters"}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isHighlight = item.highlight;
              return (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden bg-slate-900/60 hover:bg-slate-900 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1 ${
                    isHighlight
                      ? "border-amber-500/40 hover:border-amber-400"
                      : "border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  {/* Highlight Ribbon */}
                  {isHighlight && (
                    <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-sm">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      <span>{lang === "hi" ? "मुख्य साक्ष्य" : "Key Proof"}</span>
                    </div>
                  )}

                  {/* Image Preview Container */}
                  <div
                    onClick={() => setActiveModalItem(item)}
                    className="relative aspect-video w-full cursor-pointer overflow-hidden bg-slate-950 border-b border-slate-800/60"
                  >
                    <img
                      src={`/showcase/${item.filename}`}
                      alt={item.titleEn}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20">
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>{lang === "hi" ? "पूर्ण स्क्रीन देखें" : "Inspect Full Screen"}</span>
                      </span>
                    </div>

                    {/* Category Badge Pill */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${getCategoryBadgeClass(
                          item.badgeColor
                        )}`}
                      >
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3
                        onClick={() => setActiveModalItem(item)}
                        className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors cursor-pointer line-clamp-1"
                        title={lang === "hi" ? item.titleHi : item.titleEn}
                      >
                        {lang === "hi" ? item.titleHi : item.titleEn}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {lang === "hi" ? item.descriptionHi : item.descriptionEn}
                      </p>
                    </div>

                    {/* Proof Points List */}
                    <ul className="space-y-1 border-t border-slate-800/80 pt-2.5">
                      {item.proofPoints.slice(0, 2).map((proof, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-[11px] text-slate-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{proof}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Tags Footer */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700/50"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-2 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="relative flex flex-col h-full max-h-[96vh] w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 bg-slate-950/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold ${getCategoryBadgeClass(
                    activeModalItem.badgeColor
                  )}`}
                >
                  {activeModalItem.badge}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  {modalLang === "hi" ? activeModalItem.titleHi : activeModalItem.titleEn}
                </h2>
              </div>

              {/* Modal Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Language Switcher inside Modal */}
                <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-[10px]">
                  <button
                    onClick={() => setModalLang("en")}
                    className={`rounded px-1.5 py-0.5 font-medium transition ${
                      modalLang === "en"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setModalLang("hi")}
                    className={`rounded px-1.5 py-0.5 font-medium transition ${
                      modalLang === "hi"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 pl-2">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                    disabled={zoomLevel <= 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 w-9 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                    disabled={zoomLevel >= 2.5}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>

                {/* Open Raw Image */}
                <a
                  href={`/showcase/${activeModalItem.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  title="Open Raw Image in New Tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>

                {/* Close Button */}
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Image Viewport */}
            <div className="relative flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-4">
              {/* Prev / Next Navigation Arrows */}
              <button
                onClick={() => navigateModal("prev")}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-slate-900/80 p-2 text-white hover:bg-amber-500 hover:text-slate-950 border border-slate-700/80 shadow-lg transition backdrop-blur-sm"
                title="Previous Screenshot (Left Arrow)"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={() => navigateModal("next")}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-slate-900/80 p-2 text-white hover:bg-amber-500 hover:text-slate-950 border border-slate-700/80 shadow-lg transition backdrop-blur-sm"
                title="Next Screenshot (Right Arrow)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Main Image with Zoom */}
              <div
                className="transition-transform duration-200 ease-out flex items-center justify-center max-h-full"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={`/showcase/${activeModalItem.filename}`}
                  alt={activeModalItem.titleEn}
                  className="max-h-[60vh] sm:max-h-[65vh] w-auto max-w-full object-contain rounded-lg border border-slate-800 shadow-2xl"
                />
              </div>
            </div>

            {/* Modal Footer: Deep Technical Details */}
            <div className="border-t border-slate-800/80 bg-slate-950/90 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {modalLang === "hi"
                      ? activeModalItem.descriptionHi
                      : activeModalItem.descriptionEn}
                  </p>

                  {/* Proof points */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60">
                    {activeModalItem.proofPoints.map((proof, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-[11px] text-slate-300"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{proof}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meta details */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800/60 pt-2 sm:pt-0 sm:pl-4 flex-shrink-0">
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {activeModalItem.filename}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeModalItem.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 border border-slate-700/50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BrandFooter />
    </div>
  );
}
