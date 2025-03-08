-- Create task_comments table
create table if not exists task_comments (
    id uuid default uuid_generate_v4() primary key,
    task_id uuid references tasks(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) on delete cascade not null
);

-- Enable RLS
alter table task_comments enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view comments on tasks they have access to" on task_comments;
drop policy if exists "Users can add comments to tasks they have access to" on task_comments;

-- Policies for task_comments
create policy "Users can view comments on tasks they have access to"
    on task_comments for select
    using (
        exists (
            select 1 from tasks
            where tasks.id = task_comments.task_id
            and (
                tasks.assigned_to = auth.uid() or  -- Intern assigned to the task
                exists (                           -- Or user is admin
                    select 1 from intern_profiles
                    where intern_profiles.user_id = auth.uid()
                    and intern_profiles.is_admin = true
                )
            )
        )
    );

create policy "Users can add comments to tasks they have access to"
    on task_comments for insert
    with check (
        exists (
            select 1 from tasks
            where tasks.id = task_comments.task_id
            and (
                tasks.assigned_to = auth.uid() or  -- Intern assigned to the task
                exists (                           -- Or user is admin
                    select 1 from intern_profiles
                    where intern_profiles.user_id = auth.uid()
                    and intern_profiles.is_admin = true
                )
            )
        )
    );

-- Grant necessary permissions
grant all on task_comments to authenticated; 