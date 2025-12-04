import { ModelConfig, Message } from "./types.ts";

export interface LLMResponse {
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    latency?: number;
}

export async function callLLM(config: ModelConfig, messages: Message[]): Promise<LLMResponse> {
    const startTime = Date.now();

    // Determine provider
    // This is a simplified abstraction. In a real scenario, we might have separate classes.

    let response: LLMResponse = { content: "" };

    try {
        // Check if we should use OpenRouter for Google models (if GEMINI_API_KEY is missing but OPENROUTER_API_KEY exists)
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
        const geminiKey = Deno.env.get('GEMINI_API_KEY');

        if (config.provider === 'google' && !geminiKey && openRouterKey) {
            console.log('Routing Google model to OpenRouter due to missing GEMINI_API_KEY');
            config.provider = 'openrouter';
        }

        // List of providers that are OpenAI compatible or supported via OpenRouter
        const openAICompatibleProviders = [
            'openai', 'openrouter', 'deepseek', 'x-ai', 'mistralai', 'perplexity',
            'qwen', 'moonshotai', 'ai21', 'meituan', 'microsoft', 'bytedance',
            'meta-llama', 'baidu', 'alibaba', 'stepfun-ai', 'nvidia', 'deepcogito',
            'opengvlab', 'nousresearch', 'z-ai'
        ];

        if (openAICompatibleProviders.includes(config.provider)) {
            response = await callOpenAICompatible(config, messages);
        } else if (config.provider === 'google') {
            response = await callGoogleGemini(config, messages);
        } else if (config.provider === 'anthropic') {
            // Check if we should route Anthropic via OpenRouter
            const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
            if (!anthropicKey && openRouterKey) {
                console.log('Routing Anthropic model to OpenRouter due to missing ANTHROPIC_API_KEY');
                // Temporarily change provider to openrouter for the call
                const openRouterConfig = { ...config, provider: 'openrouter' };
                response = await callOpenAICompatible(openRouterConfig, messages);
            } else {
                response = await callAnthropic(config, messages);
            }
        } else {
            throw new Error(`Unsupported provider: ${config.provider}`);
        }
    } catch (error) {
        console.error(`LLM Call Error (${config.provider}):`, error);
        throw error;
    }

    response.latency = Date.now() - startTime;
    return response;
}

export async function generateImage(prompt: string, modelId: string = "openai/dall-e-3", systemPrompt?: string): Promise<string> {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');

    let apiKey = openaiKey;
    let url = 'https://api.openai.com/v1/images/generations';
    let headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    // Determine endpoint and method based on model
    const isDallE = modelId.toLowerCase().includes('dall-e');

    // If modelId suggests OpenRouter (e.g. contains '/') or we only have OpenRouter key
    // Note: openai/dall-e-3 is also a valid OpenRouter model ID
    const useOpenRouter = !apiKey || (openRouterKey && (modelId.includes('/') || modelId.startsWith('google/') || modelId.startsWith('stabilityai/')));

    if (useOpenRouter && !isDallE) {
        // For non-DALL-E models on OpenRouter (e.g. Gemini, Flux), use chat/completions
        console.log(`Using OpenRouter chat/completions for image generation with model: ${modelId}`);
        apiKey = openRouterKey;
        url = 'https://openrouter.ai/api/v1/chat/completions';
        headers['HTTP-Referer'] = 'https://hanami.ai';
        headers['X-Title'] = 'Hanami AI';

        headers['Authorization'] = `Bearer ${apiKey}`;

        console.log(`Generating image via chat/completions for prompt: ${prompt.substring(0, 50)}... using model ${modelId}`);

        const messages: any[] = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const res = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: modelId,
                messages: messages,
                // OpenRouter specific for some models like Gemini to force image output
                modalities: ["image"],
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Image Generation Error (Chat): ${res.status} ${err}`);
        }

        const data = await res.json();

        // Try to extract image URL from various possible locations in OpenRouter response
        // 1. Standard OpenRouter/Gemini image format in message
        if (data.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
            return data.choices[0].message.images[0].image_url.url;
        }
        // 2. Markdown image in content
        if (data.choices?.[0]?.message?.content) {
            const content = data.choices[0].message.content;
            const match = content.match(/\!\[.*?\]\((.*?)\)/);
            if (match && match[1]) {
                return match[1];
            }
            // If content is just a URL
            if (content.startsWith('http')) {
                return content;
            }
        }

        throw new Error('Could not parse image URL from OpenRouter response');
    }

    // Fallback to standard images/generations (DALL-E or OpenAI direct)
    if (useOpenRouter && openRouterKey) {
        console.log(`Using OpenRouter images/generations for model: ${modelId}`);
        apiKey = openRouterKey;
        url = 'https://openrouter.ai/api/v1/images/generations';
        headers['HTTP-Referer'] = 'https://hanami.ai';
        headers['X-Title'] = 'Hanami AI';
    }

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY or OPENROUTER_API_KEY is required for image generation');
    }

    headers['Authorization'] = `Bearer ${apiKey}`;

    console.log(`Generating image via images/generations for prompt: ${prompt.substring(0, 50)}... via ${url} using model ${modelId}`);

    const res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            model: modelId,
            prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
            n: 1,
            size: "1024x1024",
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Image Generation Error: ${res.status} ${err}`);
    }

    const data = await res.json();
    return data.data[0].url;
}

async function callOpenAICompatible(config: ModelConfig, messages: Message[]): Promise<LLMResponse> {
    const envKey = config.api_key_env || 'OPENAI_API_KEY';
    const specificKey = Deno.env.get(envKey);
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');

    const apiKey = specificKey || openRouterKey;

    // Determine Base URL
    // If explicitly set in config, use it.
    // If provider is openrouter, use OpenRouter URL.
    // If we are falling back to OpenRouter Key and have no specific key, use OpenRouter URL.
    let baseUrl = config.base_url;
    if (!baseUrl) {
        if (config.provider === 'openrouter' || (!specificKey && openRouterKey)) {
            baseUrl = 'https://openrouter.ai/api/v1';
        } else {
            baseUrl = 'https://api.openai.com/v1';
        }
    }

    // Special handling for some providers if using OpenRouter
    // Some might need model name adjustments, but usually OpenRouter handles "provider/model" format.
    // If config.model_id contains the provider prefix (e.g. "google/gemini..."), OpenRouter likes that.
    // config.model_name might be just "gemini..." or "google/gemini...". 
    // Let's ensure we send the full ID if using OpenRouter.
    const modelToSend = (baseUrl.includes('openrouter.ai') && config.model_id) ? config.model_id : config.model_name;

    console.log(`Calling LLM: ${modelToSend} via ${baseUrl}`);

    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(baseUrl.includes('openrouter.ai') ? {
                'HTTP-Referer': 'https://hanami.ai', // TODO: Update with real site
                'X-Title': 'Hanami AI'
            } : {})
        },
        body: JSON.stringify({
            model: modelToSend,
            messages: messages,
            temperature: 0.7, // TODO: Configurable
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`API Error (${config.provider}): ${res.status} ${err}`);
    }

    const data = await res.json();
    return {
        content: data.choices[0].message.content,
        usage: data.usage
    };
}

async function callGoogleGemini(config: ModelConfig, messages: Message[]): Promise<LLMResponse> {
    // Simplified Gemini implementation
    // Requires converting messages to Gemini format (user/model roles)
    // For now, let's assume we use OpenAI compatibility layer for Gemini if available, 
    // or implement direct API. 
    // Google often provides an OpenAI-compatible endpoint or we use the REST API.

    // Placeholder for direct REST API implementation
    // https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=API_KEY

    const apiKey = Deno.env.get(config.api_key_env || 'GEMINI_API_KEY');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model_name}:generateContent?key=${apiKey}`;

    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: Array.isArray(m.content)
            ? m.content.map(p => p.type === 'image_url' ? { inline_data: { mime_type: 'image/jpeg', data: p.image_url?.url } } : { text: p.text }) // Note: Gemini requires base64 for inline_data usually, or file_uri. This needs handling.
            : [{ text: m.content }]
    }));

    // Filter out system messages for Gemini (it uses system_instruction now, but let's keep it simple)
    // Or merge system prompt into first user message.
    const systemMsg = messages.find(m => m.role === 'system');
    let finalContents = contents.filter(c => c.role !== 'system');

    if (systemMsg) {
        // Add system prompt to the beginning? Or use system_instruction
        // API v1beta supports system_instruction
    }

    const payload: any = { contents: finalContents };
    if (systemMsg) {
        payload.system_instruction = { parts: [{ text: systemMsg.content }] };
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API Error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
        content,
        usage: {
            prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
            completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: data.usageMetadata?.totalTokenCount || 0
        }
    };
}

async function callAnthropic(config: ModelConfig, messages: Message[]): Promise<LLMResponse> {
    const apiKey = Deno.env.get(config.api_key_env || 'ANTHROPIC_API_KEY');
    const url = 'https://api.anthropic.com/v1/messages';

    // Anthropic requires system prompt separate
    const systemMsg = messages.find(m => m.role === 'system');
    const userAssistantMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content // Anthropic supports string or array of blocks
    }));

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey!,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: config.model_name,
            messages: userAssistantMessages,
            system: systemMsg?.content,
            max_tokens: 4096
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic API Error: ${res.status} ${err}`);
    }

    const data = await res.json();
    return {
        content: data.content[0].text,
        usage: {
            prompt_tokens: data.usage.input_tokens,
            completion_tokens: data.usage.output_tokens,
            total_tokens: data.usage.input_tokens + data.usage.output_tokens
        }
    };
}
