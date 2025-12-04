import { createClient, SupabaseClient } from "supabase-js";
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

    // 2. Resolve Models (Support Multiple)
    let targetModelIds: string[] = [];
    const rawModelId = modelId || roleConfig.default_model;

    if (rawModelId) {
        targetModelIds = rawModelId.split(',').map(id => id.trim()).filter(Boolean);
    }

    if (targetModelIds.length === 0) {
        throw new Error('No model configured for this role');
    }

    // Fetch all model configs
    const { data: modelDataList, error: modelError } = await supabase
        .from('model_configs')
        .select('*')
        .in('model_id', targetModelIds);

    if (modelError || !modelDataList || modelDataList.length === 0) {
        console.error('Error fetching model configs:', modelError);
        throw new Error(`Model configs not found for: ${targetModelIds.join(', ')}`);
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
    let systemPrompt = roleConfig.system_prompt || "You are a helpful AI assistant.";

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
            generatedImageUrl = await generateImage(message, imageModelId);

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

                        const { data: uploadData, error: uploadError } = await supabase
                            .storage
                            .from('ai-images')
                            .upload(fileName, bytes, {
                                contentType: `image/${fileType}`,
                                upsert: false
                            });

                        if (uploadError) {
                            console.error('Error uploading image to Supabase:', uploadError);
                        } else {
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
                return `### [Model: ${config.display_name || config.model_name}] (Failed)\nError: ${error.message}`;
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
        finalContent += `\n\n![Generated Image](${generatedImageUrl})`;
    }

    const outputChars = countChars(finalContent);
    const outputFood = Math.ceil(outputChars / CHARS_PER_FOOD);
    const totalFoodCost = estimatedInputFood + outputFood;

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
                    CHARS_PER_FOOD
                },
                mind_name: mindBlocks.map(mb => mb.title).join(', '),
                model_responses: responses.map(({ config, res, error }) => ({
                    model: config.display_name || config.model_name,
                    content: error ? `Error: ${(error as any).message}` : res?.content,
                    usage: res?.usage,
                    mind_name: mindBlocks.map(mb => mb.title).join(', ')
                }))
            }
        })
        .select()
        .single();

    if (saveError) {
        console.error('Error saving assistant message:', saveError);
    }

    // 11. Deduct Food & Record Transaction
    if (assistantMsg) {
        // Update Balance
        const { data: updatedBalance, error: updateError } = await supabase.rpc('deduct_user_food', {
            p_user_id: userId,
            p_amount: totalFoodCost
        });

        // If RPC doesn't exist, fallback to direct update (less safe for concurrency but works for now)
        if (updateError) {
            console.log('RPC deduct_user_food not found or failed, using direct update:', updateError);
            await supabase
                .from('user_food_balance')
                .update({
                    current_balance: currentBalance - totalFoodCost,
                    total_spent: (balanceData?.total_spent || 0) + totalFoodCost,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);
        }

        // Record Transaction
        await supabase.from('food_transactions').insert({
            user_id: userId,
            transaction_type: 'spend',
            amount: totalFoodCost,
            balance_after: (currentBalance - totalFoodCost), // Approximate if concurrent
            message_id: assistantMsg.id,
            thread_id: roomId,
            description: `LLM spend: ${primaryModelId} (in=${inputChars}, out=${outputChars}, food=${totalFoodCost})`
        });

        // Record Message Costs (Legacy table support)
        await supabase.from('message_costs').insert({
            message_id: assistantMsg.id,
            thread_id: roomId,
            user_id: userId,
            input_tokens: totalInputTokens,
            output_tokens: totalOutputTokens,
            total_tokens: totalTokens,
            model_provider: 'supabase-edge', // or specific provider
            model_name: primaryModelId,
            total_cost_usd: 0, // TODO: Implement cost calc
            food_amount: totalFoodCost
        });
    }

    return {
        success: true,
        content: finalContent,
        messageId: assistantMsg?.id,
        content_json: assistantMsg?.content_json,
        model_used: assistantMsg?.model_used
    };
}
