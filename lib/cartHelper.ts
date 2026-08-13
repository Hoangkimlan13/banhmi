export function generateCartKey(itemId: number | string, selectedOptions: Record<number, any>, note: string): string {
  // Sắp xếp các option ID để đảm bảo tính nhất quán (ví dụ chọn topping 1,4 hay 4,1 đều cho ra một key giống nhau)
  const sortedOptionIds = Object.values(selectedOptions)
    .flatMap((val: any) => Array.isArray(val) ? val.map((o: any) => o.id) : [val?.id])
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b))
    .join(',');

  const cleanNote = note.trim().toLowerCase();
  

  return `${itemId}_opt[${sortedOptionIds}]_note[${cleanNote}]`;
}

export function clearCart() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('cart');
}