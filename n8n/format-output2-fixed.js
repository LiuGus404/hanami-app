// FormatOutput2 節點修復版本
const resp = $json;
const choice = resp?.choices?.[0] || {};
const msg = choice?.message || {};
const content = (msg.content || '').trim();

function countChars(s){ return (s||'').match(/\S/g)?.length ?? 0; }

const input_tokens = Number(resp?.usage?.prompt_tokens || 0);
const output_tokens = Number(resp?.usage?.completion_tokens || 0);
const total_tokens = Number(resp?.usage?.total_tokens || (input_tokens + output_tokens));

const provider = resp?.provider || 'openai';
const model = resp?.model || $('BuildMessages2').first().json?.model || $('Format_Input1').first().json?.selected_role?.model || 'unknown';

const CHARS_PER_FOOD = parseInt($env.CHARS_PER_FOOD || '100', 10);

const input_chars = Number($('Estimate&GateBudget2').first().json?.input_chars || 0);
const input_food_cost = input_chars > 0 ? Math.ceil(input_chars / CHARS_PER_FOOD) : 0;

const output_chars = countChars(content);
const output_food_cost = output_chars > 0 ? Math.ceil(output_chars / CHARS_PER_FOOD) : 0;

const total_food_cost = input_food_cost + output_food_cost;

// ⭐ 修復：使用更可靠的 thread_id 來源
const thread_id = $('Format_Input1').first().json.thread_id || 
                  $('Format_Input1').first().json.room_id;
const user_id = $('Format_Input1').first().json.user_id;
const user_message_id = $('CheckMessage').first().json.id;
const client_msg_id = $('Format_Input1').first().json.client_msg_id;

const openrouter_id = $('OpenRouterAI2').first().json?.id || null;
const client_msg_id_asst = openrouter_id || (client_msg_id ? `${client_msg_id}:assistant` : `asst-${$now}`);

const meta = {
  provider,
  model,
  usage: { input_tokens, output_tokens, total_tokens },
  food: {
    CHARS_PER_FOOD,
    input_chars, output_chars,
    input_food_cost, output_food_cost, total_food_cost,
    remain_before: Number($('Estimate&GateBudget2').first().json?.remain_food || 0)
  },
  openrouter_id,
  parent_id: user_message_id,
  source: 'n8n/openrouter'
};

return [{
  json: {
    assistant_content: content,
    provider, model,
    finish_reason: choice?.finish_reason || 'stop',
    usage: { input_tokens, output_tokens, total_tokens },
    food: meta.food,
    thread_id, user_id, user_message_id, client_msg_id,
    client_msg_id_asst,
    meta
  }
}];
