-- V7__add_performance_indexes.sql
-- Optimized query indexes for reporting, pagination, and audit filtering

-- 1. Audit Logs: Support filtered administrative audit queries and reverse-chronological sorting
CREATE INDEX idx_audit_action_created ON audit_logs(action, created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- 2. Charging Sessions: Support date-range monitoring and station telemetry joins
CREATE INDEX idx_session_station_start ON charging_sessions(station_id, start_time);
CREATE INDEX idx_session_start_time ON charging_sessions(start_time);

-- 3. Wallet Transactions: Support financial ledger type filtering and chronological reconciliation
CREATE INDEX idx_wt_type_created ON wallet_transactions(transaction_type, created_at);
CREATE INDEX idx_wt_created ON wallet_transactions(created_at);

-- 4. Maintenance Records: Support chronological reporting
CREATE INDEX idx_maint_created ON maintenance_records(created_at);
