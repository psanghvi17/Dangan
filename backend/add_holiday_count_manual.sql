-- Manual SQL to add holiday_count column to m_candidate table
-- Run this if the migration didn't work

-- Check if column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'app' 
        AND table_name = 'm_candidate' 
        AND column_name = 'holiday_count'
    ) THEN
        -- Add the column
        ALTER TABLE app.m_candidate ADD COLUMN holiday_count FLOAT4 DEFAULT 0.0;
        RAISE NOTICE 'Added holiday_count column to m_candidate table';
    ELSE
        RAISE NOTICE 'holiday_count column already exists in m_candidate table';
    END IF;
END $$;

-- Update existing records to have 0.0 as default
UPDATE app.m_candidate SET holiday_count = 0.0 WHERE holiday_count IS NULL;

-- Show the current state
SELECT candidate_id, invoice_contact_name, holiday_count 
FROM app.m_candidate 
LIMIT 5;
