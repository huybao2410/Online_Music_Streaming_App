CREATE TABLE IF NOT EXISTS subscription_plans (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(50) NOT NULL UNIQUE, -- Tên gói (ví dụ: Premium, Family, Student)
description TEXT DEFAULT NULL, -- Mô tả gói
price DECIMAL(10, 2) NOT NULL, -- Giá của gói
currency ENUM('USD', 'VND', 'EUR', 'OTHER') DEFAULT 'USD',
audio_quality ENUM('low', 'standard', 'high') DEFAULT 'standard', -- Chất lượng âm thanh
ad_free BOOLEAN DEFAULT FALSE, -- Có loại bỏ quảng cáo không
duration_days INT NOT NULL, -- Thời gian hiệu lực (tính bằng ngày)
trial_period_days INT DEFAULT 0,
is_renewable BOOLEAN DEFAULT TRUE,
renewal_discount DECIMAL(5, 2) DEFAULT 0.00,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT chk_duration_positive CHECK (duration_days > 0)
);


CREATE TABLE IF NOT EXISTS user_subscriptions (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	user_id INT NOT NULL,
	subscription_plan_id INT NOT NULL,
	start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	duration_days INT NOT NULL, -- Thêm cột này
	adjusted_duration_days INT DEFAULT NULL, -- Override nếu prorate
	end_date TIMESTAMP GENERATED ALWAYS AS (DATE_ADD(start_date, INTERVAL COALESCE(adjusted_duration_days, duration_days) DAY)) STORED,
	status ENUM('active', 'expired', 'canceled') DEFAULT 'active',
	renewal_count INT DEFAULT 0,
	auto_renew BOOLEAN DEFAULT FALSE,
	next_renewal_date TIMESTAMP GENERATED ALWAYS AS (DATE_ADD(end_date, INTERVAL COALESCE(adjusted_duration_days, duration_days) DAY)) STORED,
	last_renewal_date TIMESTAMP null DEFAULT NULL,
	payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
	payment_method_token VARCHAR(255) DEFAULT NULL,
	payment_gateway VARCHAR(50) DEFAULT NULL,
	prorated_amount DECIMAL(10, 2) DEFAULT 0.00,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
	UNIQUE KEY chk_user_sub_unique (user_id, subscription_plan_id, status)  -- Tránh duplicate active per user/plan
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, currency, audio_quality, ad_free, duration_days, trial_period_days) VALUES
('1 tháng', 'Nghe nhạc không quảng cáo, tải offline', 49000, 'VND', 'high', TRUE, 30, 7),
('3 tháng', 'Gói 3 tháng ưu đãi', 129000, 'VND', 'high', TRUE, 90, 0),
('1 năm', 'Gói 1 năm tiết kiệm', 499000, 'VND', 'high', TRUE, 365, 0)
ON DUPLICATE KEY UPDATE 
  description = VALUES(description),
  price = VALUES(price);