import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

// Airwallex Webhook 事件處理
// 文檔: https://www.airwallex.com/docs/api#/Payment_Acceptance/Webhooks

interface WebhookEvent {
    id: string;
    name: string;
    account_id: string;
    data: {
        object: any;
    };
    created_at: string;
}

// Helper: Verify webhook signature (optional but recommended)
function verifyWebhookSignature(
    payload: string,
    signature: string | null,
    secret: string | null
): boolean {
    // If no secret configured, skip verification (not recommended for production)
    if (!secret || !signature) {
        console.warn('⚠️ Webhook signature verification skipped - no secret configured');
        return true;
    }

    try {
        // Airwallex uses HMAC-SHA256 for webhook signatures
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('x-signature');
        const webhookSecret = process.env.AIRWALLEX_WEBHOOK_SECRET;

        // Verify signature
        if (!verifyWebhookSignature(payload, signature, webhookSecret || null)) {
            console.error('❌ Webhook signature verification failed');
            return NextResponse.json(
                { success: false, error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const event: WebhookEvent = JSON.parse(payload);
        console.log('📨 Received webhook event:', event.name, event.id);

        const supabase = getSaasSupabaseClient();

        switch (event.name) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(supabase, event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(supabase, event.data.object);
                break;

            case 'payment_intent.cancelled':
                await handlePaymentCancelled(supabase, event.data.object);
                break;

            case 'payment_link.paid':
                await handlePaymentLinkPaid(supabase, event.data.object);
                break;

            default:
                console.log('ℹ️ Unhandled webhook event:', event.name);
        }

        return NextResponse.json({ success: true, received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { success: false, error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

// Handle successful payment
async function handlePaymentSucceeded(supabase: any, paymentIntent: any) {
    console.log('✅ Payment succeeded:', paymentIntent.id);

    const metadata = paymentIntent.metadata || {};
    const orgId = metadata.org_id;
    const planId = metadata.plan_id;
    const billingCycle = metadata.billing_cycle || 'monthly';
    const autoRenew = metadata.auto_renew === 'true';

    // Update payment record status
    const { error: paymentError } = await supabase
        .from('payment_records')
        .update({
            status: 'completed',
            updated_at: new Date().toISOString()
        })
        .eq('airwallex_intent_id', paymentIntent.id);

    if (paymentError) {
        console.error('Failed to update payment record:', paymentError);
    }

    // Update subscription status if org_id is present
    if (orgId) {
        // Calculate next billing date based on cycle
        const nextBillingDate = new Date();
        if (billingCycle === 'yearly') {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }

        // Calculate end date (grace period of 3 days after billing date)
        const endDate = new Date(nextBillingDate);
        endDate.setDate(endDate.getDate() + 3);

        const { error: subError } = await supabase
            .from('org_subscriptions')
            .update({
                status: 'active',
                last_payment_date: new Date().toISOString(),
                next_billing_date: nextBillingDate.toISOString(),
                end_date: endDate.toISOString(),
                auto_renew: autoRenew,
                updated_at: new Date().toISOString()
            })
            .eq('org_id', orgId);

        if (subError) {
            console.error('Failed to update subscription:', subError);
        } else {
            console.log('✅ Subscription activated for org:', orgId);
        }
    }
}

// Handle failed payment
async function handlePaymentFailed(supabase: any, paymentIntent: any) {
    console.log('❌ Payment failed:', paymentIntent.id);

    const metadata = paymentIntent.metadata || {};
    const orgId = metadata.org_id;

    // Update payment record status
    await supabase
        .from('payment_records')
        .update({
            status: 'failed',
            updated_at: new Date().toISOString()
        })
        .eq('airwallex_intent_id', paymentIntent.id);

    // Update subscription status if payment was for a subscription
    if (orgId && metadata.subscription_type) {
        await supabase
            .from('org_subscriptions')
            .update({
                status: 'payment_failed',
                updated_at: new Date().toISOString()
            })
            .eq('org_id', orgId);
    }

    // TODO: Send notification email to customer about failed payment
}

// Handle cancelled payment
async function handlePaymentCancelled(supabase: any, paymentIntent: any) {
    console.log('🚫 Payment cancelled:', paymentIntent.id);

    // Update payment record status
    await supabase
        .from('payment_records')
        .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
        })
        .eq('airwallex_intent_id', paymentIntent.id);
}

// Handle Payment Link paid
async function handlePaymentLinkPaid(supabase: any, paymentLink: any) {
    console.log('✅ Payment Link paid:', paymentLink.id);

    const metadata = paymentLink.metadata || {};
    const paymentIntentId = metadata.payment_intent_id;

    if (paymentIntentId) {
        // This will trigger the payment_intent.succeeded handling through the main flow
        console.log('Associated Payment Intent:', paymentIntentId);
    }
}

// GET method for webhook verification (some services require this)
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        message: 'Airwallex webhook endpoint is active'
    });
}
