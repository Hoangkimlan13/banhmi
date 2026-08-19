// /app/api/store-manager/orders/route.ts
import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/store-session";
// SỬA LẠI ĐƯỜNG DẪN IMPORT CÓ THÊM (dashboard)
import { getStoreOrders } from "@/app/store-manager/(dashboard)/orders/actions"; 

export async function GET() {
  const session = await getStoreSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await getStoreOrders();

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("API GET ORDERS ERROR:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}