// Format_Input (n8n Code Node) — 修復：優先使用 extra.client_msg_id
const body  = $json.body ?? {};
const extra = body?.payload?.extra ?? {};

return [{
  json: {
    // Thread 基本
    thread_id: body.thread_id ?? extra.room_id ?? null,
    room_id:   extra.room_id  ?? body.thread_id ?? null,
    user_id:   extra.user_id  ?? null,

    // —— 之後流程一定會用到的關鍵欄位 ——
    // ⭐ 修復：優先使用 extra.client_msg_id（前端生成的），fallback 才用 body.client_msg_id
    client_msg_id: extra.client_msg_id ?? body.client_msg_id ?? null, // 去重鍵
    role_hint:     body.role_hint     ?? 'auto',
    message_type:  body.message_type  ?? 'user_request',
    text:          body?.payload?.text ?? '',

    // 其餘輔助欄位
    companions:    extra.companions    ?? [],
    group_roles:   extra.group_roles   ?? [],
    selected_role: extra.selected_role ?? {},
    project_info:  extra.project_info  ?? {},
    source:        extra.source        ?? null,
    session_id:    extra.session_id    ?? null
  }
}];

