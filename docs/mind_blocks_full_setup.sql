-- Comprehensive Setup for Mind Blocks Feature
-- Run this in your Supabase SQL Editor

-- 1. Create mind_blocks table
CREATE TABLE IF NOT EXISTS public.mind_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  icon text DEFAULT '🧩',
  color text DEFAULT '#FFD59A', -- Stores the custom color (e.g., 'Purple', '#AABBCC')
  
  -- The logic definition
  -- For a single block template, this stores the MindBlockNode structure
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Compiled prompt for quick execution
  compiled_prompt text,
  
  -- Categorization
  category text, -- e.g., 'Role', 'Style'
  tags text[],
  block_type text, -- e.g., 'role', 'style', 'task', 'custom'
  
  -- Flags
  is_template boolean DEFAULT false, -- If true, it appears in the Library
  is_public boolean DEFAULT false,   -- If true, visible to everyone
  is_official boolean DEFAULT false, -- System templates
  
  -- Social & Metrics
  forked_from_id uuid REFERENCES public.mind_blocks(id),
  usage_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT mind_blocks_pkey PRIMARY KEY (id)
);

-- 2. Create role_mind_blocks table (Association table for equipping blocks to roles)
CREATE TABLE IF NOT EXISTS public.role_mind_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.ai_roles(id),
  mind_block_id uuid NOT NULL REFERENCES public.mind_blocks(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_mind_blocks_pkey PRIMARY KEY (id)
);

-- 3. Enable RLS
ALTER TABLE public.mind_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_mind_blocks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for mind_blocks

-- Allow viewing public blocks or own blocks
DROP POLICY IF EXISTS "Public blocks are viewable by everyone" ON public.mind_blocks;
CREATE POLICY "Public blocks are viewable by everyone" ON public.mind_blocks
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Allow users to insert their own blocks
DROP POLICY IF EXISTS "Users can insert their own blocks" ON public.mind_blocks;
CREATE POLICY "Users can insert their own blocks" ON public.mind_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own blocks
DROP POLICY IF EXISTS "Users can update their own blocks" ON public.mind_blocks;
CREATE POLICY "Users can update their own blocks" ON public.mind_blocks
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own blocks
DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.mind_blocks;
CREATE POLICY "Users can delete their own blocks" ON public.mind_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- 5. RLS Policies for role_mind_blocks

-- Users can view their own role assignments
DROP POLICY IF EXISTS "Users can view their own role assignments" ON public.role_mind_blocks;
CREATE POLICY "Users can view their own role assignments" ON public.role_mind_blocks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own role assignments
DROP POLICY IF EXISTS "Users can insert their own role assignments" ON public.role_mind_blocks;
CREATE POLICY "Users can insert their own role assignments" ON public.role_mind_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own role assignments
DROP POLICY IF EXISTS "Users can update their own role assignments" ON public.role_mind_blocks;
CREATE POLICY "Users can update their own role assignments" ON public.role_mind_blocks
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own role assignments
DROP POLICY IF EXISTS "Users can delete their own role assignments" ON public.role_mind_blocks;
CREATE POLICY "Users can delete their own role assignments" ON public.role_mind_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Create Updated_At Trigger (Optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_mind_blocks_updated ON public.mind_blocks;
CREATE TRIGGER on_mind_blocks_updated
  BEFORE UPDATE ON public.mind_blocks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
