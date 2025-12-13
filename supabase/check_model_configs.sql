-- Check if table exists and has data
SELECT count(*) as total_rows FROM model_configs;

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'model_configs';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'model_configs';
