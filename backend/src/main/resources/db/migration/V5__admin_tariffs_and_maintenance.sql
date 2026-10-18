-- V5__admin_tariffs_and_maintenance.sql

-- 1. Extend tariffs table with currency and updated_at
ALTER TABLE tariffs ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'USD';
ALTER TABLE tariffs ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 2. Maintenance records table
CREATE TABLE maintenance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    charger_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
    reported_by VARCHAR(255) NULL,
    assigned_technician VARCHAR(255) NULL,
    resolution_notes TEXT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_maint_charger FOREIGN KEY (charger_id) REFERENCES chargers(id) ON DELETE CASCADE
);

CREATE INDEX idx_maint_charger ON maintenance_records(charger_id);
CREATE INDEX idx_maint_status ON maintenance_records(status);
CREATE INDEX idx_maint_severity ON maintenance_records(severity);

-- 3. Seed an initial maintenance record for Airport EcoPort Charging (charger VF-A401 in maintenance)
INSERT INTO maintenance_records (charger_id, category, description, severity, status, reported_by, assigned_technician, created_at)
VALUES 
(10, 'ELECTRICAL', 'Power delivery fluctuation detected on high voltage inverter module.', 'HIGH', 'IN_PROGRESS', 'system_monitor@voltflow.com', 'Alex Rivera (Grid Tech)', CURRENT_TIMESTAMP);
