-- Migrate users from legacy UUID plans to new text-based Plan IDs ('free', 'basic', 'pro')

DO $$
DECLARE
    plan_record RECORD;
BEGIN
    -- Iterate over all plans that are NOT the new standard ones
    FOR plan_record IN SELECT * FROM public.saas_subscription_plans WHERE id NOT IN ('free', 'basic', 'pro') LOOP
        
        -- Logic to identify Free Plan
        IF (plan_record.price = 0) OR (plan_record.name ILIKE '%Free%') OR (plan_record.name ILIKE '%免費%') THEN
            UPDATE public.saas_users 
            SET subscription_plan_id = 'free' 
            WHERE subscription_plan_id = plan_record.id;
            RAISE NOTICE 'Migrated users from old plan % (%) to free', plan_record.id, plan_record.name;
            
        -- Logic to identify Basic Plan (Check price or name)
        ELSIF (plan_record.name ILIKE '%Basic%') OR (plan_record.name ILIKE '%基礎%') OR (plan_record.price BETWEEN 50 AND 150) THEN
            UPDATE public.saas_users 
            SET subscription_plan_id = 'basic' 
            WHERE subscription_plan_id = plan_record.id;
            RAISE NOTICE 'Migrated users from old plan % (%) to basic', plan_record.id, plan_record.name;

        -- Logic to identify Pro Plan
        ELSIF (plan_record.name ILIKE '%Pro%') OR (plan_record.name ILIKE '%專業%') OR (plan_record.price > 150) THEN
            UPDATE public.saas_users 
            SET subscription_plan_id = 'pro' 
            WHERE subscription_plan_id = plan_record.id;
            RAISE NOTICE 'Migrated users from old plan % (%) to pro', plan_record.id, plan_record.name;
        END IF;

    END LOOP;
END $$;
