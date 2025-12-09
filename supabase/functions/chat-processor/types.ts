export interface ChatRequest {
    message: string;
    roomId: string; // This is actually the room UUID
    companionId?: string; // slug or id
    modelId?: string;
    attachments?: Attachment[];
    userId?: string; // Optional, usually injected by Edge Function middleware or passed explicitly
    messageId?: string; // The ID of the user message being processed
}

export interface Attachment {
    type: 'image' | 'document' | 'audio' | 'video';
    url: string;
    name?: string;
    mimeType?: string;
}

export interface AudioAnalysis {
    transcription: string;
    description: string;
    usage?: any;
    model?: string;
    food_cost_deducted?: number; // Optional tracking
}

export interface ChatResponse {
    success: boolean;
    content?: string;
    messageId?: string;
    error?: string;
    content_json?: any;
    model_used?: string;
    usage?: any;
}

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string | ContentPart[];
}

export interface ContentPart {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
        url: string;
    };
}

export interface RoleConfig {
    id: string;
    name: string;
    slug: string;
    system_prompt: string;
    default_model: string;
}

export interface ModelConfig {
    model_id: string;
    provider: string;
    model_name: string;
    display_name?: string;
    api_key_env?: string; // Env var name for the API key
    base_url?: string;
    input_cost_usd?: number;
    output_cost_usd?: number;
    metadata?: any;
}

export interface MindBlock {
    id: string;
    title: string;
    content_json: any;
    block_type: string;
    compiled_prompt?: string;
}
