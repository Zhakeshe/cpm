import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";

export const metadata: Metadata = {
  title: "Amanat CRM",
  description: "CRM для отдела продаж: клиенты, WhatsApp, звонки, воронка",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
