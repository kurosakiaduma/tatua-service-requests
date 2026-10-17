create table if not exists public.healthcheck (
  id integer primary key default 1,
  constraint healthcheck_single_row check (id = 1)
);

insert into public.healthcheck (id)
values (1)
on conflict (id) do nothing;

alter table public.healthcheck enable row level security;

revoke all on table public.healthcheck from anon, authenticated;
grant select on table public.healthcheck to service_role;
