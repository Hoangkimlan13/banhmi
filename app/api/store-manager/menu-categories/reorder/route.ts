import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

type ReorderItem = {
  id: number;
  display_order: number;
};

export async function PUT(request: Request) {
  try {
    const session = await getStoreSession();
    if (!session?.storeId) {
      return NextResponse.json({ error: "Thao tác không được phép (Unauthorized)" }, { status: 401 });
    }

    const { menu_id, items }: { menu_id: number; items: ReorderItem[] } =
      await request.json();

    if (!menu_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    // Cập nhật hàng loạt vị trí trong Transaction
    await db.$transaction(
      items.map((item) =>
        db.tbl_menu_category.update({
          where: {
            id: Number(item.id),
            menu_id: Number(menu_id),
          },
          data: {
            display_order: Number(item.display_order),
          },
        })
      )
    );

    return NextResponse.json({ 
      success: true, 
      message: "並び順を更新しました" 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "並び順の更新に失敗しました" 
    }, { status: 500 });
  }
}