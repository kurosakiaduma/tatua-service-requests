create index requests_citizen_created_at_idx on public.requests(citizen_id, created_at desc);

-- Keep the free Supabase project protected even when submissions are concurrent
-- or originate outside the Next.js server action.
create or replace function public.check_request_submission_limit()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'You must be signed in to submit a request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  if (
    select count(*)
    from public.requests
    where citizen_id = current_user_id
      and created_at > timezone('utc', now()) - interval '1 hour'
  ) >= 10 then
    raise exception 'You can submit at most 10 requests per hour. Please try again later.';
  end if;
end;
$$;

revoke all on function public.check_request_submission_limit() from public;
grant execute on function public.check_request_submission_limit() to authenticated;

create or replace function public.enforce_request_submission_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.check_request_submission_limit();
  return new;
end;
$$;

create trigger requests_submission_limit
  before insert on public.requests
  for each row execute procedure public.enforce_request_submission_limit();
