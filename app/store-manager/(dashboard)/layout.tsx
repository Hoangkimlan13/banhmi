// app/store-manager/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { getStoreSession } from "@/lib/store-session";
import { db } from "@/lib/prisma";
import StoreLayoutClient from "./StoreLayoutClient";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Kiểm tra session đăng nhập
  const session = await getStoreSession();
  if (!session) {
    redirect("/store-manager/login");
  }

  // 2. Lấy đúng thông tin store từ Database dựa trên storeId trong session
  const store = await db.tbl_store.findUnique({
    where: { id: session.storeId },
    select: {
      id: true,
      title: true,
      accepting_orders: true,
    },
  });

  if (!store) {
    redirect("/store-manager/login");
  }

  return (
    <StoreLayoutClient store={store}>
      {children}
    </StoreLayoutClient>
  );
}