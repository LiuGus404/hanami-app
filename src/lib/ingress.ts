import crypto from 'crypto';

// 統一接收器請求介面
export interface IngressRequest {
  spec_version: string;
  event_type: string;
  thread_id: string;
  client_msg_id: string;
  role_hint: string;
  message_type: string;
  payload: {
    text?: string;
    extra?: Record<string, any>;
  };
  priority: string;
  timestamp: number;
}

// 統一接收器響應介面
export interface IngressResponse {
  success: boolean;
  received: string;
  thread_id: string;
  message_id: string;
  estimated_processing_time?: number;
  error?: string;
}

// 生成 ULID 的簡單實現
function generateULID(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 10);
  return `${timestamp}${random}`.toUpperCase();
}

// 生成簽名
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Ingress 客戶端類
export class IngressClient {
  private secret: string;
  private baseUrl: string;
  private jwtToken: string;

  constructor(secret: string, baseUrl: string, jwtToken?: string) {
    this.secret = secret;
    this.baseUrl = baseUrl;
    this.jwtToken = jwtToken || '';
  }

  // 發送訊息到統一接收器
  async sendMessage(
    threadId: string,
    text: string,
    options: {
      roleHint?: string;
      messageType?: string;
      priority?: string;
      extra?: Record<string, any>;
      groupRoles?: Array<{ id: string; name?: string; model?: string; capabilities?: any }>;
      selectedRole?: { id: string; model?: string; tone?: string; guidance?: string };
      project?: { title?: string; guidance?: string };
    } = {}
  ): Promise<IngressResponse> {
    try {
      const clientMsgId = generateULID();
      const timestamp = Date.now();

      const request: IngressRequest = {
        spec_version: '1.0',
        event_type: 'message.created',
        thread_id: threadId,
        client_msg_id: clientMsgId,
        role_hint: options.roleHint || 'auto',
        message_type: options.messageType || 'user_request',
        payload: {
          text: text,
          extra: {
            ...(options.extra || {}),
            group_roles: options.groupRoles || [],
            selected_role: options.selectedRole || {},
            project_info: options.project || {}
          }
        },
        priority: options.priority || 'normal',
        timestamp: timestamp
      };

      const payload = JSON.stringify(request);
      const signature = generateSignature(payload, this.secret);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Signature': signature
      };

      // 如果有 JWT Token，添加到 Authorization header
      if (this.jwtToken) {
        headers['Authorization'] = `Bearer ${this.jwtToken}`;
      }

      const response = await fetch(`${this.baseUrl}/api/webhook/ingress`, {
        method: 'POST',
        headers,
        body: payload
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: IngressResponse = await response.json();
      return result;

    } catch (error) {
      console.error('發送訊息錯誤:', error);
      throw error;
    }
  }

  // 發送通用事件（如 blackboard_update / task_update）到統一接收器
  async sendEvent(
    threadId: string,
    eventType: 'blackboard_update' | 'task_update' | string,
    data: Record<string, any>,
    options: {
      roleHint?: string;
      messageType?: string;
      priority?: string;
      text?: string;
    } = {}
  ): Promise<IngressResponse> {
    const clientMsgId = generateULID();
    const timestamp = Date.now();

    const request: IngressRequest = {
      spec_version: '1.0',
      event_type: eventType,
      thread_id: threadId,
      client_msg_id: clientMsgId,
      role_hint: options.roleHint || 'auto',
      message_type: options.messageType || 'event',
      payload: {
        text: options.text,
        extra: data
      },
      priority: options.priority || 'normal',
      timestamp
    };

    const payload = JSON.stringify(request);
    const signature = generateSignature(payload, this.secret);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Signature': signature
    };

    // 如果有 JWT Token，添加到 Authorization header
    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }

    const response = await fetch(`${this.baseUrl}/api/webhook/ingress`, {
      method: 'POST',
      headers,
      body: payload
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: IngressResponse = await response.json();
    return result;
  }

  // 健康檢查
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/webhook/ingress`, {
        method: 'GET'
      });

      return response.ok;
    } catch (error) {
      console.error('健康檢查錯誤:', error);
      return false;
    }
  }
}

// 創建默認 Ingress 客戶端實例
export function createIngressClient(): IngressClient {
  const secret = process.env.NEXT_PUBLIC_INGRESS_SECRET || 'your-secret-key';
  // 預設使用相對路徑，避免在非本機/不同域名時出現 404
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  // JWT Token for n8n webhook authentication
  const jwtToken = process.env.NEXT_PUBLIC_N8N_JWT_TOKEN || '';
  
  return new IngressClient(secret, baseUrl, jwtToken);
}

// 導出默認實例
export const ingressClient = createIngressClient();
