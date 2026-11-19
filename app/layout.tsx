import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Schibsted_Grotesk } from "next/font/google";

import { site } from "@/lib/site";

import "./globals.css";

// Bodoni for the verse: a didone cut in Blake's own decade. Schibsted Grotesk for everything else.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: `${site.name}. ${site.slogan}.`,
  icons: { icon: { url: "/tiger-logo.svg", type: "image/svg+xml" } },
  openGraph: {
    title: site.name,
    description: `${site.slogan}.`,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06090a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodoni.variable} ${schibsted.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
