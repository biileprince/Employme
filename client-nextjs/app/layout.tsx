import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Employ.me - Find Your Dream Job in Ghana",
  description:
    "Ghana's premier job platform connecting talented job seekers with top employers",
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
