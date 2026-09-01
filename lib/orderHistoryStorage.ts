export const clearOrderHistoryStorage = () => {
  try {
    localStorage.removeItem('orderHistory');

    window.dispatchEvent(
      new CustomEvent('order-history-updated')
    );
  } catch (error) {
    console.error(
      '[OrderHistory] Failed to clear order history',
      error
    );
  }
};