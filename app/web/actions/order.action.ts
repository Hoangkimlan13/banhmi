'use server';

import { db } from '@/lib/prisma';
import {
  tbl_customer_orders_order_type,
  Prisma,
} from '@prisma/client';

interface CartItem {
  menuItemId?: number;
  id?: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export async function submitOrder(
  cartItems: CartItem[],
  totalAmount: number,
  customerName: string,
  storeId?: number
) {
  // =========================================================
  // BASIC VALIDATION
  // =========================================================

  if (!cartItems || cartItems.length === 0) {
    return {
      success: false,
      error: 'Giỏ hàng trống!',
    };
  }

  if (!storeId || !Number.isInteger(storeId) || storeId <= 0) {
    return {
      success: false,
      error: 'Không xác định được cửa hàng.',
    };
  }

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return {
      success: false,
      error: 'Tổng tiền không hợp lệ.',
    };
  }

  if (!customerName || !customerName.trim()) {
    return {
      success: false,
      error: 'Vui lòng nhập tên khách hàng.',
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // =====================================================
      // CREATE ORDER
      // =====================================================
      //
      // Dùng UncheckedCreateInput để Prisma nhận trực tiếp
      // store_id là scalar foreign key.
      //
      // storeId đã được validate ở phía trên nên không còn
      // kiểu number | undefined.
      // =====================================================

      const orderData: Prisma.tbl_customer_ordersUncheckedCreateInput = {
        order_token: crypto.randomUUID().replace(/-/g, ''),
        store_id: storeId,
        customer_name: customerName.trim(),
        customer_phone: '',
        order_type:
          tbl_customer_orders_order_type.IMMEDIATE,
        total_amount: totalAmount,
        currency: 'JPY',
      };

      const order = await tx.tbl_customer_orders.create({
        data: orderData,
      });

      // =====================================================
      // CREATE ORDER ITEMS
      // =====================================================

      for (const item of cartItems) {
        const resolvedMenuItemId = Number(item.menuItemId ?? item.id);

        if (
          !Number.isInteger(resolvedMenuItemId) ||
          resolvedMenuItemId <= 0
        ) {
          throw new Error(
            `Invalid menu item id: ${resolvedMenuItemId}`
          );
        }

        if (
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0
        ) {
          throw new Error(
            `Invalid quantity for item: ${item.id}`
          );
        }

        if (
          !Number.isFinite(item.price) ||
          item.price < 0
        ) {
          throw new Error(
            `Invalid price for item: ${item.id}`
          );
        }

        await tx.tbl_customer_order_items.create({
          data: {
            order_id: order.id,
            menu_item_id: resolvedMenuItemId,
            food_name_snap: item.name,
            quantity: item.quantity,
            price_at_time: item.price,
            note: item.note?.trim() || '',
          },
        });
      }

      // =====================================================
      // IMPORTANT
      // =====================================================
      //
      // KHÔNG tạo tbl_print_jobs ở đây.
      //
      // Print job chỉ được tạo sau khi Stripe webhook
      // xác nhận payment thành công.
      //
      // Flow hiện tại:
      //
      // Order
      //   ↓
      // Payment PENDING
      //   ↓
      // Stripe
      //   ↓
      // Webhook
      //   ↓
      // Payment SUCCESS
      //   ↓
      // Order PAID
      //   ↓
      // Print job (sau này)
      //
      // =====================================================

      return order;
    });

    return {
      success: true,
      orderId: result.id.toString(),
      orderToken: result.order_token,
    };
  } catch (error) {
    console.error(
      '[submitOrder] Failed to create order:',
      error
    );

    return {
      success: false,
      error: 'Không thể đặt hàng, vui lòng thử lại.',
    };
  }
}
