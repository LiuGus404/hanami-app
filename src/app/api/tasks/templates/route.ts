import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

// Get and Create Templates
export async function GET(request: NextRequest) {
    try {
        const supabase = createSaasAdminClient();

        // In a real multi-tenant app, filter by org/user.
        // For now, listing all for authenticated users.
        const { data, error } = await supabase
            .from('hanami_task_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createSaasAdminClient();
        const body = await request.json();

        if (!body.name || !body.task_data) {
            return NextResponse.json(
                { error: 'Name and task data are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('hanami_task_templates')
            // @ts-ignore
            .insert([{
                name: body.name,
                description: body.description,
                task_data: body.task_data,
                // created_by: session user id... (handled by RLS usually, or passed here if server-side)
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('Error creating template:', error);
        return NextResponse.json(
            { error: 'Failed to create template' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = createSaasAdminClient();
        const body = await request.json();

        if (!body.id || !body.name || !body.task_data) {
            return NextResponse.json(
                { error: 'ID, name and task data are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('hanami_task_templates')
            // @ts-ignore
            .update({
                name: body.name,
                description: body.description,
                task_data: body.task_data,
                updated_at: new Date().toISOString()
            })
            .eq('id', body.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating template:', error);
        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createSaasAdminClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('hanami_task_templates')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting template:', error);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
