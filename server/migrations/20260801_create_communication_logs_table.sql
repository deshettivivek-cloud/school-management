-- Create communication_logs table for tracking bulk SMS and WhatsApp messaging
CREATE TABLE IF NOT EXISTS communication_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sent_by VARCHAR(36),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
    message_text TEXT NOT NULL,
    recipient_count INT NOT NULL DEFAULT 0,
    target_filter VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'partial', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sent_by) REFERENCES profiles(id) ON DELETE SET NULL
);
