import { ModelConfig, Message } from "./types.ts";

import { Buffer } from "node:buffer";

declare const Deno: any;

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

export async function generateImage(prompt: string, modelId: string = "openai/dall-e-3", systemPrompt?: string): Promise<{ url: string, usage?: any }> {
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
            return { url: data.choices[0].message.images[0].image_url.url, usage: data.usage };
        }
        // 2. Markdown image in content
        if (data.choices?.[0]?.message?.content) {
            const content = data.choices[0].message.content;
            const match = content.match(/\!\[.*?\]\((.*?)\)/);
            if (match && match[1]) {
                return { url: match[1], usage: data.usage };
            }
            // If content is just a URL
            if (content.startsWith('http')) {
                return { url: content, usage: data.usage };
            }
        }

        // 3. Try to find any URL in the response (fallback)
        // Log the full response for debugging
        console.log('OpenRouter Response Data:', JSON.stringify(data, null, 2));

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
    const imageUrl = data.data[0].url;

    return { url: imageUrl };
}

// Helper to buffer to base64
async function blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export interface AudioAnalysis {
    transcription: string;
    description: string;
    usage?: any;
    model?: string;
}

export async function analyzeAudioWithGemini(audioUrl: string): Promise<AudioAnalysis> {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');

    // Always prefer OpenRouter for this specific feature as we want Gemini 2.5 Flash Preview
    const apiKey = openRouterKey || openaiKey;

    if (!apiKey) {
        console.warn('Skipping audio analysis: No API Key found');
        return {
            transcription: "[Audio: Analysis unavailable - Key missing]",
            description: "Unable to process audio due to missing configuration."
        };
    }

    // Correction: Using the specific model ID requested by the user.
    const TARGET_MODEL = "google/gemini-2.5-flash-preview-09-2025";

    try {

        console.log(`Analyzing audio from: ${audioUrl} using ${TARGET_MODEL}`);
        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) {
            throw new Error(`Failed to fetch audio file: ${audioRes.statusText} `);
        }
        const arrayBuffer = await audioRes.arrayBuffer();
        const mimeType = audioRes.headers.get('Content-Type') || 'audio/webm'; // Derive mimeType from response headers
        // Use Buffer.from() if available (Node/Deno compat in Supabase), or fall back to a robust binary string conversion
        let base64Audio = '';
        try {
            // @ts-ignore - Buffer is globally available in some runtimes like Deno/Node
            base64Audio = Buffer.from(arrayBuffer).toString('base64');
        } catch (e) {
            console.warn("Buffer not available, using fallback binary string conversion");
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            base64Audio = btoa(binary);
        }

        let format = 'webm';
        if (mimeType.includes('wav')) format = 'wav';
        else if (mimeType.includes('mp3')) format = 'mp3';
        else if (mimeType.includes('ogg')) format = 'ogg';
        else if (mimeType.includes('mp4') || mimeType.includes('m4a')) format = 'm4a';
        else if (mimeType.includes('aac')) format = 'aac';

        console.log(`Audio Analysis Debug: MimeType=${mimeType}, Format=${format}, Base64Length=${base64Audio.length}`);


        // Prompt for 2-phase analysis: Transcription + Description
        const promptText = `
Please analyze this audio file.
1. Provide a verbatim transcription.
2. Provide a visual or contextual description of the audio(tone, background sounds, emotion, or what is happening).

Output format(JSON):
        {
            "transcription": "...",
                "description": "..."
        }
        `;

        const payload = {
            model: TARGET_MODEL,
            response_format: { type: "json_object" }, // Force JSON
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: promptText },
                        {
                            type: "input_audio",
                            input_audio: {
                                data: base64Audio,
                                format: format
                            }
                        }
                    ]
                }
            ]
        };

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey} `,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://hanami.ai',
                'X-Title': 'Hanami AI'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`OpenRouter Analysis Error: ${res.status} ${err} `);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;

        let result: AudioAnalysis = {
            transcription: "[Audio: specific transcription failed]",
            description: "[Audio: specific description failed]",
            usage: data.usage,
            model: TARGET_MODEL
        };

        try {
            const parsed = JSON.parse(content);
            result.transcription = parsed.transcription || result.transcription;
            result.description = parsed.description || result.description;
        } catch (e) {
            console.warn('Failed to parse JSON response from audio analysis, falling back to raw text');
            result.transcription = content || "[Audio: Blank]";
            result.description = "Raw analysis: " + (content || "");
        }

        console.log('Audio Analysis success:', result);
        return result;

    } catch (error) {
        console.error('Audio Analysis failed:', error);
        return {
            transcription: `[Audio: Analysis failed - ${(error as any).message}]`,
            description: "Error processing audio attachment.",
            usage: null
        };
    }
}

export async function transcribeAudio(audioUrl: string): Promise<string> {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');

    // Default to OpenAI if available, otherwise check OpenRouter
    let shouldUseOpenRouter = !openaiKey && !!openRouterKey;
    const apiKey = openaiKey || openRouterKey;

    if (!apiKey) {
        console.warn('Skipping transcription: No OPENAI_API_KEY or OPENROUTER_API_KEY');
        return "[Audio: Transcription unavailable - Service configuration missing]";
    }

    try {
        console.log(`Transcribing audio from: ${audioUrl} `);
        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) {
            throw new Error(`Failed to fetch audio file: ${audioRes.statusText} `);
        }
        const blob = await audioRes.blob();

        if (shouldUseOpenRouter) {
            // OpenRouter Logic: Use chat/completions with multimodal input
            // Model: google/gemini-1.5-flash (supports audio and is cost-effective)
            console.log('ℹ️ [Transcription] Using OpenRouter (google/gemini-1.5-flash) via chat/completions');

            const base64Audio = await blobToBase64(blob);
            // Detect format from URL or MIME type if possible, default to wav or mp3
            // OpenRouter docs examples show "wav". 
            // The file from recorder is usually "audio/webm".
            const mimeType = blob.type || 'audio/webm';
            // Simple mapping or pass raw format string if supported. 
            // format: 'wav', 'mp3', 'webm' etc.
            let format = 'webm';
            if (mimeType.includes('wav')) format = 'wav';
            if (mimeType.includes('mp3')) format = 'mp3';
            if (mimeType.includes('m4a')) format = 'm4a';

            const payload = {
                model: "google/gemini-1.5-flash",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Transcribe this audio file exactly. Output only the transcription text, nothing else." },
                            {
                                type: "input_audio",
                                input_audio: {
                                    data: base64Audio,
                                    format: format
                                }
                            }
                        ]
                    }
                ]
            };

            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey} `,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://hanami.ai',
                    'X-Title': 'Hanami AI'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`OpenRouter Transcription Error: ${res.status} ${err} `);
            }

            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || "[Audio: Blank]";
            console.log('Transcription success (OpenRouter):', text.substring(0, 50) + '...');
            return text;

        } else {
            // OpenAI Whisper Logic (Legacy/Direct)
            const formData = new FormData();
            const filename = audioUrl.split('/').pop()?.split('?')[0] || 'audio.webm';
            formData.append('file', blob, filename);
            formData.append('model', 'whisper-1');

            const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey} `
                },
                body: formData
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Whisper API Error: ${res.status} ${err} `);
            }

            const data = await res.json();
            console.log('Transcription success (OpenAI):', data.text?.substring(0, 50) + '...');
            return data.text || "[Audio: Blank]";
        }

    } catch (error) {
        console.error('Transcription failed:', error);
        return `[Audio: Transcription failed - ${(error as any).message}]`;
    }
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
            'Authorization': `Bearer ${apiKey} `,
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
        throw new Error(`API Error(${config.provider}): ${res.status} ${err} `);
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
