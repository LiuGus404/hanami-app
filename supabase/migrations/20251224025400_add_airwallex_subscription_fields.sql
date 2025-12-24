-- ============================================
-- DATABASE: hanami-saas-system (SaaS DB)
-- NOT for hanami-ai-student-system
--
-- 此 migration 在 SaaS DB 執行，因為：
-- 1. org_subscriptions 表在 SaaS DB
-- 2. 訂閱相關資料屬於 SaaS 系統
-- 3. 支付處理在 SaaS 層
-- ============================================

-- Migration: Add Airwallex subscription fields to org_subscriptions
-- Created: 2025-12-24

-- Add new columns for Airwallex subscription tracking
ALTER TABLE org_subscriptions 
ADD COLUMN IF NOT EXISTS airwallex_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS airwallex_customer_id TEXT,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_airwallex_subscription_id 
ON org_subscriptions(airwallex_subscription_id) WHERE airwallex_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_subscriptions_airwallex_customer_id 
ON org_subscriptions(airwallex_customer_id) WHERE airwallex_customer_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN org_subscriptions.airwallex_subscription_id IS 'Airwallex Subscription ID for recurring payments';
COMMENT ON COLUMN org_subscriptions.airwallex_customer_id IS 'Airwallex Customer ID for tracking';
COMMENT ON COLUMN org_subscriptions.auto_renew IS 'Whether subscription auto-renews';
COMMENT ON COLUMN org_subscriptions.next_billing_date IS 'Next scheduled billing date';
COMMENT ON COLUMN org_subscriptions.last_payment_date IS 'Date of last successful payment';
COMMENT ON COLUMN org_subscriptions.payment_method_type IS 'Type of payment method (card, fps, alipay, etc)';
COMMENT ON COLUMN org_subscriptions.billing_cycle IS 'Billing cycle: monthly or yearly';

-- Add service_role policy for API and webhook access
-- This allows the backend (using service_role key) to manage subscriptions
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON org_subscriptions;
CREATE POLICY "Service role can manage all subscriptions"
  ON org_subscriptions FOR ALL
  USING (current_setting('role', true) = 'service_role')
  WITH CHECK (current_setting('role', true) = 'service_role');
