import { NextResponse } from "next/server";
import { clearStoreSession } from "@/lib/store-session";

export async function POST(request: Request) {
  try {
    // Xóa session (xóa cookie store_manager_session)
    await clearStoreSession();

    // Điều hướng người dùng về trang đăng nhập
    const url = new URL("/store-manager/login", request.url);

    return NextResponse.redirect(url, {
      status: 303, // Chuẩn HTTP chuyển hướng sau POST
    });
  } catch (error) {
    console.error("STORE MANAGER LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "ログアウト処理中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}