import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe';
import { processStripeWebhook } from '@/services/webhook.service';

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const signature = (await headers()).get('stripe-signature');
  const rawPayload = await req.text();

  // =========================================================
  // 1. CHECK WEBHOOK SECRET
  // =========================================================

  if (!stripeWebhookSecret) {
    console.error(
      '[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured'
    );

    return NextResponse.json(
      {
        error: 'Stripe webhook secret is not configured',
      },
      { status: 500 }
    );
  }

  // =========================================================
  // 2. CHECK SIGNATURE
  // =========================================================

  if (!signature) {
    console.error(
      '[Stripe Webhook] Missing stripe-signature header'
    );

    return NextResponse.json(
      {
        error: 'Missing stripe-signature header',
      },
      { status: 400 }
    );
  }

  // =========================================================
  // 3. VERIFY STRIPE SIGNATURE
  // =========================================================

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawPayload,
      signature,
      stripeWebhookSecret
    );
  } catch (error) {
    console.error(
      '[Stripe Webhook] Invalid signature or payload',
      error
    );

    return NextResponse.json(
      {
        error: 'Invalid webhook signature or payload',
      },
      { status: 400 }
    );
  }

  // =========================================================
  // 4. PROCESS WEBHOOK
  // =========================================================

  try {
    console.log(
      '[Stripe Webhook] Received event',
      {
        id: event.id,
        type: event.type,
      }
    );

    const result = await processStripeWebhook(
      event,
      rawPayload
    );

    console.log(
      '[Stripe Webhook] Processing completed',
      {
        eventId: event.id,
        eventType: event.type,
        duplicate: result.duplicate,
        processed: result.processed,
        paymentId: result.paymentId,
      }
    );

    return NextResponse.json({
      received: true,
      duplicate: result.duplicate,
      processed: result.processed,
      paymentId: result.paymentId,
    });
  } catch (error) {
    console.error(
      '[Stripe Webhook] Processing failed',
      {
        eventId: event.id,
        eventType: event.type,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown webhook error',
        stack:
          error instanceof Error
            ? error.stack
            : undefined,
      }
    );

    /*
     * QUAN TRỌNG:
     *
     * Không trả 200 nếu xử lý DB thất bại.
     *
     * Stripe cần nhận HTTP 5xx để biết webhook
     * chưa được xử lý thành công và có thể retry.
     */

    return NextResponse.json(
      {
        error: 'Webhook processing error',
      },
      { status: 500 }
    );
  }
}