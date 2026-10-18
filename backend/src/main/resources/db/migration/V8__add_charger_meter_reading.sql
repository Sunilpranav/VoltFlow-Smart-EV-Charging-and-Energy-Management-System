-- Track a cumulative per-charger energy meter reading.
-- Existing chargers start from the legacy baseline so prior session history remains unchanged.
ALTER TABLE chargers
    ADD COLUMN meter_reading_kwh DECIMAL(12,4) NOT NULL DEFAULT 1000.0000;
