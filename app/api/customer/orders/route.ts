import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/prisma';

// =========================================================
// PRISMA TYPES
// =========================================================

type CustomerOrderWithItems =
  Prisma.tbl_customer_ordersGetPayload<{
    include: {
      tbl_customer_order_items: true;
    };
  }>;

type CustomerOrderItem =
  CustomerOrderWithItems['tbl_customer_order_items'][number];

type CustomerOrderItemOption =
  Prisma.tbl_customer_order_item_optionsGetPayload<{}>;

// =========================================================
// POST
// =========================================================

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    // =========================================================
    // 1. LẤY ORDER TOKENS
    // =========================================================

    const rawTokens: unknown[] =
      body !== null &&
      typeof body === 'object' &&
      'tokens' in body &&
      Array.isArray(
        (body as Record<string, unknown>).tokens
      )
        ? ((body as Record<string, unknown>)
            .tokens as unknown[])
        : [];

    const tokens: string[] = rawTokens
      .map((item: unknown): string | null => {
        // -----------------------------------------------------
        // Trường hợp:
        // ["token1", "token2"]
        // -----------------------------------------------------

        if (typeof item === 'string') {
          return item;
        }

        // -----------------------------------------------------
        // Trường hợp:
        // [{ orderToken: "token1" }]
        // -----------------------------------------------------

        if (
          item !== null &&
          typeof item === 'object'
        ) {
          const record =
            item as Record<string, unknown>;

          return typeof record.orderToken === 'string'
            ? record.orderToken
            : null;
        }

        return null;
      })
      .filter(
        (token: string | null): token is string =>
          typeof token === 'string' &&
          token.trim().length > 0
      );

    const uniqueTokens: string[] = [
      ...new Set(tokens),
    ];

    console.log(
      '[OrderHistory] tokens received:',
      uniqueTokens.length
    );

    // =========================================================
    // KHÔNG CÓ TOKEN
    // =========================================================

    if (uniqueTokens.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
      });
    }

    // =========================================================
    // 2. LẤY ORDER + ORDER ITEMS
    // =========================================================

    const orders: CustomerOrderWithItems[] =
      await db.tbl_customer_orders.findMany({
        where: {
          order_token: {
            in: uniqueTokens,
          },
        },

        include: {
          tbl_customer_order_items: true,
        },

        orderBy: {
          created_at: 'desc',
        },
      });

    console.log(
      '[OrderHistory] orders found:',
      orders.length
    );

    // =========================================================
    // 3. LẤY ORDER ITEM IDS
    // =========================================================

    const orderItemIds: number[] =
      orders.flatMap(
        (
          order: CustomerOrderWithItems
        ): number[] =>
          order.tbl_customer_order_items.map(
            (
              item: CustomerOrderItem
            ): number => Number(item.id)
          )
      );

    console.log(
      '[OrderHistory] order item ids:',
      orderItemIds.length
    );

    // =========================================================
    // 4. LẤY OPTIONS ĐÃ SNAPSHOT
    // =========================================================

    const options: CustomerOrderItemOption[] =
      orderItemIds.length > 0
        ? await db.tbl_customer_order_item_options.findMany(
            {
              where: {
                order_item_id: {
                  in: orderItemIds,
                },
              },

              orderBy: {
                id: 'asc',
              },
            }
          )
        : [];

    console.log(
      '[OrderHistory] options found:',
      options.length
    );

    // =========================================================
    // 5. GROUP OPTIONS THEO ORDER ITEM
    // =========================================================

    const optionsByOrderItem =
      new Map<
        string,
        CustomerOrderItemOption[]
      >();

    for (
      const option of options
    ) {
      const key: string =
        String(option.order_item_id);

      const current: CustomerOrderItemOption[] =
        optionsByOrderItem.get(key) ?? [];

      current.push(option);

      optionsByOrderItem.set(
        key,
        current
      );
    }

    // =========================================================
    // 6. SERIALIZE ORDERS
    // =========================================================

    const serializedOrders =
      orders.map(
        (
          order: CustomerOrderWithItems
        ) => ({
          ...order,

          // =====================================================
          // ORDER
          // =====================================================

          id: String(order.id),

          subtotal:
            order.subtotal !== null &&
            order.subtotal !== undefined
              ? Number(order.subtotal)
              : 0,

          discount_amount:
            order.discount_amount !== null &&
            order.discount_amount !== undefined
              ? Number(order.discount_amount)
              : 0,

          tax_amount:
            order.tax_amount !== null &&
            order.tax_amount !== undefined
              ? Number(order.tax_amount)
              : 0,

          total_amount:
            Number(order.total_amount),

          // =====================================================
          // ORDER ITEMS
          // =====================================================

          tbl_customer_order_items:
            order.tbl_customer_order_items.map(
              (
                item: CustomerOrderItem
              ) => {
                // -----------------------------------------------
                // LẤY OPTIONS CỦA ITEM
                // -----------------------------------------------

                const itemOptions: CustomerOrderItemOption[] =
                  optionsByOrderItem.get(
                    String(item.id)
                  ) ?? [];

                // -----------------------------------------------
                // RETURN ITEM
                // -----------------------------------------------

                return {
                  ...item,

                  id: String(item.id),

                  order_id:
                    String(item.order_id),

                  quantity:
                    Number(item.quantity),

                  price_at_time:
                    Number(item.price_at_time),

                  discount_amount:
                    Number(item.discount_amount),

                  option_total:
                    Number(
                      item.option_total ?? 0
                    ),

                  // =============================================
                  // SNAPSHOT OPTIONS
                  // =============================================

                  tbl_customer_order_item_options:
                    itemOptions.map(
                      (
                        option: CustomerOrderItemOption
                      ) => ({
                        id: String(option.id),

                        order_item_id:
                          String(
                            option.order_item_id
                          ),

                        option_item_id:
                          option.option_item_id !==
                            null &&
                          option.option_item_id !==
                            undefined
                            ? Number(
                                option.option_item_id
                              )
                            : null,

                        // -----------------------------------------
                        // SNAPSHOT
                        // -----------------------------------------

                        group_name_snap:
                          option.group_name_snap ??
                          null,

                        option_name_snap:
                          option.option_name_snap,

                        price_snap:
                          Number(
                            option.price_snap
                          ),
                      })
                    ),
                };
              }
            ),
        })
      );

    // =========================================================
    // 7. RESPONSE
    // =========================================================

    return NextResponse.json({
      success: true,
      orders: serializedOrders,
    });
  } catch (error: unknown) {
    console.error(
      '[OrderHistory API Error]',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : 'Internal Server Error',
      },
      {
        status: 500,
      }
    );
  }
}