-- Create task applications table
CREATE TABLE IF NOT EXISTS task_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(task_id, applicant_id)
);

-- Add RLS policies
ALTER TABLE task_applications ENABLE ROW LEVEL SECURITY;

-- Interns can view their own applications
CREATE POLICY "Users can view their own applications"
ON task_applications FOR SELECT
USING (auth.uid() = applicant_id);

-- Interns can create applications
CREATE POLICY "Users can create applications"
ON task_applications FOR INSERT
WITH CHECK (
    auth.uid() = applicant_id
    AND EXISTS (
        SELECT 1 FROM tasks 
        WHERE id = task_id 
        AND status = 'open'
        AND assigned_to IS NULL
    )
);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON task_applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM intern_profiles
        WHERE user_id = auth.uid()
        AND is_admin = true
    )
);

-- Admins can update applications
CREATE POLICY "Admins can update applications"
ON task_applications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM intern_profiles
        WHERE user_id = auth.uid()
        AND is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM intern_profiles
        WHERE user_id = auth.uid()
        AND is_admin = true
    )
);

-- Create function to handle application approval
CREATE OR REPLACE FUNCTION handle_task_application_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        -- Update the task to be assigned to the applicant
        UPDATE tasks
        SET assigned_to = NEW.applicant_id,
            status = 'assigned'
        WHERE id = NEW.task_id;
        
        -- Reject all other pending applications for this task
        UPDATE task_applications
        SET status = 'rejected',
            notes = 'Task was assigned to another applicant'
        WHERE task_id = NEW.task_id
        AND id != NEW.id
        AND status = 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for application approval
CREATE TRIGGER on_task_application_approval
    AFTER UPDATE ON task_applications
    FOR EACH ROW
    WHEN (OLD.status = 'pending' AND NEW.status = 'approved')
    EXECUTE FUNCTION handle_task_application_approval();

-- Grant permissions
GRANT ALL ON task_applications TO authenticated; 