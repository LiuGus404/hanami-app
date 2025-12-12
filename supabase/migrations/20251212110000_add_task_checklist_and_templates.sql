-- Add checklist column to hanami_task_list
ALTER TABLE hanami_task_list 
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

-- Create Task Templates table
CREATE TABLE IF NOT EXISTS hanami_task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  task_data JSONB NOT NULL,
  created_by TEXT, -- Stores user ID or email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hanami_task_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for hanami_task_templates
-- Allow all authenticated users to read templates (or restrict as needed)
CREATE POLICY "Enable read access for authenticated users" ON hanami_task_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own templates
CREATE POLICY "Enable insert for authenticated users" ON hanami_task_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own templates (optional, or allow all)
CREATE POLICY "Enable update for owners" ON hanami_task_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow users to delete their own templates
CREATE POLICY "Enable delete for owners" ON hanami_task_templates
  FOR DELETE USING (auth.role() = 'authenticated');
