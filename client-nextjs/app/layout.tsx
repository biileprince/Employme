import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"), // In production this should be the actual domain
  title: {
    default: "Employ.me - Find Your Dream Job in Ghana",
    template: "%s | Employ.me",
  },
  description:
    "Ghana's premier job platform connecting talented job seekers with top employers across Africa.",
  keywords: ["jobs", "hiring", "Ghana", "Africa", "careers", "employment"],
  authors: [{ name: "Employ.me Team" }],
  creator: "Employ.me",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "/",
    title: "Employ.me - Find Your Dream Job in Ghana",
    description: "Ghana's premier job platform connecting talented job seekers with top employers.",
    siteName: "Employ.me",
    images: [
      {
        url: "/og-image.jpg", // A default placeholder image for sharing
        width: 1200,
        height: 630,
        alt: "Employ.me - Job Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Employ.me - Find Your Dream Job in Ghana",
    description: "Ghana's premier job platform connecting talented job seekers with top employers.",
    creator: "@employme_gh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ChatProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
