import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { CookieConsentBanner } from "@/components/compliance/cookie-consent-banner";
import { BroadcastBanner } from "@/components/compliance/broadcast-banner";
import { CryptoCursor } from "@/components/cursor/crypto-cursor";

const appName = process.env.PUBLIC_APP_NAME || "BlindShare";
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blind-share.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} - Zero-Knowledge Secure Document Sharing & Analytics`,
    template: `%s | ${appName}`,
  },
  description: "Share pitch decks and confidential documents with client-side Zero-Knowledge AES-GCM-256 encryption, per-page reading dwell time analytics, dynamic watermarking, and ₹0 free-tier efficiency.",
  keywords: [
    "Zero-Knowledge document sharing",
    "DocSend alternative",
    "open source DocSend alternative",
    "client-side E2EE encryption",
    "AES-GCM-256 WebCrypto",
    "pitch deck analytics",
    "page by page dwell time tracking",
    "dynamic watermarks",
    "forensic watermarking",
    "virtual data rooms",
    "secure file sharing",
    "investor pitch deck tracker",
    "free tier document sharing",
    "open source document analytics",
    "blind courier cloud storage",
  ],
  authors: [{ name: "BlindShare Team", url: siteUrl }],
  creator: "BlindShare",
  publisher: "BlindShare",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: `${appName} - Zero-Knowledge Secure Document Sharing & Analytics`,
    description: "Privacy-first Zero-Knowledge document sharing with client-side AES-GCM-256 encryption, page-by-page reading dwell analytics, and dynamic watermarks on a 100% ₹0 free tier.",
    url: siteUrl,
    siteName: appName,
    images: [
      {
        url: `${siteUrl}/brand/og-image.png`,
        secureUrl: `${siteUrl}/brand/og-image.png`,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: `${appName} Zero-Knowledge Document Sharing`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} - Zero-Knowledge Secure Document Sharing & Analytics`,
    description: "Client-side E2EE document sharing with per-page dwell time tracking, dynamic watermarks, and ₹0 free-tier presets.",
    images: [
      {
        url: `${siteUrl}/brand/og-image.png`,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: `${appName} Zero-Knowledge Document Sharing`,
      },
    ],
    creator: "@BlindShare",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/02-favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/brand/02-favicon.svg",
    apple: "/brand/02-favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: process.env.PUBLIC_BRAND_ACCENT || "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "BlindShare",
      "operatingSystem": "Web, iOS, Android, macOS, Windows, Linux",
      "applicationCategory": "SecurityApplication, BusinessApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "description": "Zero-Knowledge client-side encrypted document sharing platform with per-page reading analytics and dynamic watermarks.",
      "url": "https://blind-share.vercel.app",
      "featureList": [
        "Client-side WebCrypto AES-GCM-256 Encryption",
        "URL Fragment Key Transport (RFC 3986)",
        "Per-Page Dwell Time Sparklines",
        "Dynamic Forensic Watermarking",
        "Virtual Data Rooms (VDR)",
        "Zero-Cost Cloud Preset Architecture",
      ],
    },
    {
      "@type": "Organization",
      "name": "BlindShare",
      "url": "https://blind-share.vercel.app",
      "logo": "https://blind-share.vercel.app/brand/02-favicon.svg",
      "sameAs": ["https://github.com/SudhirDevOps1/BlindShare"],
    },
    {
      "@type": "WebSite",
      "name": "BlindShare",
      "url": "https://blind-share.vercel.app",
    },
  ],
};

import { PrismTracker } from "@/components/analytics/prism-tracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data Schema for Google & AI Web Indexing */}
        <script
          id="jsonld-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body
        className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200"
        suppressHydrationWarning
      >
        <I18nProvider>
          {/* First-party privacy-safe telemetry proxy gated strictly by blindshare_cookie_consent_v1 */}
          <PrismTracker />
          <CryptoCursor />
          <BroadcastBanner />
          {children}
          <CookieConsentBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
