create sequence if not exists public.request_reference_seq;

-- A linked report keeps its own row and points at one primary report.
alter table public.requests
  add column if not exists reference text,
  add column if not exists duplicate_of uuid references public.requests(id) on delete set null;

with numbered as (
  select id, 'TAT-' || lpad(row_number() over (order by created_at, id)::text, 6, '0') as reference
  from public.requests
  where reference is null
)
update public.requests
set reference = numbered.reference
from numbered
where public.requests.id = numbered.id;

select setval(
  'public.request_reference_seq',
  greatest(coalesce((select max(substring(reference from 5)::bigint) from public.requests where reference ~ '^TAT-[0-9]+$'), 1), 1),
  coalesce((select max(substring(reference from 5)::bigint) from public.requests where reference ~ '^TAT-[0-9]+$'), 0) > 0
);

alter table public.requests
  alter column reference set default ('TAT-' || lpad(nextval('public.request_reference_seq')::text, 6, '0')),
  alter column reference set not null;

create unique index if not exists requests_reference_idx on public.requests(reference);
create index if not exists requests_duplicate_of_idx on public.requests(duplicate_of);
create unique index if not exists requests_one_link_per_report_idx
  on public.requests(id) where duplicate_of is not null;

alter table public.requests
  add constraint requests_not_self_linked check (duplicate_of is null or duplicate_of <> id);

with possible_duplicates as (
  select duplicate.id,
    (
      select original.id
      from public.requests original
      where original.id <> duplicate.id
        and original.duplicate_of is null
        and original.category = duplicate.category
        and original.location = duplicate.location
        and original.created_at < duplicate.created_at
      order by original.created_at
      limit 1
    ) as original_id
  from public.requests duplicate
  where duplicate.status = 'rejected'
    and duplicate.description ilike '%duplicat%'
)
update public.requests
set duplicate_of = possible_duplicates.original_id,
    status = coalesce((select status from public.requests where id = possible_duplicates.original_id), 'pending')
from possible_duplicates
where public.requests.id = possible_duplicates.id
  and possible_duplicates.original_id is not null;

create or replace function public.validate_request_link()
returns trigger
language plpgsql
as $$
begin
  if new.duplicate_of is not null then
    if new.duplicate_of = new.id then
      raise exception 'A request cannot be linked to itself';
    end if;
    if exists (select 1 from public.requests where id = new.duplicate_of and duplicate_of is not null) then
      raise exception 'A linked report cannot be the target of another link';
    end if;
    if tg_op = 'UPDATE' and old.duplicate_of is not null and old.duplicate_of is distinct from new.duplicate_of then
      raise exception 'A report can only be linked once';
    end if;
  end if;
  return new;
end;
$$;

-- Prevent chains, self-links, and relinking after a report has been linked.
drop trigger if exists requests_validate_link on public.requests;
create trigger requests_validate_link
  before insert or update of duplicate_of on public.requests
  for each row execute procedure public.validate_request_link();

create or replace function public.post_request_update(
  p_request_id uuid,
  p_status public.request_status default null,
  p_note text default null
)
returns public.status_history
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.requests;
  result public.status_history;
  next_status public.request_status;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can post updates';
  end if;
  select * into current_request from public.requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  if current_request.duplicate_of is not null then
    raise exception 'Linked reports follow the original request';
  end if;
  if p_note is not null and char_length(trim(p_note)) > 2000 then
    raise exception 'Update message is too long';
  end if;
  next_status := coalesce(p_status, current_request.status);
  if current_request.status in ('resolved', 'rejected') and next_status <> 'in_progress' then
    raise exception 'Final requests may only be reopened to in progress';
  end if;
  if next_status = current_request.status and nullif(trim(coalesce(p_note, '')), '') is null then
    raise exception 'An update must change the status or include a message';
  end if;

  update public.requests set status = next_status where id = p_request_id;
  insert into public.status_history (request_id, status, changed_by, note)
    values (p_request_id, next_status, auth.uid(), nullif(trim(p_note), ''))
    returning * into result;

  update public.requests set status = next_status
    where duplicate_of = p_request_id;
  insert into public.status_history (request_id, status, changed_by, note)
    select id, next_status, auth.uid(),
      'Status update on ' || current_request.reference ||
      coalesce(': ' || nullif(trim(p_note), ''), '')
    from public.requests
    where duplicate_of = p_request_id;
  return result;
end;
$$;

create or replace function public.link_request(
  p_report_id uuid,
  p_original_id uuid,
  p_note text default null
)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  report public.requests;
  original public.requests;
begin
  if not public.is_admin() then raise exception 'Only administrators can link reports'; end if;
  if p_report_id = p_original_id then raise exception 'A request cannot be linked to itself'; end if;
  select * into report from public.requests where id = p_report_id for update;
  if not found then raise exception 'Report not found'; end if;
  select * into original from public.requests where id = p_original_id for update;
  if not found then raise exception 'Request not found'; end if;
  if report.duplicate_of is not null then raise exception 'This report is already linked'; end if;
  if original.duplicate_of is not null then raise exception 'A linked report cannot be an original'; end if;
  if p_note is not null and char_length(trim(p_note)) > 2000 then raise exception 'Link message is too long'; end if;
  update public.requests set duplicate_of = original.id, status = original.status where id = report.id;
  insert into public.status_history(request_id, status, changed_by, note)
    values (report.id, original.status, auth.uid(),
      'Linked to ' || original.reference || coalesce(': ' || nullif(trim(p_note), ''), ''));
  return (select r from public.requests r where r.id = report.id);
end;
$$;

create or replace function public.unlink_request(p_report_id uuid)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  report public.requests;
begin
  if not public.is_admin() then raise exception 'Only administrators can unlink reports'; end if;
  select * into report from public.requests where id = p_report_id for update;
  if not found then raise exception 'Request not found'; end if;
  if report.duplicate_of is null then raise exception 'This report is not linked'; end if;
  update public.requests set duplicate_of = null, status = 'pending' where id = report.id;
  insert into public.status_history(request_id, status, changed_by, note)
    values (report.id, 'pending', auth.uid(), 'This report is tracked separately again.');
  return (select r from public.requests r where r.id = report.id);
end;
$$;

create or replace function public.get_linked_original_context(p_report_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'reference', original.reference,
    'category', original.category,
    'location', original.location,
    'latitude', original.latitude,
    'longitude', original.longitude,
    'status', original.status,
    'created_at', original.created_at,
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object(
        'status', history.status, 'note', history.note, 'created_at', history.created_at
      ) order by history.created_at)
      from public.status_history history
      where history.request_id = original.id
    ), '[]'::jsonb)
  )
  from public.requests report
  join public.requests original on original.id = report.duplicate_of
  where report.id = p_report_id and report.citizen_id = auth.uid();
$$;

revoke all on function public.link_request(uuid, uuid, text) from public;
revoke all on function public.unlink_request(uuid) from public;
revoke all on function public.get_linked_original_context(uuid) from public;
grant execute on function public.link_request(uuid, uuid, text) to authenticated;
grant execute on function public.unlink_request(uuid) to authenticated;
grant execute on function public.get_linked_original_context(uuid) to authenticated;
