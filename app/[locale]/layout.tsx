import { type Metadata, type Viewport } from "next";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { type Locale } from "../i18n";
import "../globals.css";

export const metadata: Metadata = {
  title: "バインミ－サンドイッチ | Bánh Mì Sandwiches Tokyo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;
  const currentLocale = locale as Locale;

  return (
    <ClientLayoutWrapper locale={currentLocale}>
      {children}
    </ClientLayoutWrapper>
  );
}