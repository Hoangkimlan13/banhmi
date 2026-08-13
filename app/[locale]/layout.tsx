import { type Metadata, type Viewport } from "next";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { type Locale } from "../i18n";
import "../globals.css";

export const metadata: Metadata = {
  title: "バインミ－サンドイッチ | Bánh Mì Sandwiches Tokyo"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;
  const currentLocale = locale as Locale;

  return (
    <html lang={currentLocale}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300,0,0"
        />
      </head>
      <body>
        <ClientLayoutWrapper locale={currentLocale}>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}