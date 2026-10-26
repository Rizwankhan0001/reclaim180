import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reclaim 180",
    short_name: "Reclaim 180",
    description: "A private 6-month NoFap and habit tracker.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b1118",
    theme_color: "#122030",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
