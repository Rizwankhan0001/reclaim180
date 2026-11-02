import type { MetadataRoute } from "next";

/** Search engines can index the public pages, never anyone's tracker. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/settings", "/onboarding", "/api/"] },
  };
}
