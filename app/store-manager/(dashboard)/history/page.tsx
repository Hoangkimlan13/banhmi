import { getOrderHistory } from "./actions";
import HistoryHeader from "./components/HistoryHeader";
import HistoryTable from "./components/HistoryTable";
import styles from "./styles/history.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrderHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedParams = await searchParams;
  const { orders, stats, selectedDate } =
    await getOrderHistory(resolvedParams?.date);

  return (
    <div className={styles.container}>
      <HistoryHeader selectedDate={selectedDate} stats={stats} />
      <HistoryTable orders={orders} />
    </div>
  );
}