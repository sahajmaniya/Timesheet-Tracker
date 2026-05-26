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
      images: [
        `${siteConfig.url}/og-image.png`,
        `${siteConfig.url}/hero-dashboard-light.png`,
        `${siteConfig.url}/hero-dashboard.png`,
        `${siteConfig.url}/logo-mark-1024.svg`,
      ],
    },
    {
      url: `${siteConfig.url}/student-assistant-timesheet-tracker`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [`${siteConfig.url}/preview-pdf-output-light.png`, `${siteConfig.url}/preview-pdf-output.png`],
    },
    {
      url: `${siteConfig.url}/punch-in-punch-out-web-app`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [`${siteConfig.url}/preview-entries-light.png`, `${siteConfig.url}/preview-entries.png`],
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
      images: [`${siteConfig.url}/logo-wordmark-light.svg`, `${siteConfig.url}/logo-wordmark-dark.svg`],
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
