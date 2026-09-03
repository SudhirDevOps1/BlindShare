import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blind-share.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms", "/contact", "/login", "/signup"],
        disallow: ["/dashboard/", "/admin/", "/api/", "/v/"],
      },
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "PerplexityBot",
          "Applebot",
        ],
        allow: ["/", "/privacy", "/terms", "/contact", "/login", "/signup"],
        disallow: ["/dashboard/", "/admin/", "/api/", "/v/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
