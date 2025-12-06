// @ts-ignore
import { createClient, SupabaseClient } from "supabase-js";
// @ts-ignore
declare var Deno: any;
import { ChatRequest, ChatResponse, Message, RoleConfig, ModelConfig, MindBlock, ContentPart } from "./types.ts";
import { callLLM, generateImage } from "./providers.ts";

export async function processChat(
    supabase: SupabaseClient,
    userId: string,
    request: ChatRequest
): Promise<ChatResponse> {
    const { message, roomId, companionId, modelId, attachments } = request;

    console.log(`Processing chat for user ${userId} in room ${roomId} with companion ${companionId}`);

    // 1. Fetch Role Configuration
    let roleConfig: RoleConfig | null = null;
    if (companionId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = uuidRegex.test(companionId);

        // Mapping for simple frontend slugs to DB slugs
        const slugMapping: Record<string, string> = {
            'hibi': 'hibi-manager',
            'mori': 'mori-researcher',
            'pico': 'pico-artist'
        };

        let query = supabase.from('ai_roles').select('*');

        if (isUuid) {
            query = query.eq('id', companionId);
        } else {
            const targetSlug = slugMapping[companionId] || companionId;
            query = query.eq('slug', targetSlug);
        }

        const { data, error } = await query.single();

        if (error) {
            console.error('Error fetching role:', error);
            // Fallback or error? For now, error if role not found
            throw new Error(`Role not found: ${companionId}`);
        }
        roleConfig = data;
    }

    if (!roleConfig) {
        throw new Error('Role configuration is required');
    }

    // 1.5 Fetch Role Instance Override (User Preference for this Room)
    // The user stores their model selection in role_instances.model_override, so we must check this.
    let roleInstanceOverride: string | null = null;
    if (roleConfig && roomId) {
        const { data: instanceData } = await supabase
            .from('role_instances')
            .select('model_override')
            .eq('room_id', roomId)
            .eq('role_id', roleConfig.id)
            .maybeSingle();

        if (instanceData?.model_override) {
            roleInstanceOverride = instanceData.model_override;
            console.log(`Using model override from role_instance: ${roleInstanceOverride}`);
        }
    }

    // 2. Resolve Models (Support Multiple)
    let targetModelIds: string[] = [];
    // Priority: Explicit Request (if not __default__) > Room Override > Global Default
    let effectiveModelId = modelId;
    if (effectiveModelId === '__default__') {
        effectiveModelId = undefined;
    }

    const rawModelId = effectiveModelId || roleInstanceOverride || roleConfig.default_model;

    if (rawModelId) {
        // Handle "__default__" placeholder from DB by mapping to a likely valid default
        // User seems to prefer Gemini 2.0 Flash Lite
        const cleanedId = rawModelId === '__default__' ? 'gemini-2.0-flash-lite-preview-02-05' : rawModelId;
        targetModelIds = cleanedId.split(',').map(id => id.trim()).filter(Boolean);
    }

    if (targetModelIds.length === 0) {
        targetModelIds = ['gemini-2.0-flash-lite-preview-02-05'];
    }

    // Fetch all model configs
    let { data: modelDataList, error: modelError } = await supabase
        .from('model_configs')
        .select('*')
        .in('model_id', targetModelIds);

    // Robust Fallback: If requested models aren't found, grab ANY valid model to prevent crash
    if (modelError || !modelDataList || modelDataList.length === 0) {
        console.warn(`Requested models [${targetModelIds.join(', ')}] not found in DB. Fetching system fallback...`);

        // Fetch up to 10 models to log what is actually available for debugging
        const { data: fallbackData } = await supabase
            .from('model_configs')
            .select('*')
            .limit(10);

        if (fallbackData && fallbackData.length > 0) {
            // Log available models for debugging
            console.log(`Available models in DB: ${fallbackData.map(m => m.model_id).join(', ')}`);

            // Use the first one
            modelDataList = [fallbackData[0]];
            console.log(`System fallback successfully resolved to: ${modelDataList[0].model_id}`);
        } else {
            // Only throw if database is truly empty or inaccessible
            console.error('Critical: No model configs available in database.');
            throw new Error(`Model configs not found for: ${targetModelIds.join(', ')} and no fallback available.`);
        }
    }

    const modelConfigs: ModelConfig[] = modelDataList;

    // 3. Fetch Mind Blocks (Active/Equipped)
    const { data: mindBlocksData, error: mbError } = await supabase
        .from('role_mind_blocks')
        .select('mind_blocks(*)')
        .eq('user_id', userId)
        .eq('role_id', roleConfig.id)
        .eq('is_active', true);

    const mindBlocks: MindBlock[] = mindBlocksData?.map((row: any) => row.mind_blocks).filter(Boolean) || [];

    // 4. Construct System Prompt
    // User requested to ignore the default style/persona from DB and only use Name + Mind Blocks for ALL roles.
    let systemPrompt = `You are ${roleConfig.name}.`;

    if (mindBlocks.length > 0) {
        const mindBlocksPrompt = mindBlocks.map(mb => {
            return mb.compiled_prompt || JSON.stringify(mb.content_json);
        }).join("\n\n");
        systemPrompt += "\n\n" + mindBlocksPrompt;
    }

    // 5. Fetch Conversation History
    const { data: historyData, error: historyError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(10);

    const history: Message[] = (historyData || []).reverse().map((msg: any) => {
        let content = msg.content;
        // Sanitize base64 images from history to avoid context limit errors
        if (typeof content === 'string' && content.includes('data:image')) {
            // Replace markdown image with base64 data: ![...](data:image/...)
            content = content.replace(/!\[(.*?)\]\(data:image\/[a-zA-Z+]+;base64,[^)]+\)/g, '[Image: Base64 data removed]');
        }
        return {
            role: msg.sender_type === 'user' ? 'user' : 'assistant',
            content: content
        };
    });

    // 6. Prepare Messages for LLM
    const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
    ];

    // Handle attachments (Multi-modal)
    if (attachments && attachments.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const contentParts: ContentPart[] = [{ type: 'text', text: message }];

        for (const att of attachments) {
            if (att.type === 'image') {
                contentParts.push({
                    type: 'image_url',
                    image_url: { url: att.url }
                });
            }
        }
        lastMsg.content = contentParts;
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Cost Constants
    // 1 USD = 33,000 Food (Base Rate) * 2 (Profit Margin) = 66,000 Food
    // You can adjust this via the USD_TO_FOOD_RATE environment variable.
    const DEFAULT_USD_TO_FOOD_RATE = 66000;
    const USD_TO_FOOD_RATE = Number(Deno.env.get('USD_TO_FOOD_RATE')) || DEFAULT_USD_TO_FOOD_RATE;

    const IMAGE_GENERATION_COST = 500; // Fallback if no cost data available
    const DEFAULT_FOOD_COST_PER_1K_CHARS = 10; // Fallback for text

    // 7. Estimate Food Cost (Pre-check)
    const CHARS_PER_FOOD = 100;
    const OVERHEAD_CHARS = 20;

    function countChars(s: string) {
        return (s || '').match(/\S/g)?.length || 0;
    }

    const inputChars = countChars(systemPrompt) + countChars(message) + OVERHEAD_CHARS;
    const estimatedInputFood = Math.ceil(inputChars / CHARS_PER_FOOD);

    // Check Balance
    const { data: balanceData, error: balanceError } = await supabase
        .from('user_food_balance')
        .select('current_balance, total_spent')
        .eq('user_id', userId)
        .single();

    if (balanceError && balanceError.code !== 'PGRST116') { // Ignore if not found (assume 0 or handle gracefully)
        console.error('Error fetching food balance:', balanceError);
    }

    const currentBalance = balanceData?.current_balance || 0;
    if (currentBalance < estimatedInputFood) {
        throw new Error(`Insufficient food balance. Required: ${estimatedInputFood}, Available: ${currentBalance}`);
    }

    // 8. Call LLMs (Parallel if multiple)
    console.log(`Calling ${modelConfigs.length} models: ${modelConfigs.map(m => m.model_id).join(', ')}`);

    // Check for Image Generation Intent (Pico only)
    let generatedImageUrl: string | null = null;
    let imageUsage: any = null;
    const isPico = roleConfig.slug === 'pico-artist' || companionId === 'pico' || companionId === 'pico-artist';

    // Use the first selected model for image generation
    const imageModelId = modelConfigs.length > 0 ? modelConfigs[0].model_id : "openai/dall-e-3";

    // Check if the model itself implies image generation
    const isImageModel = imageModelId.toLowerCase().includes('image') ||
        imageModelId.toLowerCase().includes('dall-e') ||
        imageModelId.toLowerCase().includes('flux') ||
        imageModelId.toLowerCase().includes('midjourney') ||
        imageModelId.toLowerCase().includes('stable-diffusion');

    const imageKeywords = ['draw', 'image', 'picture', 'photo', 'pic', '圖', '畫', '繪', '照', '像'];
    const hasImageKeyword = imageKeywords.some(keyword => message.toLowerCase().includes(keyword));

    // Trigger if it's Pico AND (keyword detected OR explicitly using an image model)
    const isImageRequest = isPico && (hasImageKeyword || isImageModel);

    if (isImageRequest) {
        try {
            console.log(`Detected image generation intent for Pico. Using model: ${imageModelId}`);
            const imageResult = await generateImage(message, imageModelId, systemPrompt);
            generatedImageUrl = imageResult.url;
            imageUsage = imageResult.usage;

            // Handle Base64 Images (Upload to Supabase Storage)
            if (generatedImageUrl && generatedImageUrl.startsWith('data:image')) {
                try {
                    console.log('Detected base64 image, uploading to Supabase Storage...');
                    // Extract base64 data
                    const matches = generatedImageUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        const fileType = matches[1];
                        const extension = fileType === 'jpeg' ? 'jpg' : fileType;
                        const base64Data = matches[2];

                        // Convert base64 to Uint8Array
                        const binaryString = atob(base64Data);
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }

                        const fileName = `${userId}/${companionId}/${Date.now()}.${extension}`;
                        console.log(`Uploading image: ${fileName}, Size: ${len} bytes`);

                        const { data: uploadData, error: uploadError } = await supabase
                            .storage
                            .from('ai-images')
                            .upload(fileName, bytes, {
                                contentType: `image/${fileType}`,
                                upsert: false
                            });

                        if (uploadError) {
                            console.error('Error uploading image to Supabase:', uploadError);
                            // Keep generatedImageUrl as base64 so user still sees it (fallback)
                        } else {
                            console.log('Upload successful:', uploadData);
                            const { data: publicUrlData } = supabase
                                .storage
                                .from('ai-images')
                                .getPublicUrl(fileName);

                            if (publicUrlData) {
                                generatedImageUrl = publicUrlData.publicUrl;
                                console.log('Image uploaded successfully. Public URL:', generatedImageUrl);
                            }
                        }
                    }
                } catch (uploadErr) {
                    console.error('Exception during image upload:', uploadErr);
                }
            } else if (generatedImageUrl && generatedImageUrl.startsWith('http')) {
                console.log('Image is already a URL, skipping upload:', generatedImageUrl);
            }
        } catch (err) {
            console.error('Error generating image:', err);
            // Continue to text generation even if image fails
        }
    }

    const responses = await Promise.all(modelConfigs.map(async (config) => {
        try {
            const res = await callLLM(config, messages);
            return { config, res, error: null };
        } catch (err) {
            console.error(`Error calling model ${config.model_id}:`, err);
            return { config, res: null, error: err };
        }
    }));

    // 9. Aggregate Responses & Calculate Final Food Cost
    let finalContent = "";
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let primaryModelId = modelConfigs[0].model_id; // Default to first for metadata

    if (responses.length === 1) {
        const { res, error } = responses[0];
        if (error) throw error;
        finalContent = res!.content;
        totalInputTokens = res!.usage?.prompt_tokens || 0;
        totalOutputTokens = res!.usage?.completion_tokens || 0;
        totalTokens = res!.usage?.total_tokens || 0;
    } else {
        // Multi-model aggregation
        finalContent = responses.map(({ config, res, error }) => {
            if (error) {
                return `### [Model: ${config.display_name || config.model_name}] (Failed)\nError: ${(error as any).message}`;
            }
            totalInputTokens += res!.usage?.prompt_tokens || 0;
            totalOutputTokens += res!.usage?.completion_tokens || 0;
            totalTokens += res!.usage?.total_tokens || 0;
            return `### [Model: ${config.display_name || config.model_name}]\n${res!.content}`;
        }).join("\n\n---\n\n");

        primaryModelId = "multi-model";
    }

    // Append generated image if available
    if (generatedImageUrl) {
        // Strip existing markdown images to prevent duplication (hallucinations from history)
        // This removes any ![...](...) patterns from the text response
        finalContent = finalContent.replace(/!\[.*?\]\(.*?\)/g, '');
        finalContent += `\n\n![Generated Image](${generatedImageUrl})`;
    }

    const outputChars = countChars(finalContent);
    // Calculate food cost:
    // Priority 1: Granular Food Tokens from Metadata (food_tokens.text_input, etc.)
    // Priority 2: USD Cost * 66,000 (2x Profit Margin, assuming $1 = 33,000 Food)
    // Priority 3: Fallback defaults

    let totalFoodCost = 0;
    let imageCost = 0;
    let textInputCost = 0;
    let textOutputCost = 0;

    // --- Image Cost Calculation ---
    if (generatedImageUrl) {
        const imageConfig = modelConfigs.find(m => m.model_id === imageModelId) || modelConfigs[0];
        const meta = imageConfig.metadata || {};
        const foodTokens = meta.food_tokens || {};

        // 1. Granular Food Tokens
        if (foodTokens.image_output) {
            imageCost = Number(foodTokens.image_output);
        }
        // 2. USD Cost * Food Ratio (USD_TO_FOOD_RATE)
        else {
            // Try to get cost from usage
            let costUsd = 0;
            if (imageUsage && typeof imageUsage.cost === 'number') {
                costUsd = imageUsage.cost;
            } else if (imageConfig.output_cost_usd) {
                // Fallback to model config cost (per image? usually per 1M tokens, but for image models it might be per image)
                // For simplicity, if output_cost_usd is set for an image model, assume it's per image or per 1M tokens?
                // OpenRouter usually reports cost in usage. Let's rely on usage.cost if possible.
                // If usage.cost is missing, we might need to look at input/output tokens.
                const tokens = imageUsage?.total_tokens || 0;
                // Assuming output_cost_usd is per 1M tokens
                costUsd = (tokens / 1000000) * (Number(imageConfig.output_cost_usd) || 0);
            }

            if (costUsd > 0) {
                imageCost = Math.ceil(costUsd * USD_TO_FOOD_RATE);
            } else {
                // 3. Fallback to Token Usage (Old Logic) or Fixed
                if (imageUsage && typeof imageUsage.total_tokens === 'number') {
                    // If no USD cost available, maybe just use tokens?
                    // But user wants 2x profit.
                    // Let's fallback to fixed cost if we can't calculate USD.
                    imageCost = IMAGE_GENERATION_COST;
                } else {
                    imageCost = IMAGE_GENERATION_COST;
                }
            }
        }
    }

    // --- Text Cost Calculation ---
    // We need to calculate cost for EACH model response if multiple models are used.
    // For now, we sum them up.

    for (const { config, res, error } of responses) {
        if (error || !res) continue;

        const meta = config.metadata || {};
        const foodTokens = meta.food_tokens || {};
        const usage = res.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        let modelInputCost = 0;
        let modelOutputCost = 0;
        let hasPricing = false;

        // Input Cost
        if (foodTokens.text_input) {
            modelInputCost = Math.ceil((usage.prompt_tokens || 0) / 1000000 * Number(foodTokens.text_input));
            hasPricing = true;
        } else {
            // USD Cost * Food Ratio (USD_TO_FOOD_RATE)
            if (config.input_cost_usd) {
                const inputUsd = (usage.prompt_tokens || 0) / 1000000 * Number(config.input_cost_usd);
                modelInputCost = Math.ceil(inputUsd * USD_TO_FOOD_RATE);
                hasPricing = true;
            }
        }

        // Output Cost
        if (foodTokens.text_output) {
            modelOutputCost = Math.ceil((usage.completion_tokens || 0) / 1000000 * Number(foodTokens.text_output));
            hasPricing = true;
        } else {
            // USD Cost * Food Ratio (USD_TO_FOOD_RATE)
            if (config.output_cost_usd) {
                const outputUsd = (usage.completion_tokens || 0) / 1000000 * Number(config.output_cost_usd);
                modelOutputCost = Math.ceil(outputUsd * USD_TO_FOOD_RATE);
                hasPricing = true;
            }
        }

        // Per-Model Fallback: If no pricing found for this model, use character-based estimate
        if (!hasPricing) {
            const modelContent = res.content || '';
            const modelChars = countChars(modelContent);
            modelOutputCost = Math.ceil(modelChars / CHARS_PER_FOOD);
            // For input, we can't easily split the system prompt chars per model if they are identical, 
            // but we should charge for the input context sent to THIS model.
            // We used 'estimatedInputFood' before. Let's use that as a baseline for the "free" model's input cost?
            // Or just calculate chars from usage?
            // usage.prompt_tokens is a better proxy if we assume ~4 chars per token?
            // Let's stick to the CHARS_PER_FOOD logic for consistency with legacy.
            // Input chars: systemPrompt + message.
            const inputCharsForModel = countChars(systemPrompt) + countChars(message) + OVERHEAD_CHARS;
            modelInputCost = Math.ceil(inputCharsForModel / CHARS_PER_FOOD);
        }

        textInputCost += modelInputCost;
        textOutputCost += modelOutputCost;
    }

    // (Removed global fallback since we handle it per-model now)

    totalFoodCost = textInputCost + textOutputCost + imageCost;

    // Ensure we don't charge less than the estimate if it was a simple text request?
    // Actually, accurate pricing is better.
    // But we need to make sure we deduct the *actual* cost, not the estimate.
    // The estimate was used for the balance check.


    // 10. Save Response
    const { data: assistantMsg, error: saveError } = await supabase
        .from('ai_messages')
        .insert({
            room_id: roomId,
            sender_type: 'role',
            sender_role_instance_id: null,
            content: finalContent,
            model_used: primaryModelId,
            processing_time_ms: 0,
            content_json: {
                food: {
                    input_chars: inputChars,
                    output_chars: outputChars,
                    total_food_cost: totalFoodCost,
                    image_tokens: imageCost, // Add this to show where the cost comes from
                    CHARS_PER_FOOD
                },
                mind_name: mindBlocks.map(mb => mb.title).join(', '),
                debug: {
                    roleId: roleConfig?.id,
                    userId: userId,
                    mindBlocksCount: mindBlocks?.length || 0,
                    mindBlocksTitles: mindBlocks?.map((mb: any) => mb?.title || mb?.name || 'Untitled') || []
                },
                model_responses: responses.map(({ config, res, error }, index) => {
                    let content = error ? `Error: ${(error as any).message}` : res?.content;
                    // Append image to the first model's response if available
                    if (index === 0 && generatedImageUrl) {
                        content += `\n\n![Generated Image](${generatedImageUrl})`;
                    }
                    return {
                        model: config.display_name || config.model_name,
                        content: content,
                        usage: res?.usage,
                        mind_name: mindBlocks.map(mb => mb.title).join(', ')
                    };
                })
            }
        })
        .select()
        .single();

    if (saveError) {
        console.error('Error saving assistant message:', saveError);
    }

    // 11. Deduct Food & Record Transaction
    if (assistantMsg) {
        try {
            console.log(`Attempting food deduction for user ${userId}, cost: ${totalFoodCost}`);

            // 1. Try RPC (Preferred, secure, atomic)
            // Using the user-scoped client passed into processChat
            const { data: updatedBalance, error: updateError } = await supabase.rpc('deduct_user_food', {
                p_user_id: userId,
                p_amount: totalFoodCost,
                p_reason: `LLM spend: ${roleConfig.slug} using ${primaryModelId}`
            });

            if (updateError) {
                console.error('RPC deduct_user_food failed:', updateError);

                // 2. Fallback: Log transaction only (User client might have permission to insert, but not update balance)
                // We rely on RPC for balance update. If RPC fails, balance might be out of sync, but we record the attempt.
                const { error: insertError } = await supabase.from('food_transactions').insert({
                    user_id: userId,
                    transaction_type: 'usage',
                    amount: -totalFoodCost,
                    balance_after: (currentBalance - totalFoodCost),
                    ai_message_id: assistantMsg.id,
                    ai_room_id: roomId,
                    description: `LLM spend: ${roleConfig.slug} using ${primaryModelId} (RPC Failed: ${updateError.message})`
                });

                if (insertError) {
                    console.error('Fallback insert failed:', insertError);
                }
            } else {
                console.log('Food deduction successful, new balance:', updatedBalance);
            }

            // 3. Record Message Costs (Best effort)
            await supabase.from('message_costs').insert({
                ai_message_id: assistantMsg.id,
                ai_room_id: roomId,
                user_id: userId,
                input_tokens: totalInputTokens,
                output_tokens: totalOutputTokens,
                total_tokens: totalTokens,
                model_provider: 'supabase-edge',
                model_name: primaryModelId,
                total_cost_usd: 0,
                food_amount: totalFoodCost
            });

        } catch (foodError) {
            // CRITICAL: Swallow error to ensure chat response is returned to user regardless of food logic failure
            console.error('Food deduction logic crashed:', foodError);
        }
    }

    return {
        success: true,
        content: finalContent,
        messageId: assistantMsg?.id,
        content_json: assistantMsg?.content_json,
        model_used: assistantMsg?.model_used
    };
}
