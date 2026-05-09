import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = "https://wedding-site-rose-gamma.vercel.app";
const ogImageUrl = `${siteUrl}/gallery/OG_image.png`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Jonathan & Ramita Wedding",
  description: "Wedding Invitation — January 17, 2027",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Jonathan & Ramita Wedding",
    description: "Wedding Invitation — January 17, 2027",
    url: siteUrl,
    siteName: "Jonathan & Ramita Wedding",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Jonathan & Ramita Wedding",
        type: "image/png",
      },
    ],
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jonathan & Ramita Wedding",
    description: "Wedding Invitation — January 17, 2027",
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}