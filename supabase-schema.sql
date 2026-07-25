-- Supabase Schema for SolarDesign Pro - OpenSolar Clone v2 (Full 3D + Shade + Teams)
-- Run in Supabase SQL Editor - Mumbai region

create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  company_name text default 'Jaipur Solar Pro',
  created_at timestamptz default now()
);

-- Teams
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Jaipur Solar Team',
  owner_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','sales','designer','viewer')),
  created_at timestamptz default now(),
  primary key (team_id, user_id)
);

-- Leads CRM
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  phone text,
  email text,
  address text,
  lat double precision,
  lng double precision,
  status text default 'new' check (status in ('new','design','proposal','won','lost')),
  system_size_kw double precision,
  panel_count int,
  annual_prod_kwh int,
  net_cost int,
  roof_area_m2 int,
  notes text,
  team_id uuid references public.teams(id),
  user_id uuid references auth.users(id),
  google_building_insights jsonb
);

-- Projects (Designs with 3D & Shade)
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  created_at timestamptz default now(),
  roof_polygon jsonb,
  roof_segments jsonb, -- from Google Solar roofSegmentStats
  panels jsonb,
  tilt int default 15,
  azimuth int default 180,
  shading_loss int default 6,
  panel_watt int default 540,
  panel_width float default 1.13,
  panel_height float default 2.27,
  cost_per_kw int default 48000,
  subsidy int default 0,
  has_battery boolean default false,
  annual_production int,
  google_solar_data jsonb,
  shade_analysis jsonb, -- flux/shade layers
  three_d_snapshot text, -- base64 thumbnail
  team_id uuid references public.teams(id),
  user_id uuid references auth.users(id)
);

-- Proposals
create table public.proposals (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete cascade,
  project_id uuid references public.projects(id),
  created_at timestamptz default now(),
  title text,
  html_content text,
  pdf_url text,
  total_cost int,
  system_kw float,
  annual_prod int,
  status text default 'draft' check (status in ('draft','sent','viewed','signed')),
  viewed_at timestamptz,
  signed_at timestamptz,
  team_id uuid references public.teams(id),
  user_id uuid references auth.users(id)
);

-- Activity log for realtime collaboration
create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id),
  user_id uuid references auth.users(id),
  lead_id uuid references public.leads(id),
  action text,
  meta jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.leads enable row level security;
alter table public.projects enable row level security;
alter table public.proposals enable row level security;
alter table public.activity_log enable row level security;

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name) values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  -- create default team
  insert into public.teams (name, owner_id) values (coalesce(new.raw_user_meta_data->>'company_name','Jaipur Solar Team'), new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Policies (simplified - production should be stricter)
-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Teams
create policy "Team members can view team" on public.teams for select using (exists (select 1 from public.team_members where team_id = teams.id and user_id = auth.uid()) or owner_id = auth.uid());
create policy "Owner can create team" on public.teams for insert with check (auth.uid() = owner_id);

-- Team members
create policy "Team access" on public.team_members for all using (auth.uid() = user_id or exists (select 1 from public.teams where id = team_id and owner_id = auth.uid()));

-- Leads - team based
create policy "Team leads" on public.leads for all using (
  team_id in (select team_id from public.team_members where user_id = auth.uid()) 
  or user_id = auth.uid() 
  or auth.role() = 'authenticated'
) with check (true);

-- Projects similar
create policy "Team projects" on public.projects for all using (
  team_id in (select team_id from public.team_members where user_id = auth.uid()) or user_id = auth.uid() or auth.role() = 'authenticated'
) with check (true);

-- Proposals
create policy "Team proposals" on public.proposals for all using (
  team_id in (select team_id from public.team_members where user_id = auth.uid()) or user_id = auth.uid() or auth.role() = 'authenticated'
) with check (true);

-- Allow anon for demo (REMOVE IN PRODUCTION)
create policy "Allow anon for demo leads" on public.leads for all using (true) with check (true);
create policy "Allow anon for demo projects" on public.projects for all using (true) with check (true);
create policy "Allow anon for demo proposals" on public.proposals for all using (true) with check (true);
create policy "Allow anon profiles" on public.profiles for all using (true) with check (true);
create policy "Allow anon teams" on public.teams for all using (true) with check (true);
create policy "Allow anon team_members" on public.team_members for all using (true) with check (true);
create policy "Allow anon activity" on public.activity_log for all using (true) with check (true);

-- Indexes
create index leads_status_idx on public.leads(status);
create index leads_team_idx on public.leads(team_id);
create index projects_lead_idx on public.projects(lead_id);
create index activity_team_idx on public.activity_log(team_id);

-- Realtime
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.activity_log;
