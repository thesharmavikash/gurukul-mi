-- GURUKUL IAS Multiple Intelligences Database Setup
-- VERSION 4.0 | OPTIMIZED FOR SECURITY & ANALYTICS

CREATE DATABASE IF NOT EXISTS gurukul_mi;
USE gurukul_mi;

-- STUDENTS: Centralized user repository
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL, -- Format: GIAS-YYYY-XXXX
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL, -- Nullable for legacy registrations
    batch_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ASSESSMENT RESULTS: Historical performance and verification data
CREATE TABLE IF NOT EXISTS assessment_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    total_score INT NOT NULL,
    grade VARCHAR(100) NOT NULL,
    scores_json TEXT NOT NULL, -- Detailed score per category [0,0,0,0,0,0,0,0]
    test_type VARCHAR(50) NOT NULL,
    tab_switches INT DEFAULT 0,
    duration INT DEFAULT 0, -- in seconds
    is_suspicious BOOLEAN DEFAULT 0,
    verification_hash VARCHAR(64) UNIQUE NOT NULL,
    pdf_path VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- INDIVIDUAL QUESTION RESPONSES: Granular data for deep analytics
CREATE TABLE IF NOT EXISTS question_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    assessment_id INT NOT NULL,
    question_index INT NOT NULL,
    original_category_index INT NOT NULL,
    answer_value INT NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessment_results(id) ON DELETE CASCADE
);

-- MASTER QUESTION POOL
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_type VARCHAR(20) NOT NULL DEFAULT 'master',
    category_index INT NOT NULL, -- 0-7
    text_en TEXT NOT NULL,
    text_hi TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TEST CONFIGURATIONS
CREATE TABLE IF NOT EXISTS tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    question_count INT NOT NULL DEFAULT 56,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BATCH MANAGEMENT
CREATE TABLE IF NOT EXISTS batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    access_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROCTORING LOGS: Tracking real-time integrity violations
CREATE TABLE IF NOT EXISTS violation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    test_id INT NULL,
    violation_type VARCHAR(100) NOT NULL,
    violation_details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- CMS & SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT NULL
);

CREATE TABLE IF NOT EXISTS cms_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_key VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ADMIN USERS
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INITIAL SEED DATA
INSERT IGNORE INTO admins (username, password, role) VALUES 
('admin', '$2y$10$fS8yVlY8e2vX0P6v7L/8u.z9G9I5X0Z8e6v7L/8u.z9G9I5X0Z8e', 'superadmin'); -- admin123

INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES 
('institute_name', 'GURUKUL IAS'),
('contact_primary', '+91 95721 16701'),
('contact_secondary', '+91 82850 01819'),
('address', 'Sita Chowk, Geeta Kunj, Hajipur (Vaishali), Bihar');

INSERT IGNORE INTO tests (id, name, description, question_count) VALUES 
(1, 'Short Evaluation', '8 Key metrics for rapid cognitive mapping.', 8),
(2, 'Standard Assessment', ' Howard Gardner\'s 56-metric scientific test.', 56),
(3, 'Master Deep-Dive', 'Comprehensive 100-question intellectual blueprint.', 100);
