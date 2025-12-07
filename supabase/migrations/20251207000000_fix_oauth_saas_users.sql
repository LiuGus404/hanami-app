-- Trigger function to handle new user creation from Auth
-- This ensures that users created via OAuth (Google/Apple) also get a saas_users record

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.saas_users (
    id,
    email,
    full_name,
    avatar_url,
    subscription_status,
    usage_count,
    usage_limit,
    is_verified,
    verification_method,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'free', -- Default subscription status
    0,      -- Initial usage count
    1000,   -- Default usage limit
    new.email_confirmed_at is not null, -- Verified if email is confirmed (OAuth usually creates confirmed users)
    'email', -- Verification method
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Ensure the trigger exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill existing users (Sync old accounts)
-- This ensures that any existing users who don't have a saas_users record get one created
insert into public.saas_users (
  id,
  email,
  full_name,
  avatar_url,
  subscription_status,
  usage_count,
  usage_limit,
  is_verified,
  verification_method,
  created_at,
  updated_at
)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  raw_user_meta_data->>'avatar_url',
  'free',
  0,
  1000,
  email_confirmed_at is not null,
  'email',
  now(),
  now()
from auth.users
on conflict (id) do nothing;
