import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Đổi params thành Promise
) {
  try {
    const session = await getStoreSession();
    if (!session?.storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params; // 2. await params trước khi dùng
    const categoryId = Number(resolvedParams.id);

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid Category ID" }, { status: 400 });
    }

    const body = await request.json();

    // Verify ownership
    const existing = await db.tbl_menu_category.findFirst({
      where: {
        id: categoryId,
        tbl_menu: { store_id: Number(session.storeId) },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await db.tbl_menu_category.update({
      where: { id: categoryId },
      data: {
        name_ja: body.name_ja.trim(),
        name_vi: body.name_vi?.trim() || null,
        name_en: body.name_en?.trim() || null,
        name_zh: body.name_zh?.trim() || null,
        image_url: body.image_url?.trim() || null,
        is_active: body.is_active,
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getStoreSession();
    if (!session?.storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const categoryId = Number(resolvedParams.id);

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Invalid Category ID" }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.tbl_menu_category.findFirst({
      where: {
        id: categoryId,
        tbl_menu: { store_id: Number(session.storeId) },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Tiến hành xóa danh mục
    await db.tbl_menu_category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}