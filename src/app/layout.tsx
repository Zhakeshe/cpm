import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/utils";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const title = "K.E.R.N FTC Scrimmage — Astana";
const description =
  "Регистрация школьных FTC-команд на K.E.R.N FTC Scrimmage в Астане.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title,
  description,
  applicationName: "K.E.R.N FTC Scrimmage",
  keywords: [
    "FTC",
    "FIRST Tech Challenge",
    "scrimmage",
    "K.E.R.N School",
    "Astana",
    "робототехника",
  ],
  authors: [{ name: "K.E.R.N School" }],
  openGraph: {
    title,
    description,
    type: "website",
    locale: "ru_KZ",
    siteName: "K.E.R.N FTC Scrimmage",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#062D59",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
