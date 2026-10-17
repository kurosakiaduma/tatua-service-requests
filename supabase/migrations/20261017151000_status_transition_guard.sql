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
  -- Lock the primary row so its status and linked reports change atomically.
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
  if next_status = 'rejected' and char_length(trim(coalesce(p_note, ''))) < 10 then
    raise exception 'Rejected requests require a reason of at least ten characters';
  end if;
  if next_status = current_request.status and nullif(trim(coalesce(p_note, '')), '') is null then
    raise exception 'An update must change the status or include a message';
  end if;

  update public.requests set status = next_status where id = p_request_id;
  insert into public.status_history (request_id, status, changed_by, note)
    values (p_request_id, next_status, auth.uid(), nullif(trim(p_note), ''))
    returning * into result;
  update public.requests set status = next_status where duplicate_of = p_request_id;
  insert into public.status_history (request_id, status, changed_by, note)
    select id, next_status, auth.uid(),
      'Status update on ' || current_request.reference ||
      coalesce(': ' || nullif(trim(p_note), ''), '')
    from public.requests where duplicate_of = p_request_id;
  return result;
end;
$$;
