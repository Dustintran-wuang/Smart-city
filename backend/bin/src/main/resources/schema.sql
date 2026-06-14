-- 1. users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role VARCHAR(30) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. refresh_tokens
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. drivers
CREATE TABLE drivers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_plate VARCHAR(20),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. devices
CREATE TABLE devices (
    id BIGSERIAL PRIMARY KEY,
    device_code VARCHAR(50) UNIQUE NOT NULL,
    device_type VARCHAR(30) NOT NULL,
    location VARCHAR(100),
    mqtt_topic VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_heartbeat TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. device_status_logs
CREATE TABLE device_status_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id BIGINT REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    triggered_by VARCHAR(20) NOT NULL,
    triggered_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. alert_logs
CREATE TABLE alert_logs (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT REFERENCES drivers(id) ON DELETE SET NULL,
    device_id BIGINT REFERENCES devices(id) ON DELETE SET NULL,
    alert_type VARCHAR(30) NOT NULL DEFAULT 'DROWSY',
    ear_value DOUBLE PRECISION NOT NULL,
    ear_threshold DOUBLE PRECISION NOT NULL,
    consecutive_frames INT,
    image_url VARCHAR(255),
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. notification_logs
CREATE TABLE notification_logs (
    id BIGSERIAL PRIMARY KEY,
    alert_log_id BIGINT REFERENCES alert_logs(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    retry_count INT DEFAULT 0,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. system_configs
CREATE TABLE system_configs (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. audit_logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    ip_address VARCHAR(45),
    detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. chat_sessions
CREATE TABLE chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. chat_messages
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_refresh_token ON refresh_tokens(token);
CREATE INDEX idx_device_status_device_id ON device_status_logs(device_id);
CREATE INDEX idx_device_status_created_at ON device_status_logs(created_at);
CREATE INDEX idx_alert_created_at ON alert_logs(created_at);
CREATE INDEX idx_alert_device_id ON alert_logs(device_id);
CREATE INDEX idx_alert_is_acknowledged ON alert_logs(is_acknowledged);
CREATE INDEX idx_notification_alert_log_id ON notification_logs(alert_log_id);
CREATE INDEX idx_notification_status ON notification_logs(status);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Seed Initial System Configs
INSERT INTO system_configs (config_key, config_value, description) VALUES
('ear_threshold', '0.25', 'Ngưỡng EAR để xác định ngủ gật'),
('ear_consecutive_frames', '20', 'Số frame liên tiếp mắt nhắm để xác nhận ngủ gật'),
('telegram_enabled', 'true', 'Bật/tắt gửi Telegram'),
('email_enabled', 'true', 'Bật/tắt gửi Email'),
('buzzer_auto', 'true', 'Tự động kích hoạt buzzer khi phát hiện ngủ gật'),
('traffic_light_auto', 'true', 'Tự động đổi đèn đỏ khi phát hiện ngủ gật');
