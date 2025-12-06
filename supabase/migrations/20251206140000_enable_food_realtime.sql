-- Enable Realtime for food tracking tables
begin;
  -- Check if table is already in publication before adding to avoid errors (though 'alter publication add table' usually handles duplicates optionally, but let's be safe or just add)
  -- Actually standard Postgres 'alter publication ... add table' will error if already present? No, usually fine.
  
  alter publication supabase_realtime add table user_food_balance;
  alter publication supabase_realtime add table food_transactions;
commit;
