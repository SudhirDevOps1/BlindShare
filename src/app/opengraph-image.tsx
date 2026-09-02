import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "BlindShare - Zero-Knowledge Secure Document Sharing & Deep Reading Analytics";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#070b14",
          backgroundImage:
            "radial-gradient(ellipse at 50% 15%, rgba(245, 158, 11, 0.22) 0%, transparent 60%), radial-gradient(ellipse at 85% 85%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)",
          padding: "54px 64px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top bar with Badge and Version */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo + Brand Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(245, 158, 11, 0.4)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="#1e293b" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#1e293b" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "40px",
                fontWeight: 900,
                color: "#f8fafc",
                letterSpacing: "-0.03em",
              }}
            >
              BlindShare
            </span>
          </div>

          {/* Security & Zero Cost Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: "999px",
              padding: "10px 22px",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#fbbf24",
                boxShadow: "0 0 10px #fbbf24",
              }}
            />
            <span
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#fbbf24",
                letterSpacing: "0.04em",
              }}
            >
              v1.3.0 E2EE • ₹0 FREE TIER • 100% ZK
            </span>
          </div>
        </div>

        {/* Center Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "1060px",
          }}
        >
          <div
            style={{
              fontSize: "52px",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              marginBottom: "18px",
            }}
          >
            Zero-Knowledge Document Sharing &{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #f59e0b, #fde68a)",
                backgroundClip: "text",
                color: "#f59e0b",
              }}
            >
              Deep Reading Analytics
            </span>
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: 500,
              color: "#94a3b8",
              lineHeight: 1.5,
              maxWidth: "920px",
            }}
          >
            Browser-side AES-GCM-256 WebCrypto • RFC 3986 URL Fragment Key • Per-Page Dwell Time • Dynamic Watermarks • MIT Open Source
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
          }}
        >
          {[
            { label: "🔒 Client-Side AES-256", col: "#fbbf24" },
            { label: "⚡ Server is Blind Courier", col: "#34d399" },
            { label: "📊 Page-Level Sparklines", col: "#60a5fa" },
            { label: "🛡️ 20 Security Tests Passing", col: "#a78bfa" },
            { label: "⭐ GitHub Open Source", col: "#f87171" },
          ].map((b) => (
            <div
              key={b.label}
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(51, 65, 85, 0.7)",
                borderRadius: "14px",
                padding: "10px 20px",
                fontSize: "15px",
                fontWeight: 700,
                color: b.col,
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              {b.label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
