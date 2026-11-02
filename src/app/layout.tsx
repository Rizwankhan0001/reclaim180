import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { InlineScript } from "@/components/inline-script";
import { installScript, lookScript } from "@/lib/look";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "600"] });

const description =
  "A private 6-month NoFap tracker: live streak clock, daily habits, a 182-day calendar, urge SOS and progress charts.";

export const metadata: Metadata = {
  title: { default: "Reclaim 180", template: "%s · Reclaim 180" },
  description,
  applicationName: "Reclaim 180",
  appleWebApp: { capable: true, title: "Reclaim 180", statusBarStyle: "default" },
  openGraph: { type: "website", siteName: "Reclaim 180", title: "Reclaim 180", description },
  twitter: { card: "summary", title: "Reclaim 180", description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The on-screen keyboard shrinks the page instead of covering it, so bottom bars and fields stay visible.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf1f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1118" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script may set data-theme / data-accent before React loads, so <html> can differ from the server render.
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable} h-full`} suppressHydrationWarning>
      <head>
        <InlineScript html={`${lookScript};${installScript}`} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
