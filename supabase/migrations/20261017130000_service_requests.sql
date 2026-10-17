create type public.user_role as enum ('citizen', 'admin');
create type public.request_category as enum ('streetlight', 'water', 'garbage', 'roads', 'sewage', 'other');
create type public.request_status as enum ('pending', 'in_progress', 'resolved');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'citizen',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  category public.request_category not null,
  location text not null check (char_length(location) between 3 and 240),
  description text not null check (char_length(description) between 10 and 2000),
  image_path text,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  status public.request_status not null,
  changed_by uuid not null references public.profiles(id),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index requests_citizen_id_idx on public.requests(citizen_id);
create index requests_status_idx on public.requests(status);
create index requests_created_at_idx on public.requests(created_at desc);
create index status_history_request_id_idx on public.status_history(request_id, created_at);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'Tatua citizen'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger requests_updated_at
  before update on public.requests
  for each row execute procedure public.touch_request_updated_at();

create or replace function public.record_initial_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.status_history (request_id, status, changed_by)
  values (new.id, new.status, new.citizen_id);
  return new;
end;
$$;

create trigger requests_initial_status
  after insert on public.requests
  for each row execute procedure public.record_initial_status();

create or replace function public.record_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.status_history (request_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger requests_status_history
  after update of status on public.requests
  for each row execute procedure public.record_status_change();

alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.status_history enable row level security;

create policy "Users can read their profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Citizens read own requests and admins read all"
  on public.requests for select to authenticated
  using (citizen_id = auth.uid() or public.is_admin());

create policy "Citizens create own requests"
  on public.requests for insert to authenticated
  with check (citizen_id = auth.uid() and not public.is_admin());

create policy "Admins update requests"
  on public.requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users read relevant status history"
  on public.status_history for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.requests
      where requests.id = status_history.request_id
        and requests.citizen_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-images', 'request-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Citizens upload request images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'request-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_admin()
  );

create policy "Users read relevant request images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'request-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

create policy "Admins delete request images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'request-images' and public.is_admin());
