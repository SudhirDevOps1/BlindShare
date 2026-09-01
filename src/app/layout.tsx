import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";

const appName = process.env.PUBLIC_APP_NAME || "BlindShare";

export const metadata: Metadata = {
  title: `${appName} - Zero-Knowledge Secure Document Sharing & Analytics`,
  description: "Share documents with client-side zero-knowledge encryption, page-by-page dwell tracking, dynamic watermarks, and ₹0 free tier efficiency.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/brand/icon.png",
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
  const prismId = process.env.NEXT_PUBLIC_PRISM_ANALYTICS_ID || "";
  const prismUrl = process.env.NEXT_PUBLIC_PRISM_ANALYTICS_URL || "";

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Optional PrismAnalytics Tracking Script */}
        {prismId && prismUrl ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){
try {
  var id='${prismId}', url='${prismUrl}';
  var sid=sessionStorage.getItem('pa_sid')||(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():('sid_'+Date.now()));
  sessionStorage.setItem('pa_sid',sid);
  function t(e,d){
    try {
      var q=new URLSearchParams(location.search);
      if(navigator.sendBeacon){
        navigator.sendBeacon(url,JSON.stringify({
          site_id:id,
          pathname:location.pathname,
          referrer:document.referrer||'',
          screen_size:screen.width+'x'+screen.height,
          session_id:sid,
          event_name:e||'pageview',
          event_data:d,
          utm_source:q.get('utm_source'),
          utm_medium:q.get('utm_medium'),
          utm_campaign:q.get('utm_campaign')
        }));
      }
    } catch(err){}
  }
  window.prism=t;
  t();
  var p=location.pathname;
  window.addEventListener('popstate', function(){ if(p!=location.pathname){ p=location.pathname; t(); } });
} catch(e){}
})();`,
            }}
          />
        ) : null}
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
