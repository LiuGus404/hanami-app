import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

// POST /api/org-subscription/update-auto-renew
// Updates the auto_renew setting for an organization's subscription
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orgId, autoRenew } = body;

        if (!orgId) {
            return NextResponse.json(
                { error: 'orgId is required' },
                { status: 400 }
            );
        }

        if (typeof autoRenew !== 'boolean') {
            return NextResponse.json(
                { error: 'autoRenew must be a boolean' },
                { status: 400 }
            );
        }

        const saasSupabase = createSaasAdminClient() as any;

        // Update the auto_renew field in org_subscriptions
        const { data, error } = await saasSupabase
            .from('org_subscriptions')
            .update({ auto_renew: autoRenew })
            .eq('org_id', orgId)
            .select()
            .single();

        if (error) {
            console.error('Error updating auto_renew:', error);
            return NextResponse.json(
                { error: 'Failed to update auto-renew setting' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            autoRenew: data.auto_renew,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
