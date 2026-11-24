import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AgentBridge } from "@/components/AgentBridge";

export const metadata: Metadata = {
  title: "MyWeddingTrips — Wedding Travel Tracker",
  description: "Track flights, hotels, and gifts across all your wedding trips in one place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyWeddingTrips",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <AgentBridge />
        {children}
      </body>
    </html>
  );
}
