-- Create bug_reports table for tenant databases
CREATE TABLE IF NOT EXISTS bug_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reported_by VARCHAR(36) NOT NULL,
    reporter_name VARCHAR(255) NOT NULL,
    page_url VARCHAR(500) DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'fixed', 'wont_fix') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bug_reports_status (status),
    INDEX idx_bug_reports_created (created_at)
);
