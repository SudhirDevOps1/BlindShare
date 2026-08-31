import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";

const appName = process.env.PUBLIC_APP_NAME || "BlindShare";

export const metadata: Metadata = {
  title: `${appName} - Zero-Knowledge Secure Document Sharing & Analytics`,
  description: "Share documents with client-side zero-knowledge encryption, page-by-page dwell tracking, dynamic watermarks, and ₹0 free tier efficiency.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/logo.svg",
    apple: "/brand/logo.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: process.env.PUBLIC_BRAND_ACCENT || "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
