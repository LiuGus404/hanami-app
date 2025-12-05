import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. List files in ai-images bucket
        // Note: This lists only the top level or requires recursive listing.
        // For simplicity, we'll list the top 100 files and check them.
        // In a production env with many files, we'd need pagination.
        const { data: files, error: listError } = await supabase
            .storage
            .from('ai-images')
            .list('', { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });

        if (listError) {
            throw listError;
        }

        if (!files || files.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No files found to cleanup' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const now = new Date();
        const retentionPeriodMs = 48 * 60 * 60 * 1000; // 48 hours
        const filesToDelete: string[] = [];

        // 2. Filter files older than 48 hours
        for (const file of files) {
            // Skip folders (if any)
            if (!file.id) continue;

            const createdAt = new Date(file.created_at);
            const ageMs = now.getTime() - createdAt.getTime();

            if (ageMs > retentionPeriodMs) {
                filesToDelete.push(file.name);
            }
        }

        // 3. Delete expired files
        if (filesToDelete.length > 0) {
            console.log(`Deleting ${filesToDelete.length} expired images:`, filesToDelete);
            const { error: deleteError } = await supabase
                .storage
                .from('ai-images')
                .remove(filesToDelete);

            if (deleteError) {
                throw deleteError;
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                deleted_count: filesToDelete.length,
                deleted_files: filesToDelete
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Cleanup error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
