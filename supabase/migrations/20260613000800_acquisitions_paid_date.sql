-- Issue #9: track when an acquisition was actually paid, distinct from invoice date.
alter table public.acquisitions add column paid_date date;
