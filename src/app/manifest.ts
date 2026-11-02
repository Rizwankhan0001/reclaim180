import type { MetadataRoute } from "next";

/** Makes the app installable on phones ("Add to Home Screen"), where it opens full screen like a native app. */
export default function manifest(): MetadataRoute.Manifest {
  const icon = [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }];
  return {
    id: "/",
    name: "Reclaim 180",
    short_name: "Reclaim 180",
    description: "A private 6-month NoFap and habit tracker.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1118",
    theme_color: "#0e1a26",
    categories: ["health", "lifestyle", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the app icon (Android, and desktop) to jump straight to these.
    shortcuts: [
      { name: "I have an urge", short_name: "Urge SOS", description: "Open the breathing guide right away", url: "/dashboard?sos=1", icons: icon },
      { name: "Today's check-in", short_name: "Check in", url: "/dashboard#today", icons: icon },
    ],
  };
}
