-- Create intern_points table
create table if not exists intern_points (
    id uuid default uuid_generate_v4() primary key,
    intern_id uuid references intern_profiles(user_id) on delete cascade not null,
    task_id uuid references tasks(id) on delete cascade not null,
    points_earned integer not null,
    earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) on delete cascade not null,
    unique(intern_id, task_id)  -- Ensure points are only awarded once per task
);

-- Enable RLS
alter table intern_points enable row level security;

-- Policies for intern_points
create policy "Users can view their own points"
    on intern_points for select
    using (
        intern_id = auth.uid() or  -- Interns can see their own points
        auth.uid() in (            -- Admins can see all points
            select user_id from intern_profiles where is_admin = true
        )
    );

create policy "Only admins can award points"
    on intern_points for insert
    with check (
        auth.uid() in (
            select user_id from intern_profiles where is_admin = true
        )
    );

-- Add total_points column to intern_profiles if it doesn't exist
do $$ 
begin
    if not exists (
        select from information_schema.columns 
        where table_name = 'intern_profiles' and column_name = 'total_points'
    ) then
        alter table intern_profiles add column total_points integer default 0;
    end if;
end $$;

-- Function to update total points
create or replace function update_intern_total_points()
returns trigger as $$
begin
    update intern_profiles
    set total_points = (
        select coalesce(sum(points_earned), 0)
        from intern_points
        where intern_id = NEW.intern_id
    )
    where user_id = NEW.intern_id;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to update total points when points are awarded
create trigger update_total_points
    after insert or update or delete
    on intern_points
    for each row
    execute function update_intern_total_points();

-- Grant necessary permissions
grant all on intern_points to authenticated;
grant all on intern_profiles to authenticated; 