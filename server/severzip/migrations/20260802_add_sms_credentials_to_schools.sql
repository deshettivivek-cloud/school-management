-- Add sms_credentials column to master schools table
-- Note: This is registered as a MASTER-ONLY migration by convention
ALTER TABLE schools ADD COLUMN sms_credentials JSON NULL;
