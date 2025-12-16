-- Create Rewards Table
CREATE TABLE IF NOT EXISTS hanami_task_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  points_cost INTEGER NOT NULL DEFAULT 0,
  icon TEXT, -- Emoji or URL
  org_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Redemptions Table (Ledger)
CREATE TABLE IF NOT EXISTS hanami_task_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Who redeemed it (student)
  reward_id UUID REFERENCES hanami_task_rewards(id),
  points_spent INTEGER NOT NULL,
  redeemed_by TEXT, -- Who processed it (admin)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_rewards_org_id ON hanami_task_rewards(org_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON hanami_task_redemptions(user_id);
