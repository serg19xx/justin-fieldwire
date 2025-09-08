-- Insert users for all types except System Administrator
INSERT INTO `fw_users` (`email`, `password_hash`, `first_name`, `last_name`, `phone`, `user_type`, `job_title`, `status`, `invitation_status`, `created_at`, `updated_at`) VALUES
('architect1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Smith', '+1234567890', 'Architect', 'Senior Architect', 1, 'registered', NOW(), NOW()),
('architect2@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Johnson', '+1234567891', 'Architect', 'Lead Architect', 1, 'registered', NOW(), NOW()),
('pm1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike', 'Davis', '+1234567892', 'Project Manager', 'Senior Project Manager', 1, 'registered', NOW(), NOW()),
('pm2@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emily', 'Wilson', '+1234567893', 'Project Manager', 'Project Manager', 1, 'registered', NOW(), NOW()),
('gc1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Robert', 'Brown', '+1234567894', 'General Contractor', 'General Contractor', 1, 'registered', NOW(), NOW()),
('gc2@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lisa', 'Anderson', '+1234567895', 'General Contractor', 'Senior General Contractor', 1, 'registered', NOW(), NOW()),
('tc1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David', 'Miller', '+1234567896', 'Trade Contractor', 'Electrician', 1, 'registered', NOW(), NOW()),
('tc2@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jennifer', 'Taylor', '+1234567897', 'Trade Contractor', 'Plumber', 1, 'registered', NOW(), NOW()),
('tc3@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'James', 'Thomas', '+1234567898', 'Trade Contractor', 'HVAC Technician', 1, 'registered', NOW(), NOW()),
('client1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Michael', 'Jackson', '+1234567899', 'Client', 'Property Owner', 1, 'registered', NOW(), NOW()),
('client2@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Amanda', 'White', '+1234567800', 'Client', 'Facility Manager', 1, 'registered', NOW(), NOW());

|id |email                 |password|
|---|----------------------|--------|
|1  |Justin.kearney@me.com |password|
|45 |architect1@example.com|   -    |
|46 |architect2@example.com|   -    |
|47 |pm1@example.com       |   -    |
|48 |pm2@example.com       |   -    |
|49 |gc1@example.com       |   -    |
|50 |gc2@example.com       |   -    |
|51 |tc1@example.com       |   -    |
|52 |tc2@example.com       |   -    |
|53 |tc3@example.com       |   -    |
|54 |client1@example.com   |   -    |
|55 |client2@example.com   |   -    |


а есл