-- Fix stale model IDs in ai_roles table
-- Replace old 'deepseek-chat-v3.1' with 'deepseek/deepseek-v3.2' or 'deepseek/deepseek-v3.2-exp'
-- Replace old 'gpt-4o-mini' with 'openai/gpt-5-mini' where appropriate for L1 preference

-- Update Mori (Researcher)
UPDATE ai_roles
SET 
  default_model = 'openai/gpt-5-mini,google/gemini-2.5-flash-lite-preview-09-2025,x-ai/grok-4-fast,deepseek/deepseek-v3.2-exp',
  available_models = ARRAY[
    'openai/gpt-5-mini', 
    'google/gemini-2.5-flash-lite-preview-09-2025', 
    'x-ai/grok-4-fast', 
    'deepseek/deepseek-v3.2-exp',
    'deepseek/deepseek-v3.2',
    'deepseek/deepseek-r1-0528',
    'openai/gpt-5.1',
    'google/gemini-2.5-flash-preview-09-2025',
    'anthropic/claude-3-haiku',
    'anthropic/claude-sonnet-4.5',
    'x-ai/grok-4.1-fast'
  ]
WHERE slug = 'mori-researcher';

-- Update Hibi (Manager)
UPDATE ai_roles
SET 
  default_model = 'openai/gpt-5-mini',
  available_models = ARRAY['openai/gpt-5-mini', 'openai/gpt-5.1', 'openai/gpt-4.1-mini', 'google/gemini-2.5-flash-lite-preview-09-2025']
WHERE slug = 'hibi-manager';

-- Update Pico (Artist)
UPDATE ai_roles
SET 
  default_model = 'google/gemini-2.5-flash-image',
  available_models = ARRAY['google/gemini-2.5-flash-image', 'black-forest-labs/flux.2-pro', 'openai/gpt-5-image-mini']
WHERE slug = 'pico-artist';
