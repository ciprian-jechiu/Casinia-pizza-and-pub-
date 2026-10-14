import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://casinia.md";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/ro/admin", "/ru/admin", "/en/admin"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
