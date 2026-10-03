import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PhoneHost } from "@/components/PhoneHost";
import { I18nProvider } from "@/components/I18nProvider";

export const metadata: Metadata = {
  title: "Quantum CRM",
  description: "CRM для отдела продаж пылесосов: клиенты, WhatsApp, КП, воронка",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <I18nProvider>{children}<PhoneHost /></I18nProvider>
      </body>
    </html>
  );
}
