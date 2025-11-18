-- ============================================
-- Webhook Tracking Table
-- For production-safe concurrent webhook handling
-- ============================================

-- Create webhook_tracking table
CREATE TABLE IF NOT EXISTS webhook_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT UNIQUE NOT NULL,
    webhook_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_tracking_task_id ON webhook_tracking(task_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_webhook_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_tracking_updated_at
    BEFORE UPDATE ON webhook_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_tracking_updated_at();

-- Auto-cleanup old records (older than 24 hours)
-- Run this periodically via cron job or scheduled function
CREATE OR REPLACE FUNCTION cleanup_old_webhook_tracking()
RETURNS void AS $$
BEGIN
    DELETE FROM webhook_tracking
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE webhook_tracking IS 'Tracks webhook processing to ensure metadata cleanup only after all variants received';

