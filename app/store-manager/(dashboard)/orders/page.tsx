import { redirect } from "next/navigation";
import { getStoreSession } from "@/lib/store-session";
import { getStoreOrders, getStoreStatus } from "./actions";
import StoreManagerShell from "./components/StoreManagerShell";

export default async function StoreOrdersPage() {
  const session = await getStoreSession();
  if (!session) {
    redirect("/store-manager/login");
  }

  // Lấy đồng thời thông tin store và danh sách order
  const [store, orders] = await Promise.all([
    getStoreStatus(),
    getStoreOrders(),
  ]);

  return (
    <StoreManagerShell
      store={store}
      initialOrders={orders}
      initialSchedule={store.schedule}
    />
  );
}