-- Update Mori's default model to the new L1 set in database
UPDATE ai_roles
SET default_model = 'openai/gpt-5-mini,google/gemini-2.5-flash-lite-preview-09-2025,x-ai/grok-4-fast,deepseek/deepseek-v3.2-exp'
WHERE slug = 'mori-researcher';
