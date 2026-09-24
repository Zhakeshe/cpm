import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope, Roboto } from "next/font/google";
import "./globals.css";
import { siteUrl, withBase } from "@/lib/utils";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const buzz = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-buzz",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const title = "K.E.R.N: NoRegrets Scrimmage — 24 сентября 2026 · 18:00";
const description =
  "Регистрация школьных FTC-команд на K.E.R.N: NoRegrets Scrimmage в Астане. 24 сентября 2026, начало в 18:00. Сезон BIOBUZZ 2026–2027.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title,
  description,
  applicationName: "K.E.R.N: NoRegrets Scrimmage",
  keywords: [
    "FTC",
    "BIOBUZZ",
    "FIRST Tech Challenge",
    "scrimmage",
    "K.E.R.N School",
    "Astana",
  ],
  authors: [{ name: "K.E.R.N School" }],
  openGraph: {
    title,
    description,
    type: "website",
    locale: "ru_KZ",
    siteName: "K.E.R.N: NoRegrets Scrimmage",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  icons: {
    icon: [
      { url: withBase("/favicon.ico") },
      { url: withBase("/favicon-32.png"), sizes: "32x32", type: "image/png" },
    ],
    apple: withBase("/apple-touch-icon.png"),
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
    <html lang="ru" className={`${manrope.variable} ${buzz.variable} ${roboto.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
