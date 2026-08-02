-- Migration: 20260802_add_developer_response_to_bug_reports.sql
-- Description: Add nullable developer_response column to bug_reports table in tenant databases

ALTER TABLE bug_reports ADD COLUMN developer_response TEXT DEFAULT NULL;
