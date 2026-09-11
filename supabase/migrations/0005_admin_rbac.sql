-- ============================================================================
-- Owner / admin staff accounts, role-based access, and a generic audit log.
--
-- Ownership is NEVER granted automatically (not by matching an email at
-- signup, not by any client-writable path). It is granted exactly once by
-- running a manual SQL statement after the owner's auth account already
-- exists — see supabase/testing/owner_bootstrap.sql.
-- ============================================================================

create type admin_role as enum ('owner', 'admin', 'support', 'marketing', 'finance');

create table public.admin_users (
  user_id uuid primary key references public.users (id) on delete cascade,
  role admin_role not null,
  is_active boolean not null default true,
  created_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_admin_users_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- Nobody writes this table directly from the client — only through the
-- SECURITY DEFINER RPCs below (owner-only), so there is one audited path
-- for every privilege change.
revoke insert, update, delete on public.admin_users from authenticated;

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users (id),
  action text not null,
  target_type text,
  target_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

revoke insert, update, delete on public.admin_audit_log from authenticated;

create index idx_admin_audit_log_created on public.admin_audit_log (created_at desc);
create index idx_admin_audit_log_target on public.admin_audit_log (target_type, target_id);

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid() and is_active
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid() and is_active and role = 'owner'
  );
$$;

create or replace function public.current_admin_role()
returns admin_role
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select role from public.admin_users where user_id = auth.uid() and is_active;
$$;

create or replace function public.log_admin_action(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_old_value jsonb default null,
  p_new_value jsonb default null
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, old_value, new_value)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_old_value, p_new_value);
$$;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;

-- Everyone can see their own admin row (usually none); admins can see all staff.
create policy "admin_users_select" on public.admin_users
  for select using (user_id = auth.uid() or public.is_admin());

create policy "admin_audit_log_select" on public.admin_audit_log
  for select using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Staff management (owner only)
-- ----------------------------------------------------------------------------
create or replace function public.add_admin_by_email(p_email text, p_role admin_role)
returns public.admin_users
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_row public.admin_users;
begin
  if not public.is_owner() then
    raise exception 'only the owner can manage staff accounts';
  end if;
  if p_role = 'owner' then
    raise exception 'ownership cannot be granted this way';
  end if;

  select id into v_user_id from public.users where lower(email) = lower(p_email);
  if v_user_id is null then
    raise exception 'no account found for that email — the person must sign up first';
  end if;

  insert into public.admin_users (user_id, role, created_by)
  values (v_user_id, p_role, auth.uid())
  on conflict (user_id) do update set role = excluded.role, is_active = true, updated_at = now()
  returning * into v_row;

  perform public.log_admin_action('admin_user.upsert', 'admin_users', v_user_id::text, null, to_jsonb(v_row));
  return v_row;
end;
$$;

create or replace function public.set_admin_active(p_user_id uuid, p_is_active boolean)
returns public.admin_users
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old public.admin_users;
  v_row public.admin_users;
begin
  if not public.is_owner() then
    raise exception 'only the owner can manage staff accounts';
  end if;

  select * into v_old from public.admin_users where user_id = p_user_id;
  if v_old is null then
    raise exception 'staff account not found';
  end if;
  if v_old.role = 'owner' then
    raise exception 'the owner account cannot be deactivated';
  end if;

  update public.admin_users set is_active = p_is_active, updated_at = now()
  where user_id = p_user_id
  returning * into v_row;

  perform public.log_admin_action('admin_user.set_active', 'admin_users', p_user_id::text, to_jsonb(v_old), to_jsonb(v_row));
  return v_row;
end;
$$;

-- ----------------------------------------------------------------------------
-- Generic audit trigger, attached to specific tables in later migrations.
-- ----------------------------------------------------------------------------
create or replace function public.audit_table_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_admin_action(tg_table_name || '.create', tg_table_name, new.id::text, null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.log_admin_action(tg_table_name || '.update', tg_table_name, new.id::text, to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    perform public.log_admin_action(tg_table_name || '.delete', tg_table_name, old.id::text, to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;
