import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { db } from "@/lib/prisma";
import { setStoreSession } from "@/lib/store-session";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username =
      typeof body?.username === "string"
        ? body.username.trim()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ユーザー名とパスワードを入力してください。",
        },
        { status: 400 }
      );
    }

    const store = await db.tbl_store.findFirst({
      where: {
        username,
        type: {
          in: ["Shop", "Truck"],
        },
      },
      select: {
        id: true,
        title: true,
        username: true,
        password: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ユーザー名またはパスワードが正しくありません。",
        },
        { status: 401 }
      );
    }

    // Kiểm tra an toàn: Nếu tài khoản trong DB chưa thiết lập password (bị null hoặc rỗng)
    if (!store.password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ユーザー名またはパスワードが正しくありません。",
        },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      store.password
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ユーザー名またはパスワードが正しくありません。",
        },
        { status: 401 }
      );
    }

    await setStoreSession(store.id);

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        title: store.title,
      },
    });
  } catch (error) {
    console.error(
      "STORE MANAGER LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "ログイン処理中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}