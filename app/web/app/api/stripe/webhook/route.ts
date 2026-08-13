import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    const orderId = paymentIntent.metadata.order_id;
    const storeId = paymentIntent.metadata.store_id;

    if (orderId) {
      console.log(`Payment succeeded for Order ID: ${orderId}, Store ID: ${storeId}`);
      // TODO: Viết logic cập nhật trạng thái đơn hàng vào Database tại đây
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as any;
    const orderId = paymentIntent.metadata.order_id;
    
    if (orderId) {
      console.log(`Payment failed for Order ID: ${orderId}`);
      // TODO: Viết logic xử lý khi thanh toán thất bại tại đây
    }
  }

  return NextResponse.json({ received: true });
}