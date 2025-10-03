// PAYME FPS 支付相關類型定義

export interface PaymeFpsAccount {
  id: string;
  institution_name: string;
  institution_code?: string;
  payme_phone: string;
  payme_name: string;
  payme_link?: string;
  fps_phone?: string;
  fps_name?: string;
  fps_link?: string;
  is_active: boolean;
  is_primary: boolean;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymeFpsAccountRequest {
  institution_name: string;
  institution_code?: string;
  payme_phone: string;
  payme_name: string;
  payme_link?: string;
  fps_phone?: string;
  fps_name?: string;
  fps_link?: string;
  is_primary?: boolean;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymeFpsAccountRequest extends Partial<CreatePaymeFpsAccountRequest> {
  id: string;
  is_active?: boolean;
}

export interface PaymeFpsAccountResponse {
  success: boolean;
  data?: PaymeFpsAccount;
  error?: string;
}

export interface PaymeFpsAccountsListResponse {
  success: boolean;
  data?: PaymeFpsAccount[];
  error?: string;
}

// 支付資訊顯示類型
export interface PaymentInfo {
  payme_phone: string;
  payme_name: string;
  payme_link?: string;
  fps_phone?: string;
  fps_name?: string;
  fps_link?: string;
  notes?: string;
}
