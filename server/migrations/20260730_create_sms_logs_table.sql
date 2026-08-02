-- Migration: Add sms_logs table to existing school databases
-- Run this on each school database that was created before this migration

CREATE TABLE IF NOT EXISTS sms_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    gateway_response VARCHAR(500) DEFAULT '',
    message_id VARCHAR(100) DEFAULT '',
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
    channel VARCHAR(20) DEFAULT 'sms',
    sent_by VARCHAR(36) REFERENCES profiles(id),
    sent_by_name VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sms_logs_created (created_at DESC),
    INDEX idx_sms_logs_phone (phone)
);
