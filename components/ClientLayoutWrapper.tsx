'use client';

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { type Locale } from "@/app/i18n";

interface Props {
  children: React.ReactNode;
  locale: Locale;
}

export default function ClientLayoutWrapper({ children, locale }: Props) {
  const pathname = usePathname();
  
  // Kiểm tra xem có phải đang ở trang order hoặc checkout không (hỗ trợ đa ngôn ngữ /ja/order, /vi/checkout...)
  const isOrderOrCheckoutPage = pathname?.includes("/order") || pathname?.includes("/checkout")  || pathname?.includes("/store-select") ;

  return (
    <>
      {/* Nếu không phải trang order hoặc checkout thì mới hiện SiteHeader chung */}
      {!isOrderOrCheckoutPage && <SiteHeader locale={locale} />}
      <main>{children}</main>
    </>
  );
}