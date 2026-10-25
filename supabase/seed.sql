-- Demo seed: one Seattle restaurant, no spaces, so the demo starts clean
-- (PRD §8 step 1 is the restaurant publishing its two spaces live).
insert into restaurants (name, location)
values ('Il Nido', 'West Seattle, Seattle, WA')
on conflict ((lower(trim(name))), (lower(trim(location)))) do nothing;
