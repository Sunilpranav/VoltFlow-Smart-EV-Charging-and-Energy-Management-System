-- V6__audit_log.sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id    BIGINT NULL,
    action           VARCHAR(255) NOT NULL,
    entity_type      VARCHAR(100) NULL,
    entity_id        BIGINT NULL,
    details          TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user
        FOREIGN KEY (actor_user_id) REFERENCES users(id)
        ON DELETE SET NULL
);
