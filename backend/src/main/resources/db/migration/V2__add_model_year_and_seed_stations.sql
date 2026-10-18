-- V2__add_model_year_and_seed_stations.sql
-- 1. Add model_year to vehicles table
ALTER TABLE vehicles ADD COLUMN model_year INT NULL;

-- 2. Seed initial stations
INSERT INTO stations (name, address, latitude, longitude, status, created_at)
VALUES 
('VoltFlow Central Hub', '100 Innovation Blvd, Metro City', 37.7749, -122.4194, 'ACTIVE', CURRENT_TIMESTAMP),
('Downtown Express Charging', '450 Market Street, Metro City', 37.7891, -122.4014, 'ACTIVE', CURRENT_TIMESTAMP),
('Silicon Bay Tech Park Hub', '800 Technology Way, Silicon Bay', 37.3861, -122.0839, 'ACTIVE', CURRENT_TIMESTAMP),
('Airport EcoPort Charging', '1 Terminal Drive, International Airport', 37.6213, -122.3790, 'MAINTENANCE', CURRENT_TIMESTAMP);

-- 3. Seed initial chargers for stations
-- Station 1 (VoltFlow Central Hub)
INSERT INTO chargers (station_id, charger_code, connector_type, max_power_kw, status, created_at)
VALUES
(1, 'VF-C101', 'CCS2', 150.00, 'AVAILABLE', CURRENT_TIMESTAMP),
(1, 'VF-C102', 'CCS2', 150.00, 'OCCUPIED', CURRENT_TIMESTAMP),
(1, 'VF-C103', 'Type 2', 22.00, 'AVAILABLE', CURRENT_TIMESTAMP),
(1, 'VF-C104', 'CHAdeMO', 50.00, 'AVAILABLE', CURRENT_TIMESTAMP);

-- Station 2 (Downtown Express Charging)
INSERT INTO chargers (station_id, charger_code, connector_type, max_power_kw, status, created_at)
VALUES
(2, 'VF-D201', 'CCS2', 350.00, 'AVAILABLE', CURRENT_TIMESTAMP),
(2, 'VF-D202', 'CCS2', 350.00, 'AVAILABLE', CURRENT_TIMESTAMP),
(2, 'VF-D203', 'Type 2', 43.00, 'OCCUPIED', CURRENT_TIMESTAMP);

-- Station 3 (Silicon Bay Tech Park Hub)
INSERT INTO chargers (station_id, charger_code, connector_type, max_power_kw, status, created_at)
VALUES
(3, 'VF-S301', 'CCS2', 150.00, 'AVAILABLE', CURRENT_TIMESTAMP),
(3, 'VF-S302', 'Type 2', 22.00, 'AVAILABLE', CURRENT_TIMESTAMP),
(3, 'VF-S303', 'CHAdeMO', 50.00, 'OFFLINE', CURRENT_TIMESTAMP);

-- Station 4 (Airport EcoPort Charging - in maintenance)
INSERT INTO chargers (station_id, charger_code, connector_type, max_power_kw, status, created_at)
VALUES
(4, 'VF-A401', 'CCS2', 150.00, 'OFFLINE', CURRENT_TIMESTAMP),
(4, 'VF-A402', 'Type 2', 22.00, 'OFFLINE', CURRENT_TIMESTAMP);
