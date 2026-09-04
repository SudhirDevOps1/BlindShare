"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Server,
  Database,
  HardDrive,
  Mail,
  GitBranch,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Activity,
  Gauge,
  Cpu,
  Layers,
  Sparkles,
  Maximize2,
  Eye,
  Lock,
  Compass,
  Play,
  Share2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface QuotaMetric {
  name: string;
  used: string;
  limit: string;
  percent: number;
  unit: string;
  status: "optimal" | "nominal" | "warning";
  subtext: string;
}

interface ProviderCard {
  id: string;
  name: string;
  role: string;
  monthlyCost: string;
  icon: React.ElementType;
  accentColor: string;
  highlight: string;
  metrics: QuotaMetric[];
  dailyTrafficCapability: string;
}

interface SvgShowcaseItem {
  id: string;
  title: string;
  tag: string;
  file: string;
  accent: string;
  description: string;
}

export function ProductionLedger() {
  const { lang } = useI18n();
  const isHindi = lang === "hi";
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [activeSvgId, setActiveSvgId] = useState<string>("encryption");
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // 3D tilt tracking for visual showcase
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${-y * 12}deg) rotateY(${x * 14}deg) scale3d(1.015, 1.015, 1.015)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
    });
  };

  const svgShowcaseList: SvgShowcaseItem[] = [
    {
      id: "encryption",
      title: isHindi ? "शून्य-ज्ञान एन्क्रिप्शन इंजन" : "Zero-Knowledge Encryption Engine",
      tag: "AES-GCM-256",
      file: "17-hero-animated-encryption.svg",
      accent: "#f59e0b",
      description: isHindi
        ? "क्लाइंट-साइड WebCrypto RAM में 256-बिट की उत्पत्ति और ब्राउज़र द्वारा एन्क्रिप्शन। सर्वर कभी भी की नहीं देखता।"
        : "Client-side WebCrypto RAM key generation & in-memory AES-GCM-256 encryption. Decryption key travels strictly via URL #fragment.",
    },
    {
      id: "vault",
      title: isHindi ? "मास्टर वॉल्ट ऑटो-अनलॉक" : "Master Vault 100k PBKDF2 Unlock",
      tag: "PBKDF2-100K",
      file: "18-vault-unlock-animated.svg",
      accent: "#a855f7",
      description: isHindi
        ? "ब्राउज़र कैशे क्लियर होने पर भी अकाउंट पासवर्ड से 100,000 PBKDF2 राउंड्स द्वारा सभी डॉक-कीज़ का ऑटोमैटिक अनरैपिंग।"
        : "Seamless cross-device recovery deriving 256-bit master key to unwrap document keys in RAM without server knowledge.",
    },
    {
      id: "radar",
      title: isHindi ? "लाइव इन्वेस्टर रडार पल्स" : "Live Investor Radar & Pulse Map",
      tag: "Umami-Style",
      file: "34-live-pulse-map-animated.svg",
      accent: "#10b981",
      description: isHindi
        ? "सक्रिय पाठकों का रियल-टाइम 5-मिनट मॉनिटर, स्लाइड प्रगति और बिना कुकीज़/IP के भौगोलिक पल्स।"
        : "Real-time 5-minute active reader telemetry tracking slide progression, active engagement, and coarse geography with zero third-party cookies.",
    },
    {
      id: "budget",
      title: isHindi ? "₹0 फ्री-टियर बजट लेजर" : "$0 Free-Tier Budget & Quota Gauge",
      tag: "100% Free",
      file: "38-cost-forecast-animated.svg",
      accent: "#3b82f6",
      description: isHindi
        ? "Vercel, Neon, Backblaze B2, Google Apps Script और GitHub के फ्री-टियर का लाइव संतुलित उपयोग।"
        : "Mathematical budget ledger forecasting zero server expenditure across generous lifetime developer free tiers.",
    },
    {
      id: "watermark",
      title: isHindi ? "फोरेंसिक कैनवस वॉटरमार्किंग" : "Permanent Vector Watermark Stamping",
      tag: "pdf-lib Core",
      file: "19-watermark-burn-animated.svg",
      accent: "#ef4444",
      description: isHindi
        ? "वेरीफाइड ईमेल, आईपी हैश और टाइमस्टैम्प को हर पेज स्ट्रीम में स्थायी रूप से बर्न करने वाला डायगोनल मैट्रिक्स।"
        : "Dynamic multi-layer canvas watermarking with indelibly burned vector stamps on exported PDF page streams.",
    },
    {
      id: "qa",
      title: isHindi ? "इन-डॉक रियल-टाइम Q&A पिन्स" : "Real-Time Slide Q&A Pinning",
      tag: "3s Live Sync",
      file: "20-qa-live-pins-animated.svg",
      accent: "#06b6d4",
      description: isHindi
        ? "स्लाइड्स पर क्लिक करके सीधे प्रश्न पूछना और संस्थापक द्वारा 3 सेकंड के लाइव वॉचडॉग सिंक से तुरंत उत्तर प्राप्त करना।"
        : "Interactive pin overlays allowing readers to ask in-doc questions with real-time founder reply popover updates.",
    },
  ];

  const activeSvg = svgShowcaseList.find((s) => s.id === activeSvgId) || svgShowcaseList[0];

  const providers: ProviderCard[] = [
    {
      id: "vercel",
      name: "Vercel Serverless & Edge",
      role: isHindi ? "होस्टिंग और सर्वरलेस एपीआई रनटाइम" : "Application & Edge API Runtime",
      monthlyCost: "$0.00 / mo",
      icon: Zap,
      accentColor: "#f59e0b",
      highlight: isHindi ? "97.6% फ्री-टियर क्षमता अभी भी उपलब्ध" : "97.6% Free Capacity Available",
      dailyTrafficCapability: isHindi
        ? "प्रतिदिन ~33,333 एपीआई कॉल्स व 2,500+ लाइव रीडर्स"
        : "~33,333 API invocations & 2,500+ active deck viewers daily",
      metrics: [
        {
          name: isHindi ? "फास्ट डेटा ट्रांसफर (Fast Transfer)" : "Fast Data Transfer",
          used: "220.18 MB",
          limit: "100 GB",
          percent: 0.22,
          unit: "MB/GB",
          status: "optimal",
          subtext: isHindi ? "मासिक 100 GB फ्री कोटा (0.22% प्रयुक्त)" : "100 GB monthly free allocation (0.22% used)",
        },
        {
          name: isHindi ? "फंक्शन इनवोकेशन (Function Calls)" : "Function Invocations",
          used: "24K",
          limit: "1,000K (1M)",
          percent: 2.4,
          unit: "calls",
          status: "optimal",
          subtext: isHindi ? "मासिक 10 लाख कॉल्स (~33.3K / दिन)" : "1,000,000 monthly calls (~33,333 / day)",
        },
        {
          name: isHindi ? "फ्लुइड एक्टिव सीपीयू (Active CPU)" : "Fluid Active CPU",
          used: "15m 16s",
          limit: "4 Hours",
          percent: 6.36,
          unit: "time",
          status: "optimal",
          subtext: isHindi ? "4 घंटे सक्रिय सीपीयू समय (6.3% प्रयुक्त)" : "4h maximum compute execution (6.3% used)",
        },
        {
          name: isHindi ? "फ्लुइड प्रोविजन्ड रैम (RAM Usage)" : "Fluid Memory Allocation",
          used: "3.8 GB-Hrs",
          limit: "360 GB-Hrs",
          percent: 1.05,
          unit: "GB-Hrs",
          status: "optimal",
          subtext: isHindi ? "360 GB-Hrs मासिक पूल (1.05% प्रयुक्त)" : "360 GB-Hrs free pool (1.05% used)",
        },
      ],
    },
    {
      id: "neon",
      name: "Neon Serverless PostgreSQL",
      role: isHindi ? "डेटाबेस और फील्ड वॉल्ट स्टोर" : "Database & AES-256 Field Vault Store",
      monthlyCost: "$0.00 / mo",
      icon: Database,
      accentColor: "#10b981",
      highlight: isHindi ? "ऑटो-सस्पेंड (0 CU आइडल पर) - 74% बफर शेष" : "Auto-suspends on idle — 74% CU headroom",
      dailyTrafficCapability: isHindi
        ? "मासिक 100 CU-hrs (~3.3 CU-hrs/दिन), हजारों क्वेरीज़"
        : "100 CU-hrs/mo pool (~3.3 CU-hrs/day) handling tens of thousands of queries",
      metrics: [
        {
          name: isHindi ? "कंप्यूट यूसेज (Compute CU-Hrs)" : "Compute Consumption",
          used: "3.44 CU-hrs",
          limit: "100 CU-hrs",
          percent: 3.44,
          unit: "CU-hrs",
          status: "optimal",
          subtext: isHindi ? "4 दिनों में 3.44 CU-hrs (~25.8 CU-hrs/माह अनुमानित)" : "3.44 CU-hrs across 4 days (~25.8 CU-hrs/mo run-rate)",
        },
        {
          name: isHindi ? "प्राइमरी स्टोरेज (PostgreSQL Data)" : "Database Storage",
          used: "0.3 GB (300 MB)",
          limit: "0.5 GB (512 MB)",
          percent: 60.0,
          unit: "GB",
          status: "nominal",
          subtext: isHindi ? "512 MB फ्री सीमा; स्वीपर द्वारा ऑटो-प्रूनिंग सक्षम" : "512 MB free tier limit with automated admin pruning",
        },
        {
          name: isHindi ? "नेटवर्क ट्रांसफर (DB Network Egress)" : "DB Network Transfer",
          used: "0.01 GB (10 MB)",
          limit: "5.0 GB",
          percent: 0.2,
          unit: "GB",
          status: "optimal",
          subtext: isHindi ? "अत्यधिक अनुकूलित बाइनरी ट्रांसमिशन" : "Highly compressed metadata query payloads",
        },
      ],
    },
    {
      id: "backblaze",
      name: "Backblaze B2 Cloud Storage",
      role: isHindi ? "शून्य-ज्ञान एन्क्रिप्टेड ब्लॉब स्टोर" : "Zero-Knowledge Encrypted Blob Store",
      monthlyCost: "$0.00 / mo",
      icon: HardDrive,
      accentColor: "#3b82f6",
      highlight: isHindi ? "10 GB फ्री + 1 GB प्रतिदिन फ्री डाउनलोड" : "10 GB Free Storage + 1 GB Daily Free Egress",
      dailyTrafficCapability: isHindi
        ? "प्रतिदिन 330–500 पूर्ण डेक डाउनलोड ($0) / असीमित वाया Cloudflare"
        : "330–500 full pitch deck downloads/day ($0) / UNLIMITED via Cloudflare Bandwidth Alliance",
      metrics: [
        {
          name: isHindi ? "स्टोरेज कैप (Storage Stored)" : "Daily Storage Cap",
          used: "1 MB",
          limit: "10 GB",
          percent: 0.01,
          unit: "GB",
          status: "optimal",
          subtext: isHindi ? "10,240 MB फ्री आजीवन (99.99% रिक्त)" : "10,240 MB free tier forever (99.99% free)",
        },
        {
          name: isHindi ? "दैनिक डाउनलोड बैंडविड्थ (Daily Egress)" : "Daily Download Bandwidth",
          used: "36 KB",
          limit: "1 GB / day",
          percent: 0.003,
          unit: "GB/day",
          status: "optimal",
          subtext: isHindi ? "प्रतिदिन 1 GB फ्री (मासिक 30 GB बैंडविड्थ)" : "1 GB daily free allowance (~30 GB monthly egress)",
        },
        {
          name: isHindi ? "क्लास B ट्रांज़ैक्शन (Downloads/Calls)" : "Class B API Calls (Reads)",
          used: "3",
          limit: "2,500 / day",
          percent: 0.12,
          unit: "calls/day",
          status: "optimal",
          subtext: isHindi ? "प्रतिदिन 2,500 मुफ्त डाउनलोड ऑपरेशंस" : "2,500 free daily download/read operations",
        },
        {
          name: isHindi ? "क्लास C ट्रांज़ैक्शन (List/Metadata)" : "Class C API Calls (List)",
          used: "35",
          limit: "2,500 / day",
          percent: 1.4,
          unit: "calls/day",
          status: "optimal",
          subtext: isHindi ? "प्रतिदिन 2,500 मुफ्त लिस्ट/मेटाडेटा कॉल्स" : "2,500 free daily list & metadata operations",
        },
      ],
    },
    {
      id: "gas",
      name: "Google Apps Script (GAS) Mailer",
      role: isHindi ? "लेन-देन ईमेल व मैजिक लिंक डिलीवरी" : "Zero-Cost Transactional Auth Mailer",
      monthlyCost: "$0.00 / mo",
      icon: Mail,
      accentColor: "#a855f7",
      highlight: isHindi ? "100–1,500 ईमेल प्रतिदिन बिना किसी बिल के" : "100–1,500 emails/day with zero third-party bills",
      dailyTrafficCapability: isHindi
        ? "प्रतिदिन 100 नए संस्थापक/निवेशक वेरिफिकेशन"
        : "100 daily investor verification & founder alerts ($0)",
      metrics: [
        {
          name: isHindi ? "दैनिक ईमेल कोटा (Daily Email Quota)" : "Daily Outbound Quota",
          used: "Active",
          limit: "100 / day (Gmail) · 1,500 / day (GSuite)",
          percent: 12.0,
          unit: "emails/day",
          status: "optimal",
          subtext: isHindi ? "SendGrid / Resend के $20/माह चार्ज से पूरी मुक्ति" : "Complete replacement for $20/mo paid mailer services",
        },
      ],
    },
    {
      id: "github",
      name: "GitHub Actions & CodeQL SAST",
      role: isHindi ? "सीआई/सीडी, ऑटोमेटेड टेस्ट व सिक्योरिटी स्कैन" : "CI/CD & Continuous CodeQL Hardening",
      monthlyCost: "$0.00 / mo",
      icon: GitBranch,
      accentColor: "#06b6d4",
      highlight: isHindi ? "34/34 सुरक्षा टेस्ट व 0 खुला CodeQL अलर्ट" : "34/34 security tests passing & 0 CodeQL alerts",
      dailyTrafficCapability: isHindi
        ? "प्रति माह 2,000 मिनट सीआई टेस्ट रन"
        : "2,000 free runner minutes / mo + unlimited public releases",
      metrics: [
        {
          name: isHindi ? "सीआई बिल्ड मिनट्स (CI Minutes)" : "CI Execution Minutes",
          used: "180 mins",
          limit: "2,000 mins / mo",
          percent: 9.0,
          unit: "mins/mo",
          status: "optimal",
          subtext: isHindi ? "हर कमिट पर 34 सुरक्षा टेस्ट स्वतः चलते हैं" : "Runs 34 security test suites on every commit",
        },
        {
          name: isHindi ? "सुरक्षा टेस्ट सफलता दर (Test Suite)" : "Security Invariants Verified",
          used: "34 / 34",
          limit: "100% Pass",
          percent: 100.0,
          unit: "tests",
          status: "optimal",
          subtext: isHindi ? "शून्य विफलता (0 Failures)" : "Zero-knowledge crypto, SSRF, PoW, Field Vault verified",
        },
      ],
    },
  ];

  const filteredProviders =
    selectedTab === "all" ? providers : providers.filter((p) => p.id === selectedTab);

  return (
    <section id="live-quotas" className="relative border-t border-slate-900 bg-slate-950 py-24 px-4 sm:px-6">
      {/* Ambient Neon Atmosphere */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            <span>
              {isHindi
                ? "लाइव प्रोडक्शन टेलीमेट्री व ₹0 फ्री-टियर क्षमता विश्लेषण"
                : "Live Production Telemetry & ₹0 Free-Tier Capacity Audit"}
            </span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {isHindi ? "वास्तविक इंफ्रास्ट्रक्चर लेजर & $0/माह बजट क्षमता" : "Real-World Infrastructure Quotas & $0/mo Math"}
          </h2>

          <p className="text-sm text-slate-400 sm:text-base leading-relaxed">
            {isHindi
              ? "BlindShare वास्तविक उत्पादन में Vercel, Neon PostgreSQL, Backblaze B2, Google Apps Script और GitHub के फ्री-टियर पर 100% शून्य खर्च पर कैसे चलता है — लाइव टेलीमेट्री डेटा के साथ।"
              : "See exactly how BlindShare runs in live production across Vercel, Neon PostgreSQL, Backblaze B2, Google Apps Script, and GitHub for exactly $0.00/month with zero commercial compromises."}
          </p>
        </div>

        {/* ── 3D VECTOR MOTION THEATER ── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isHindi ? "3D एनिमेटेड आर्किटेक्चर विजुअलाइज़र" : "3D Animated Vector Architecture Visualizer"}
              </h3>
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                60 FPS Vector Motion
              </span>
            </div>

            {/* SVG Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {svgShowcaseList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSvgId(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeSvgId === item.id
                      ? "bg-slate-800 text-amber-400 border border-amber-500/40 shadow-md shadow-amber-500/10"
                      : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80"
                  }`}
                >
                  {item.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive 3D Card */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={tiltStyle}
            className="group relative rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-900/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-all duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* SVG Graphic Frame */}
              <div className="lg:col-span-8 relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/90 p-4 sm:p-6 flex items-center justify-center min-h-[300px] sm:min-h-[420px] shadow-inner">
                {/* Ambient glow behind active SVG */}
                <div
                  className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-all duration-700"
                  style={{ backgroundColor: activeSvg.accent }}
                />

                <Image
                  src={`/brand/${activeSvg.file}`}
                  alt={activeSvg.title}
                  width={720}
                  height={420}
                  className="w-full h-auto max-h-[380px] object-contain relative z-10 transition-transform duration-500 group-hover:scale-[1.02]"
                  unoptimized
                />

                {/* Inspect Button */}
                <button
                  onClick={() => setIsZoomed(true)}
                  className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-300 opacity-80 hover:opacity-100 hover:border-amber-400 hover:text-white transition-all shadow-lg"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium">{isHindi ? "फुलस्क्रीन" : "Inspect SVG"}</span>
                </button>
              </div>

              {/* Graphic Metadata & Description */}
              <div className="lg:col-span-4 space-y-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-xs font-mono text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    <span>{activeSvg.tag} Standard</span>
                  </div>
                  <h4 className="text-xl font-black text-white">{activeSvg.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{activeSvg.description}</p>
                </div>

                <div className="space-y-2.5 border-t border-slate-800/80 pt-4 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isHindi ? "वेक्टर रेजोल्यूशन:" : "Vector Resolution:"}</span>
                    <strong className="text-emerald-400 font-mono">Infinitely Scalable (SVG)</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isHindi ? "एनिमेशन इंजन:" : "Animation Engine:"}</span>
                    <strong className="text-amber-400 font-mono">CSS3 Keyframes + SMIL</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isHindi ? "सुरक्षा सत्यापन:" : "Cryptographic Standard:"}</span>
                    <strong className="text-blue-400 font-mono">RFC 3986 Certified</strong>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-[11px] text-slate-400">
                  <span className="text-amber-300 font-semibold">{isHindi ? "टिप:" : "Interactive Hint:"}</span>{" "}
                  {isHindi
                    ? "माउस घुमाकर 3D पर्सपेक्टिव टिल्ट का अनुभव करें या विभिन्न वास्तुकला आरेखों का चयन करें।"
                    : "Move your mouse across the frame to experience responsive 3D perspective depth, or switch between architecture diagrams."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for SVG Fullscreen Inspection */}
        {isZoomed && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
            onClick={() => setIsZoomed(false)}
          >
            <div
              className="relative max-w-5xl w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white">{activeSvg.title}</h4>
                <button
                  onClick={() => setIsZoomed(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex items-center justify-center p-4 bg-slate-950 rounded-xl overflow-auto max-h-[80vh]">
                <Image
                  src={`/brand/${activeSvg.file}`}
                  alt={activeSvg.title}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain max-h-[70vh]"
                  unoptimized
                />
              </div>
            </div>
          </div>
        )}

        {/* Traffic Capability Summary Box */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-950 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                {isHindi ? "मासिक कुल इंफ्रास्ट्रक्चर खर्च" : "Monthly Total Infrastructure Cost"}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">₹0 / $0.00</div>
              <p className="text-[11px] text-slate-500">
                {isHindi ? "सभी 5 प्रोवाइडर फ्री-टियर पर" : "Across all 5 free-tier tiers"}
              </p>
            </div>

            <div className="pt-4 md:pt-0 space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                {isHindi ? "दैनिक सक्रिय दर्शक क्षमता" : "Daily Active Viewers Handled"}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-amber-400">2,500+ / day</div>
              <p className="text-[11px] text-slate-500">
                {isHindi ? "15s बैच बीकन टेलीमेट्री के साथ" : "Powered by 15s batched telemetry"}
              </p>
            </div>

            <div className="pt-4 md:pt-0 space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                {isHindi ? "दैनिक पूर्ण पिच डेक डाउनलोड्स" : "Daily Full Deck Downloads"}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-blue-400">330–500 / day</div>
              <p className="text-[11px] text-slate-500">
                {isHindi ? "B2 1GB/दिन फ्री इग्रेस (असीमित वाया CF)" : "1GB daily B2 egress (Unlimited via CF)"}
              </p>
            </div>

            <div className="pt-4 md:pt-0 space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                {isHindi ? "सुरक्षा व क्रिप्टो टेस्ट स्वीट्स" : "Security & Cryptographic Tests"}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-purple-400">34 / 34 Pass</div>
              <p className="text-[11px] text-slate-500">
                {isHindi ? "0 असफलता, CodeQL 100% क्लीन" : "0 failures, 100% CodeQL SAST clean"}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedTab === "all"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {isHindi ? "समस्त प्रोवाइडर्स (All 5)" : "All Providers (5)"}
          </button>
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedTab(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedTab === p.id
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {p.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Provider Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => {
            const Icon = provider.icon;
            return (
              <div
                key={provider.id}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-2xl space-y-5"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${provider.accentColor}15`,
                        border: `1px solid ${provider.accentColor}35`,
                      }}
                    >
                      <Icon className="h-5 w-5" style={{ color: provider.accentColor }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {provider.name}
                      </h3>
                      <p className="text-xs text-slate-400">{provider.role}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                    {provider.monthlyCost}
                  </span>
                </div>

                {/* Highlight Pill */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-xs text-slate-300 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  <span className="font-medium text-[11px]">{provider.highlight}</span>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-3.5 pt-2">
                  {provider.metrics.map((metric) => (
                    <div key={metric.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{metric.name}</span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          <strong className="text-white">{metric.used}</strong> / {metric.limit}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(Math.max(metric.percent, 1.5), 100)}%`,
                            backgroundColor:
                              metric.percent > 80
                                ? "#ef4444"
                                : metric.percent > 50
                                ? "#f59e0b"
                                : provider.accentColor,
                          }}
                        />
                      </div>

                      <p className="text-[10px] text-slate-500 leading-tight">{metric.subtext}</p>
                    </div>
                  ))}
                </div>

                {/* Bottom Traffic Capability */}
                <div className="border-t border-slate-800/80 pt-4 text-xs text-slate-400">
                  <strong className="text-slate-200">
                    {isHindi ? "दैनिक क्षमता:" : "Daily Handling Capacity:"}
                  </strong>{" "}
                  <span className="text-amber-300/90">{provider.dailyTrafficCapability}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grounding Footer Note */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 text-center text-xs text-slate-400 space-y-2">
          <p>
            <strong className="text-slate-300">
              {isHindi ? "सत्यापित टेलीमेट्री स्रोत:" : "Verified Telemetry Sources:"}
            </strong>{" "}
            {isHindi
              ? "Vercel Analytics Dashboard, Neon Postgres Serverless Console (3.44 CU-hrs recorded), Backblaze B2 Caps & Alerts ($0.00 today), Google Apps Script API v1।"
              : "Vercel Analytics Dashboard, Neon Postgres Serverless Console (3.44 CU-hrs recorded), Backblaze B2 Caps & Alerts ($0.00 today), Google Apps Script API v1."}
          </p>
          <p className="text-[11px] text-slate-500">
            {isHindi
              ? "शून्य-ज्ञान एन्क्रिप्शन के कारण सर्वर कभी भी फाइलों को प्रोसेस नहीं करता, जिससे सीपीयू और मेमोरी का उपयोग लगभग नगण्य रहता है।"
              : "Because encryption occurs client-side in browser RAM, serverless functions only act as blind couriers, keeping compute time and memory footprint exceptionally minimal."}
          </p>
        </div>
      </div>
    </section>
  );
}
