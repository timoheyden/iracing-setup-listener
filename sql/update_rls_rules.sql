-- RLS jeweils aktivieren
alter table iracing_watcher.basepaths enable row level security;
alter table iracing_watcher.providers enable row level security;
alter table iracing_watcher.iracing_channels enable row level security;
alter table iracing_watcher.posted_files enable row level security;

-- basepaths: Lesen (USING), Insert (WITH CHECK), Update (USING & WITH CHECK optional)
create policy "Allow service read basepaths"
  on iracing_watcher.basepaths
  for select
                 using (true);

create policy "Allow service insert basepaths"
  on iracing_watcher.basepaths
  for insert
  with check (true);

create policy "Allow service update basepaths"
  on iracing_watcher.basepaths
  for update
                        using (true)
      with check (true);

-- providers
create policy "Allow service read providers"
  on iracing_watcher.providers
  for select
                 using (true);

create policy "Allow service insert providers"
  on iracing_watcher.providers
  for insert
  with check (true);

create policy "Allow service update providers"
  on iracing_watcher.providers
  for update
                        using (true)
      with check (true);

-- iracing_channels
create policy "Allow service read iracing_channels"
  on iracing_watcher.iracing_channels
  for select
                 using (true);

create policy "Allow service insert iracing_channels"
  on iracing_watcher.iracing_channels
  for insert
  with check (true);

create policy "Allow service update iracing_channels"
  on iracing_watcher.iracing_channels
  for update
                        using (true)
      with check (true);

-- posted_files
create policy "Allow service read posted_files"
  on iracing_watcher.posted_files
  for select
                 using (true);

create policy "Allow service insert posted_files"
  on iracing_watcher.posted_files
  for insert
  with check (true);

create policy "Allow service update posted_files"
  on iracing_watcher.posted_files
  for update
                        using (true)
      with check (true);