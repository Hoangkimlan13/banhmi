import { TransactionClient } from './order.repository';

export const webhookRepository = {
  findWebhook(tx: TransactionClient, eventId: string) {
    return tx.tbl_payment_webhooks.findUnique({
      where: { event_id: eventId },
    });
  },

  createWebhook(tx: TransactionClient, data: {
    eventId: string;
    eventType: string;
    payload: string;
  }) {
    return tx.tbl_payment_webhooks.create({
      data: {
        event_id: data.eventId,
        event_type: data.eventType,
        payload: data.payload,
        processed: 0,
      },
    });
  },

  markProcessed(tx: TransactionClient, webhookId: bigint, paymentId?: bigint | null) {
    return tx.tbl_payment_webhooks.update({
      where: { id: webhookId },
      data: {
        payment_id: paymentId || null,
        processed: 1,
      },
    });
  },
};
