import { serve } from "std/http/server.ts";
import { createClient } from "supabase-js";
import { ChatRequest, ChatResponse, Message, RoleConfig, ModelConfig } from "./types.ts";
import { processChat } from "./processor.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Verify auth
        let userId = '';
        const authHeader = req.headers.get('Authorization');

        // Check if using Service Role Key (admin bypass)
        const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'placeholder-service-key');

        if (isServiceRole) {
            // If service role, trust the userId passed in body
            const body = await req.json();
            userId = body.userId;

            if (!userId) {
                return new Response(JSON.stringify({ error: 'userId required for service role calls' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Re-assign body for processing
            const { message, roomId, companionId, modelId, attachments } = body as ChatRequest;

            if (!message && !attachments?.length) {
                return new Response(JSON.stringify({ error: 'Message or attachments required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Process the chat request
            const result = await processChat(supabaseClient, userId, {
                message,
                roomId,
                companionId,
                modelId,
                attachments
            });

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } else {
            // Standard User Auth
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
            userId = user.id;

            const { message, roomId, companionId, modelId, attachments } = await req.json() as ChatRequest;

            if (!message && !attachments?.length) {
                return new Response(JSON.stringify({ error: 'Message or attachments required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Process the chat request
            const result = await processChat(supabaseClient, userId, {
                message,
                roomId,
                companionId,
                modelId,
                attachments
            });

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error processing chat:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
