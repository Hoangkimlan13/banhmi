import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "./app/i18n";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =========================================================
  // STORE MANAGER
  // Không sử dụng hệ thống đa ngôn ngữ.
  // Giữ nguyên URL /store-manager/*
  // =========================================================
  if (
    pathname === "/store-manager" ||
    pathname.startsWith("/store-manager/")
  ) {
    return NextResponse.next();
  }

  // =========================================================
  // KIỂM TRA LOCALE
  // Ví dụ:
  // /ja
  // /ja/order
  // /vi/order
  // /en/order
  // =========================================================
  const pathnameHasLocale = locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/`) ||
      pathname === `/${locale}`
  );

  // Nếu URL đã có locale thì không làm gì
  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // =========================================================
  // CÁC TRANG KHÁCH HÀNG KHÔNG CÓ LOCALE
  // → chuyển sang locale mặc định
  // =========================================================
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;

  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico).*)",
  ],
};