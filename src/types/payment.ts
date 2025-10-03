// 支付相關類型定義

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  type: 'screenshot' | 'airwallex' | 'stripe' | 'paypal';
  enabled: boolean;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  return_url?: string;
  cancel_url?: string;
  metadata?: Record<string, any>;
}

export interface AirwallexPaymentResponse {
  success: boolean;
  payment_intent_id?: string;
  checkout_url?: string;
  status?: string;
  amount?: number;
  currency?: string;
  error?: string;
  message?: string;
  is_test_mode?: boolean;
  debug_info?: {
    payment_link_created?: boolean;
    payment_link_id?: string;
    payment_link_url?: string;
    payment_link_status?: string;
    final_checkout_url?: string;
    environment?: string;
    client_secret?: string;
  };
}

export interface ScreenshotUploadData {
  file: File;
  amount: number;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentRecord {
  id: string;
  payment_method: string;
  amount: number;
  currency: string;
  description?: string;
  screenshot_url?: string;
  file_name?: string;
  airwallex_intent_id?: string;
  airwallex_request_id?: string;
  checkout_url?: string;
  return_url?: string;
  cancel_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_id?: string;
  user_email?: string;
  metadata?: Record<string, any>;
}

export interface PaymentStatistics {
  total_payments: number;
  total_amount: number;
  success_rate: number;
  pending_count: number;
  method_breakdown: Record<string, {
    count: number;
    amount: number;
  }>;
  status_breakdown: Record<string, number>;
  recent_transactions: PaymentRecord[];
}
