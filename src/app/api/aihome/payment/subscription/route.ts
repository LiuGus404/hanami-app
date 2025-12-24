import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

// Airwallex API 配置
const AIRWALLEX_BASE_URL = 'https://api.airwallex.com/api/v1';
const AIRWALLEX_AUTH_URL = `${AIRWALLEX_BASE_URL}/authentication/login`;

interface SubscriptionRequest {
    plan_id: string;
    plan_name: string;
    amount: number;
    currency: string;
    billing_cycle: 'monthly' | 'yearly';
    auto_renew: boolean;
    org_id: string;
    user_id: string;
    customer_email: string;
    customer_name: string;
    success_url: string;
    cancel_url: string;
    metadata?: Record<string, any>;
}

// Helper: Get Airwallex access token
async function getAirwallexToken(): Promise<string | null> {
    const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY;
    const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID;

    if (!AIRWALLEX_API_KEY || !AIRWALLEX_CLIENT_ID) {
        console.error('Missing Airwallex credentials');
        return null;
    }

    try {
        const response = await fetch(AIRWALLEX_AUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': AIRWALLEX_API_KEY,
                'x-client-id': AIRWALLEX_CLIENT_ID
            }
        });

        if (!response.ok) {
            console.error('Airwallex auth failed:', await response.text());
            return null;
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Airwallex auth error:', error);
        return null;
    }
}

// Helper: Create or get Airwallex customer
async function getOrCreateCustomer(
    accessToken: string,
    email: string,
    name: string,
    orgId: string
): Promise<{ id: string } | null> {
    try {
        // First, try to find existing customer by email
        const searchResponse = await fetch(
            `${AIRWALLEX_BASE_URL}/pa/customers?email=${encodeURIComponent(email)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.items && searchData.items.length > 0) {
                console.log('Found existing customer:', searchData.items[0].id);
                return { id: searchData.items[0].id };
            }
        }

        // Create new customer
        const requestId = `hanami_customer_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const createResponse = await fetch(`${AIRWALLEX_BASE_URL}/pa/customers/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'x-api-version': '2020-06-30'
            },
            body: JSON.stringify({
                request_id: requestId,
                email: email,
                first_name: name.split(' ')[0] || name,
                last_name: name.split(' ').slice(1).join(' ') || '',
                merchant_customer_id: `hanami_org_${orgId}`,
                metadata: {
                    org_id: orgId,
                    source: 'hanami_subscription'
                }
            })
        });

        if (!createResponse.ok) {
            const error = await createResponse.text();
            console.error('Failed to create customer:', error);
            return null;
        }

        const customerData = await createResponse.json();
        console.log('Created new customer:', customerData.id);
        return { id: customerData.id };
    } catch (error) {
        console.error('Customer creation error:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: SubscriptionRequest = await request.json();
        const {
            plan_id,
            plan_name,
            amount,
            currency,
            billing_cycle,
            auto_renew,
            org_id,
            user_id,
            customer_email,
            customer_name,
            success_url,
            cancel_url,
            metadata
        } = body;

        // Validate required fields
        if (!plan_id || !amount || !org_id || !customer_email) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const accessToken = await getAirwallexToken();
        if (!accessToken) {
            return NextResponse.json(
                { success: false, error: 'Failed to authenticate with Airwallex' },
                { status: 500 }
            );
        }

        const supabase = getSaasSupabaseClient();
        const requestId = `hanami_sub_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        // For auto-renew: Create a recurring subscription setup
        // For one-time: Create a regular payment intent
        if (auto_renew) {
            // Get or create customer first
            const customer = await getOrCreateCustomer(accessToken, customer_email, customer_name, org_id);

            if (!customer) {
                return NextResponse.json(
                    { success: false, error: 'Failed to create customer' },
                    { status: 500 }
                );
            }

            // Create a Payment Intent with customer attached for recurring
            // This allows us to save the payment method for future charges
            const paymentIntentRequest = {
                request_id: requestId,
                amount: amount,
                currency: currency.toUpperCase(),
                merchant_order_id: `hanami_sub_${org_id}_${Date.now()}`,
                customer_id: customer.id,
                metadata: {
                    source: 'hanami_subscription',
                    plan_id: plan_id,
                    plan_name: plan_name,
                    billing_cycle: billing_cycle,
                    auto_renew: 'true',
                    org_id: org_id,
                    user_id: user_id,
                    subscription_type: 'recurring',
                    ...metadata
                },
                order: {
                    products: [
                        {
                            name: `${plan_name} - ${billing_cycle === 'monthly' ? '月費' : '年費'}訂閱`,
                            desc: `HanamiEcho ${plan_name} 訂閱`,
                            unit_price: amount,
                            quantity: 1,
                            sku: `subscription_${plan_id}_${billing_cycle}`
                        }
                    ],
                    type: 'Hanami Subscription'
                },
                return_url: success_url,
                cancel_url: cancel_url,
                // Request to attach payment method for recurring
                capture: true
            };

            console.log('Creating recurring payment intent:', JSON.stringify(paymentIntentRequest, null, 2));

            const paymentResponse = await fetch(`${AIRWALLEX_BASE_URL}/pa/payment_intents/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'x-api-version': '2020-06-30'
                },
                body: JSON.stringify(paymentIntentRequest)
            });

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {
                console.error('Payment Intent creation failed:', paymentData);
                return NextResponse.json(
                    { success: false, error: 'Failed to create payment', details: paymentData },
                    { status: 500 }
                );
            }

            // Create Payment Link for better checkout experience
            const linkRequest = {
                request_id: `hanami_link_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                amount: amount,
                currency: currency.toUpperCase(),
                title: `${plan_name} - ${billing_cycle === 'monthly' ? '月費' : '年費'}訂閱`,
                description: `HanamiEcho ${plan_name} 自動續費訂閱`,
                reusable: false,
                customer_id: customer.id,
                metadata: {
                    source: 'hanami_subscription',
                    plan_id: plan_id,
                    billing_cycle: billing_cycle,
                    auto_renew: 'true',
                    org_id: org_id,
                    payment_intent_id: paymentData.id
                },
                return_url: success_url,
                cancel_url: cancel_url
            };

            const linkResponse = await fetch(`${AIRWALLEX_BASE_URL}/pa/payment_links/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'x-api-version': '2020-06-30'
                },
                body: JSON.stringify(linkRequest)
            });

            const linkData = await linkResponse.json();
            let checkoutUrl = linkData.url || `https://checkout.airwallex.com/pay/${paymentData.id}`;

            // Calculate next billing date
            const nextBillingDate = new Date();
            if (billing_cycle === 'monthly') {
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            } else {
                nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
            }

            // Save subscription to database
            const { error: dbError } = await (supabase
                .from('org_subscriptions') as any)
                .upsert({
                    org_id: org_id,
                    plan_id: plan_id,
                    status: 'pending',
                    max_students: getMaxStudentsForPlan(plan_id),
                    airwallex_customer_id: customer.id,
                    auto_renew: true,
                    billing_cycle: billing_cycle,
                    next_billing_date: nextBillingDate.toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'org_id'
                });

            if (dbError) {
                console.error('Database error:', dbError);
            }

            // Also save payment record
            await supabase.from('payment_records').insert({
                payment_method: 'airwallex',
                amount: amount,
                currency: currency,
                description: `${plan_name} - ${billing_cycle === 'monthly' ? '月費' : '年費'}訂閱`,
                airwallex_intent_id: paymentData.id,
                airwallex_request_id: requestId,
                status: 'pending',
                checkout_url: checkoutUrl,
                return_url: success_url,
                cancel_url: cancel_url,
                created_at: new Date().toISOString(),
                metadata: {
                    source: 'hanami_subscription',
                    plan_id: plan_id,
                    billing_cycle: billing_cycle,
                    auto_renew: true,
                    org_id: org_id,
                    customer_id: customer.id
                }
            } as any);

            return NextResponse.json({
                success: true,
                checkout_url: checkoutUrl,
                payment_intent_id: paymentData.id,
                customer_id: customer.id,
                subscription_type: 'recurring',
                auto_renew: true,
                next_billing_date: nextBillingDate.toISOString(),
                message: '訂閱創建成功，請完成付款以啟動自動續費'
            });

        } else {
            // One-time payment (non-recurring)
            const paymentIntentRequest = {
                request_id: requestId,
                amount: amount,
                currency: currency.toUpperCase(),
                merchant_order_id: `hanami_onetime_${org_id}_${Date.now()}`,
                metadata: {
                    source: 'hanami_subscription',
                    plan_id: plan_id,
                    plan_name: plan_name,
                    billing_cycle: billing_cycle,
                    auto_renew: 'false',
                    org_id: org_id,
                    user_id: user_id,
                    subscription_type: 'one_time',
                    ...metadata
                },
                order: {
                    products: [
                        {
                            name: `${plan_name} - ${billing_cycle === 'monthly' ? '月費' : '年費'}（單次付款）`,
                            desc: `HanamiEcho ${plan_name} 訂閱（手動續費）`,
                            unit_price: amount,
                            quantity: 1,
                            sku: `subscription_${plan_id}_${billing_cycle}_onetime`
                        }
                    ],
                    type: 'Hanami Subscription'
                },
                return_url: success_url,
                cancel_url: cancel_url
            };

            console.log('Creating one-time payment intent:', JSON.stringify(paymentIntentRequest, null, 2));

            const paymentResponse = await fetch(`${AIRWALLEX_BASE_URL}/pa/payment_intents/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'x-api-version': '2020-06-30'
                },
                body: JSON.stringify(paymentIntentRequest)
            });

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {
                console.error('Payment Intent creation failed:', paymentData);
                return NextResponse.json(
                    { success: false, error: 'Failed to create payment', details: paymentData },
                    { status: 500 }
                );
            }

            // Create Payment Link
            const linkRequest = {
                request_id: `hanami_link_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                amount: amount,
                currency: currency.toUpperCase(),
                title: `${plan_name} - ${billing_cycle === 'monthly' ? '月費' : '年費'}（單次付款）`,
                description: `HanamiEcho ${plan_name} 訂閱（手動續費）`,
                reusable: false,
                metadata: {
                    source: 'hanami_subscription',
                    plan_id: plan_id,
                    billing_cycle: billing_cycle,
                    auto_renew: 'false',
                    org_id: org_id,
                    payment_intent_id: paymentData.id
                },
                return_url: success_url,
                cancel_url: cancel_url
            };

            const linkResponse = await fetch(`${AIRWALLEX_BASE_URL}/pa/payment_links/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'x-api-version': '2020-06-30'
                },
                body: JSON.stringify(linkRequest)
            });

            const linkData = await linkResponse.json();
            let checkoutUrl = linkData.url || `https://checkout.airwallex.com/pay/${paymentData.id}`;

            // Calculate subscription end date
            const endDate = new Date();
            if (billing_cycle === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            } else {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }

            // Save subscription to database
            const { error: dbError } = await (supabase
                .from('org_subscriptions') as any)
                .upsert({
                    org_id: org_id,
                    plan_id: plan_id,
                    status: 'pending',
                    max_students: getMaxStudentsForPlan(plan_id),
                    auto_renew: false,
                    billing_cycle: billing_cycle,
                    next_billing_date: endDate.toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'org_id'
                });

            if (dbError) {
                console.error('Database error:', dbError);
            }

            // Also save payment record
            await supabase.from('payment_records').insert({
                payment_method: 'airwallex',
                amount: amount,
                currency: currency,
                description: `${plan_name} - ${billing_cycle === 'monthly' ? '月費' : '年費'}（單次付款）`,
                airwallex_intent_id: paymentData.id,
                airwallex_request_id: requestId,
                status: 'pending',
                checkout_url: checkoutUrl,
                return_url: success_url,
                cancel_url: cancel_url,
                created_at: new Date().toISOString(),
                metadata: {
                    source: 'hanami_subscription',
                    plan_id: plan_id,
                    billing_cycle: billing_cycle,
                    auto_renew: false,
                    org_id: org_id
                }
            } as any);

            return NextResponse.json({
                success: true,
                checkout_url: checkoutUrl,
                payment_intent_id: paymentData.id,
                subscription_type: 'one_time',
                auto_renew: false,
                end_date: endDate.toISOString(),
                message: '付款創建成功（手動續費模式）'
            });
        }

    } catch (error) {
        console.error('Subscription creation error:', error);
        return NextResponse.json(
            {
                success: false,
                error: '訂閱創建失敗',
                details: error instanceof Error ? error.message : '未知錯誤'
            },
            { status: 500 }
        );
    }
}

// Helper: Get max students for plan
function getMaxStudentsForPlan(planId: string): number {
    const planLimits: Record<string, number> = {
        'seed': 10,
        'starter': 50,
        'growth': 100,
        'pro': 250,
        'enterprise': 500
    };
    return planLimits[planId] || 10;
}
