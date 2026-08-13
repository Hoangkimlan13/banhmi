export interface SelectedStore {
  id: number;
  title: string;
  type: string;
  slug: string;
  timestamp: number;
}

const KEY = "selected_store";

export function saveSelectedStore(store: Omit<SelectedStore, "timestamp">) {
  const data: SelectedStore = {
    ...store,
    timestamp: Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getSelectedStore(): SelectedStore | null {
  const data = localStorage.getItem(KEY);
  if (!data) return null;

  try {
    const store: SelectedStore = JSON.parse(data);
    // Hết hạn sau 30 ngày
    const expire = 30 * 24 * 60 * 60 * 1000;

    if (Date.now() - store.timestamp > expire) {
      localStorage.removeItem(KEY);
      return null;
    }

    return store;
  } catch (e) {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function clearSelectedStore() {
  localStorage.removeItem(KEY);
}
