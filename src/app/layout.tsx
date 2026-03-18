import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "PunchPilot | Timesheet Tracker",
    template: "%s | PunchPilot",
  },
  description: siteConfig.description,
  applicationName: "PunchPilot",
  keywords: [...siteConfig.keywords],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: "PunchPilot | Timesheet Tracker",
    description: siteConfig.description,
    siteName: "PunchPilot",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "PunchPilot timesheet tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PunchPilot | Timesheet Tracker",
    description: siteConfig.description,
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "lEwxjLyG2bIDUAe528othiE9gHh8KrTSfAAw1yWwcVE",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
