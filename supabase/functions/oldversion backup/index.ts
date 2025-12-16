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
            console.log(`[Auth Debug] Header present: ${!!authHeader}, Length: ${authHeader?.length}`);

            const token = authHeader?.replace('Bearer ', '');
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

            if (authError || !user) {
                console.error('[Auth Error] getUser failed:', authError);
                return new Response(JSON.stringify({
                    error: 'Unauthorized',
                    details: 'Auth validation failed',
                    debug: {
                        headerLength: authHeader?.length,
                        authError: authError?.message,
                        envUrl: Deno.env.get('SUPABASE_URL'),
                        tokenPart: authHeader?.slice(0, 20) + '...',
                        // Simple base64 decoding of the middle part of JWT
                        decodedClaims: (() => {
                            try {
                                const parts = authHeader?.split(' ')[1]?.split('.');
                                if (parts && parts.length === 3) {
                                    return JSON.parse(atob(parts[1]));
                                }
                                return 'Invalid JWT format';
                            } catch (e) {
                                return 'Decode failed: ' + e.message;
                            }
                        })()
                    }
                }), {
                    // Return 200 to bypass client-side error throwing and see the body
                    status: 200,
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



    } catch (error: any) {
        console.error('Error processing chat:', error);

        // DEBUG: Return error as a visibly rendered chat message
        // This bypasses the 500 error screen on the frontend and shows the stack trace
        const errorResponse: ChatResponse = {
            success: false,
            content: `### ❌ System Error\n\n**Message**: ${error.message}\n\n**Stack**:\n\`\`\`\n${error.stack}\n\`\`\``,
            messageId: 'debug-error',
            content_json: null,
            model_used: 'debug-handler'
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 200, // Force 200 OK so the frontend displays the content
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
