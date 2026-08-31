import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms", "/security", "/login"],
        // Share links must never be indexed by search engines.
        disallow: ["/v/", "/api/", "/dashboard/", "/admin"],
      },
    ],
  };
}
