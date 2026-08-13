import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale } from "./app/i18n";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kiểm tra xem URL hiện tại đã có mã ngôn ngữ hợp lệ chưa (ví dụ: /ja, /en, /vi)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Nếu đã có ngôn ngữ trên URL rồi thì không làm gì cả
  if (pathnameHasLocale) return;

  // Nếu chưa có (người dùng vào /), tự động chuyển hướng sang ngôn ngữ mặc định (/ja)
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Bỏ qua các file hệ thống, hình ảnh tĩnh để không bị chuyển hướng vô tận
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico).*)"],
};