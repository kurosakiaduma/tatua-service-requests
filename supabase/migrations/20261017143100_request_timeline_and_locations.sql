alter table public.requests
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.requests
  add constraint requests_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint requests_longitude_range check (longitude is null or longitude between -180 and 180);

drop policy if exists "Citizens create own requests" on public.requests;
create policy "Authenticated users create own requests"
  on public.requests for insert to authenticated
  with check (citizen_id = auth.uid());

drop policy if exists "Citizens upload request images" on storage.objects;
create policy "Authenticated users upload request images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'request-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop trigger if exists requests_status_history on public.requests;
drop policy if exists "Admins update requests" on public.requests;

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
  if p_note is not null and char_length(trim(p_note)) > 2000 then
    raise exception 'Update message is too long';
  end if;
  select * into current_request from public.requests where id = p_request_id for update;
  if not found then raise exception 'Request not found'; end if;
  next_status := coalesce(p_status, current_request.status);
  if current_request.status in ('resolved', 'rejected')
     and next_status <> 'in_progress' then
    raise exception 'Final requests may only be reopened to in progress';
  end if;
  if next_status = current_request.status and nullif(trim(coalesce(p_note, '')), '') is null then
    raise exception 'An update must change the status or include a message';
  end if;
  update public.requests set status = next_status where id = p_request_id;
  insert into public.status_history (request_id, status, changed_by, note)
    values (p_request_id, next_status, auth.uid(), nullif(trim(p_note), ''))
    returning * into result;
  return result;
end;
$$;

revoke all on function public.post_request_update(uuid, public.request_status, text) from public;
grant execute on function public.post_request_update(uuid, public.request_status, text) to authenticated;
