-- GURUKUL IAS Multiple Intelligences Database Setup
CREATE DATABASE IF NOT EXISTS gurukul_mi;
USE gurukul_mi;

-- Drop existing tables in correct order
DROP TABLE IF EXISTS question_responses;
DROP TABLE IF EXISTS assessment_results;
DROP TABLE IF EXISTS students;

CREATE TABLE students (

    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE, -- Format GIAS-XXXX
    name VARCHAR(255) NOT NULL,
    age INT,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    total_score INT,
    grade VARCHAR(100),
    scores_json TEXT,
    test_type VARCHAR(20), -- '100' or '56'
    tab_switches INT DEFAULT 0,
    verification_hash VARCHAR(64) UNIQUE,
    pdf_path VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT NULL
);

INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES 
('institute_name', 'GURUKUL IAS'),
('contact_primary', '+91 95721 16701'),
('contact_secondary', '+91 82850 01819'),
('address', 'Sita Chowk, Geeta Kunj, Hajipur (Vaishali), Bihar');


CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin: admin / admin123
INSERT IGNORE INTO admins (username, password, role) VALUES ('admin', '$2y$10$fS8yVlY8e2vX0P6v7L/8u.z9G9I5X0Z8e6v7L/8u.z9G9I5X0Z8e', 'superadmin');







CREATE TABLE question_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    assessment_id INT,
    question_index INT,
    original_category_index INT,
    answer_value INT,
    test_type VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (assessment_id) REFERENCES assessment_results(id)
);


`nCREATE TABLE IF NOT EXISTS questions (`n    id INT AUTO_INCREMENT PRIMARY KEY,`n    test_type VARCHAR(20) NOT NULL, -- 8, 56, 100`n    category_index INT NOT NULL, -- 0-7`n    text_en TEXT NOT NULL,`n    text_hi TEXT NOT NULL,`n    sort_order INT NOT NULL DEFAULT 0,`n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,`n    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`n);
