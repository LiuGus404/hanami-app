-- Drop restrictive constraints if they exist to allow new providers/types
ALTER TABLE model_configs DROP CONSTRAINT IF EXISTS model_configs_provider_check;
ALTER TABLE model_configs DROP CONSTRAINT IF EXISTS model_configs_model_type_check;

-- Remove all existing models
DELETE FROM model_configs;

-- Insert new models
-- Prices converted to HKD (USD * 7.85)
-- REMOVED "is_family_default" from metadata as requested.

INSERT INTO model_configs (id, model_id, display_name, model_name, provider, description, model_type, input_cost_hkd, output_cost_hkd, supported_modalities, capabilities, pricing_details, metadata, is_active, is_available)
VALUES
-- 1. ChatGPT Family
('b1000000-0000-0000-0000-000000000001', 'openai/gpt-5-mini', 'GPT-5 Mini', 'GPT-5 Mini', 'OpenAI', 'L1 主要模型（≤ 400K tokens 優先）', 'llm', 15.4056, 123.2450, '{text_input,text_output}', '["chat", "reasoning"]', '{"context_window": 400000}', '{"family": "chatgpt", "level": "L1"}', true, true),
('b1000000-0000-0000-0000-000000000002', 'openai/gpt-4.1-mini', 'GPT-4.1 Mini', 'GPT-4.1 Mini', 'OpenAI', 'L1 備用：當上下文長度 > 400K 時使用', 'llm', 24.6490, 98.5960, '{text_input,text_output}', '["chat"]', '{"context_window": 1047576}', '{"family": "chatgpt", "level": "L1", "is_backup": true, "backup_condition": "Context > 400K"}', true, true),
('b1000000-0000-0000-0000-000000000003', 'openai/gpt-5.1', 'GPT-5.1', 'GPT-5.1', 'OpenAI', '高階推理 + 一般工作', 'llm', 9.8125, 78.5000, '{text_input,text_output,image_input}', '["chat", "reasoning", "vision"]', '{"context_window": 400000}', '{"family": "chatgpt", "level": "L2", "image_input_level": "L3"}', true, true),
('b1000000-0000-0000-0000-000000000004', 'openai/gpt-4.1', 'GPT-4.1', 'GPT-4.1', 'OpenAI', '大 context 任務（長文、長對話）', 'llm', 15.7000, 62.8000, '{text_input,text_output}', '["chat"]', '{"context_window": 1047576}', '{"family": "chatgpt", "level": "L2", "is_backup": true, "backup_condition": "Context > 400K"}', true, true),
('b1000000-0000-0000-0000-000000000005', 'openai/o4-mini', 'o4 Mini', 'o4 Mini', 'OpenAI', '高質量深度推理', 'llm', 67.7848, 271.1390, '{text_input,text_output}', '["chat", "reasoning"]', '{"context_window": 200000}', '{"family": "chatgpt", "level": "L3"}', true, true),

-- 2. Gemini Family
-- Renamed "Preview" models to avoid collision with standard names used below
('b2000000-0000-0000-0000-000000000001', 'google/gemini-2.5-flash-lite-preview-09-2025', 'Gemini 2.5 Flash Lite (Preview)', 'Gemini 2.5 Flash Lite (Preview)', 'Google', '超便宜、長 context、適合大量日常任務', 'llm', 6.1623, 24.6490, '{text_input,text_output,audio_input}', '["chat", "audio"]', '{"context_window": 1048576}', '{"family": "gemini", "level": "L1", "audio_input_level": "L2"}', true, true),
('b2000000-0000-0000-0000-000000000002', 'google/gemini-2.5-flash-preview-09-2025', 'Gemini 2.5 Flash (Preview)', 'Gemini 2.5 Flash (Preview)', 'Google', '速度快、性價比高，適合主力使用', 'llm', 18.4868, 154.0563, '{text_input,text_output,image_input,video_input}', '["chat", "vision", "video"]', '{"context_window": 1048576}', '{"family": "gemini", "level": "L2", "image_input_level": "L2", "video_input_level": "L2", "is_system_default_video_input": true}', true, true),
('b2000000-0000-0000-0000-000000000003', 'google/gemini-3-pro-preview', 'Gemini 3 Pro', 'Gemini 3 Pro', 'Google', '高階推理與多模態', 'llm', 123.2450, 739.4700, '{text_input,text_output,image_input,audio_input,video_input}', '["chat", "vision", "audio", "video"]', '{"context_window": 1048576}', '{"family": "gemini", "level": "L3", "image_input_level": "L3", "audio_input_level": "L3", "video_input_level": "L3"}', true, true),

-- 3. Claude Family
('b3000000-0000-0000-0000-000000000001', 'anthropic/claude-3-haiku', 'Claude 3 Haiku', 'Claude 3 Haiku', 'Anthropic', '便宜版 Claude，適合日常問答與摘要', 'llm', 15.4056, 77.0281, '{text_input,text_output}', '["chat"]', '{"context_window": 200000}', '{"family": "claude", "level": "L1"}', true, true),
('b3000000-0000-0000-0000-000000000002', 'anthropic/claude-sonnet-4.5', 'Claude Sonnet 4.5', 'Claude Sonnet 4.5', 'Anthropic', '主力工作模型，大 context', 'llm', 184.8675, 924.3375, '{text_input,text_output,image_input}', '["chat", "vision"]', '{"context_window": 1000000}', '{"family": "claude", "level": "L2", "image_input_level": "L3"}', true, true),
('b3000000-0000-0000-0000-000000000003', 'anthropic/claude-3.7-sonnet:thinking', 'Claude 3.7 Sonnet (Thinking)', 'Claude 3.7 Sonnet (Thinking)', 'Anthropic', '思考模式，深度推理', 'llm', 184.8675, 924.3375, '{text_input,text_output}', '["chat", "reasoning"]', '{"context_window": 200000}', '{"family": "claude", "level": "L3"}', true, true),

-- 4. Grok Family
('b4000000-0000-0000-0000-000000000001', 'x-ai/grok-4-fast', 'Grok 4 Fast', 'Grok 4 Fast', 'xAI', '便宜 + 超長 context', 'llm', 12.3245, 30.8113, '{text_input,text_output}', '["chat"]', '{"context_window": 2000000}', '{"family": "grok", "level": "L1"}', true, true),
('b4000000-0000-0000-0000-000000000002', 'x-ai/grok-4.1-fast', 'Grok 4.1 Fast', 'Grok 4.1 Fast', 'xAI', '改良版 fast', 'llm', 12.3245, 30.8113, '{text_input,text_output}', '["chat"]', '{"context_window": 2000000}', '{"family": "grok", "level": "L2"}', true, true),
('b4000000-0000-0000-0000-000000000003', 'x-ai/grok-4', 'Grok 4', 'Grok 4', 'xAI', '完整版 Grok', 'llm', 184.8675, 924.3375, '{text_input,text_output}', '["chat"]', '{"context_window": 256000}', '{"family": "grok", "level": "L3"}', true, true),

-- 5. DeepSeek Family
('b5000000-0000-0000-0000-000000000001', 'deepseek/deepseek-v3.2-exp', 'DeepSeek v3.2 Exp', 'DeepSeek v3.2 Exp', 'DeepSeek', '實驗版，適合低成本測試與開發', 'llm', 12.9407, 19.7192, '{text_input,text_output}', '["chat"]', '{"context_window": 163840}', '{"family": "deepseek", "level": "L1"}', true, true),
('b5000000-0000-0000-0000-000000000002', 'deepseek/deepseek-v3.2', 'DeepSeek v3.2', 'DeepSeek v3.2', 'DeepSeek', '穩定版主力', 'llm', 15.4056, 23.4166, '{text_input,text_output}', '["chat"]', '{"context_window": 163840}', '{"family": "deepseek", "level": "L2"}', true, true),
('b5000000-0000-0000-0000-000000000003', 'deepseek/deepseek-r1-0528', 'DeepSeek R1', 'DeepSeek R1', 'DeepSeek', '深度推理 R1', 'llm', 24.6490, 107.8394, '{text_input,text_output}', '["chat", "reasoning"]', '{"context_window": 163840}', '{"family": "deepseek", "level": "L3"}', true, true),

-- 6. Qwen Family
('b6000000-0000-0000-0000-000000000001', 'qwen/qwen-turbo', 'Qwen Turbo', 'Qwen Turbo', 'Alibaba', '高 CP 值、支援中英混合', 'llm', 3.0811, 12.3245, '{text_input,text_output}', '["chat"]', '{"context_window": 1000000}', '{"family": "qwen", "level": "L1"}', true, true),
('b6000000-0000-0000-0000-000000000002', 'qwen/qwen3-235b-a22b-instruct', 'Qwen3 Instruct', 'Qwen3 Instruct', 'Alibaba', '指令版，大模型', 'llm', 4.3756, 28.5316, '{text_input,text_output}', '["chat"]', '{"context_window": 262144}', '{"family": "qwen", "level": "L2"}', true, true),
('b6000000-0000-0000-0000-000000000003', 'qwen/qwen3-235b-a22b-thinking-2507', 'Qwen3 Thinking', 'Qwen3 Thinking', 'Alibaba', 'Thinking 模式', 'llm', 6.7785, 36.9735, '{text_input,text_output}', '["chat", "reasoning"]', '{"context_window": 262144}', '{"family": "qwen", "level": "L3"}', true, true),

-- Image Gen (L2, L3)
('c1000000-0000-0000-0000-000000000001', 'openai/gpt-5-image-mini', 'GPT-5 Image Mini', 'GPT-5 Image Mini', 'OpenAI', '通用型生成圖像', 'image_generation', 154.0563, 123.2450, '{text_input,image_output}', '["image_generation"]', '{"context_window": 400000}', '{"image_output_level": "L2", "is_system_default_image_output": true}', true, true),
('c1000000-0000-0000-0000-000000000002', 'google/gemini-2.5-flash-image', 'Gemini 2.5 Flash Image', 'Gemini 2.5 Flash Image', 'Google', '成本較低，適合一般插圖', 'image_generation', 18.4868, 154.0563, '{text_input,image_output}', '["image_generation"]', '{"context_window": 32768}', '{"image_output_level": "L2"}', true, true),
('c1000000-0000-0000-0000-000000000003', 'black-forest-labs/flux.2-pro', 'Flux.2 Pro', 'Flux.2 Pro', 'Black Forest Labs', '高質感藝術風格', 'image_generation', 225.5384, 225.5384, '{text_input,image_output}', '["image_generation"]', '{"context_window": 46864}', '{"image_output_level": "L2_L3"}', true, true),
('c1000000-0000-0000-0000-000000000004', 'google/gemini-3-pro-image-preview', 'Gemini 3 Pro Image', 'Gemini 3 Pro Image', 'Google', '與 Gemini 3 Pro 一體的高階圖像輸出', 'image_generation', 123.2450, 739.4700, '{text_input,image_output}', '["image_generation"]', '{"context_window": 65536}', '{"image_output_level": "L3"}', true, true),
('c1000000-0000-0000-0000-000000000005', 'openai/gpt-5-image', 'GPT-5 Image', 'GPT-5 Image', 'OpenAI', '最高階影像質素', 'image_generation', 616.2250, 616.2250, '{text_input,image_output}', '["image_generation"]', '{"context_window": 400000}', '{"image_output_level": "L3"}', true, true),

-- Image Input (Only ones not already added above)
-- Standard Flash & Flash Lite with no preview suffix in prompt
('d1000000-0000-0000-0000-000000000001', 'google/gemini-2.0-flash-lite-001', 'Gemini 2.0 Flash Lite', 'Gemini 2.0 Flash Lite', 'Google', '多模態入門', 'llm', 0.5900, 2.3600, '{text_input,text_output,image_input,audio_input}', '["vision", "audio"]', '{"context_window": 1048576}', '{"image_input_level": "L1", "audio_input_level": "L1", "doc_input_level": "L1", "is_system_default_doc_input": true, "system_condition": "≤ 1 MB", "is_system_default_audio_input": true}', true, true),
('d1000000-0000-0000-0000-000000000002', 'qwen/qwen3-vl-8b-instruct', 'Qwen3 VL', 'Qwen3 VL', 'Alibaba', '適合中文場景的圖像理解', 'llm', 3.9438, 24.6490, '{text_input,text_output,image_input}', '["vision"]', '{"context_window": 131072}', '{"image_input_level": "L1"}', true, true),
('d1000000-0000-0000-0000-000000000003', 'openai/gpt-4o-mini', 'GPT-4o Mini', 'GPT-4o Mini', 'OpenAI', '快速圖像理解', 'llm', 9.2434, 36.9735, '{text_input,text_output,image_input}', '["vision"]', '{"context_window": 128000}', '{"image_input_level": "L2"}', true, true),
('d1000000-0000-0000-0000-000000000004', 'google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Gemini 2.5 Flash', 'Google', '圖＋文字混合任務', 'llm', 18.4868, 154.0563, '{text_input,text_output,image_input}', '["vision"]', '{"context_window": 1048576}', '{"image_input_level": "L2", "is_system_default_image_input": true}', true, true),

-- Audio Input (Extras)
('e1000000-0000-0000-0000-000000000001', 'openai/gpt-4o-audio-preview', 'GPT-4o Audio', 'GPT-4o Audio', 'OpenAI', '高質語音對話', 'llm', 154.0563, 616.2250, '{text_input,text_output,audio_input,audio_output}', '["audio"]', '{"context_window": 128000}', '{"audio_input_level": "L3"}', true, true),

-- Doc Input (Extras)
('f1000000-0000-0000-0000-000000000001', 'openai/gpt-4.1-nano', 'GPT-4.1 Nano', 'GPT-4.1 Nano', 'OpenAI', '文件摘要', 'llm', 0.7900, 3.1400, '{text_input,text_output}', '["chat"]', '{"context_window": 1047576}', '{"doc_input_level": "L1", "system_condition": "≤ 1 MB"}', true, true),
('f1000000-0000-0000-0000-000000000002', 'google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite (Doc)', 'Gemini 2.5 Flash Lite (Doc)', 'Google', '大檔案主力模型', 'llm', 0.7900, 3.1400, '{text_input,text_output}', '["chat"]', '{"context_window": 1048576}', '{"doc_input_level": "L2", "is_system_default_doc_input": true, "system_condition": ">1–3 MB"}', true, true);
