import Stripe from 'stripe';
import { ENV } from './_core/env';

// 只有在提供 Secret Key 時才初始化 Stripe
const stripe = ENV.stripeSecretKey ? new Stripe(ENV.stripeSecretKey, {
  apiVersion: '2025-01-27' as any,
}) : null;

export async function createCheckoutSession(userOpenId: string, userEmail?: string) {
  if (!stripe) {
    console.warn("[Stripe] Secret Key not configured, simulating session...");
    return { url: `/subscription/success?session_id=mock_session_${Date.now()}` };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'twd',
          product_data: {
            name: 'Putier Health 專業版訂閱 (1年)',
            description: '開啟無限次評估、修復日誌大數據分析與小秘書智能分析功能。',
          },
          unit_amount: 298000, // NT$2,980
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/subscription/cancel`,
    metadata: {
      userOpenId,
    },
    customer_email: userEmail,
  });

  return { url: session.url };
}

export async function handleWebhook(payload: string, sig: string) {
  if (!stripe || !ENV.stripeWebhookSecret) {
    console.warn("[Stripe] Webhook Secret not configured, skipping verification.");
    return null;
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, sig, ENV.stripeWebhookSecret);
    return event;
  } catch (err: any) {
    console.error(`[Stripe] Webhook Error: ${err.message}`);
    throw err;
  }
}
