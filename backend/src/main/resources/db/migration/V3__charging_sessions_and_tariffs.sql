-- V3__charging_sessions_and_tariffs.sql

-- 1. Tariffs table
CREATE TABLE tariffs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    rate_per_kwh DECIMAL(10, 4) NOT NULL,
    connector_type VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tariffs (name, rate_per_kwh, connector_type, active) VALUES
('DC_FAST_TARIFF', 0.3500, 'CCS2', TRUE),
('CHADEMO_TARIFF', 0.3500, 'CHAdeMO', TRUE),
('AC_DESTINATION_TARIFF', 0.2200, 'Type 2', TRUE),
('DEFAULT_STANDARD_TARIFF', 0.2800, NULL, TRUE);

-- 2. Charging sessions table
CREATE TABLE charging_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    station_id BIGINT NOT NULL,
    charger_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stop_time TIMESTAMP NULL,
    start_meter_kwh DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
    stop_meter_kwh DECIMAL(12, 4) NULL,
    energy_consumed_kwh DECIMAL(12, 4) NULL,
    tariff_per_kwh DECIMAL(10, 4) NOT NULL,
    total_cost DECIMAL(10, 2) NULL,
    simulation_note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_station FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_charger FOREIGN KEY (charger_id) REFERENCES chargers(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_user ON charging_sessions(user_id);
CREATE INDEX idx_session_charger ON charging_sessions(charger_id);
CREATE INDEX idx_session_status ON charging_sessions(status);
