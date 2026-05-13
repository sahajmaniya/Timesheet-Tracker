import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${siteConfig.url}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      images: [`${siteConfig.url}/og-image.png`],
    },
    {
      url: `${siteConfig.url}/student-assistant-timesheet-tracker`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [`${siteConfig.url}/og-image.png`],
    },
    {
      url: `${siteConfig.url}/punch-in-punch-out-web-app`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [`${siteConfig.url}/og-image.png`],
    },
    {
      url: `${siteConfig.url}/monthly-timesheet-csv-export`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [`${siteConfig.url}/og-image.png`],
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      images: [`${siteConfig.url}/og-image.png`],
    },
    {
      url: `${siteConfig.url}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      images: [`${siteConfig.url}/og-image.png`],
    },
    {
      url: `${siteConfig.url}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
      images: [`${siteConfig.url}/og-image.png`],
    },
  ];
}
