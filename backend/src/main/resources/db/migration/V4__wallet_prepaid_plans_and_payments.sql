-- V4__wallet_prepaid_plans_and_payments.sql

-- 1. Wallets table (1:1 with users)
CREATE TABLE wallets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_wallet_balance_positive CHECK (balance >= 0.00)
);

-- 2. Wallet transaction ledger (immutable record of all balance changes)
CREATE TABLE wallet_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    transaction_type VARCHAR(30) NOT NULL, -- CREDIT, DEBIT, REFUND
    amount DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- PENDING, COMPLETED, FAILED
    description VARCHAR(255) NOT NULL,
    reference_id VARCHAR(100),
    session_id BIGINT NULL,
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wt_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    CONSTRAINT fk_wt_session FOREIGN KEY (session_id) REFERENCES charging_sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_wt_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wt_idempotency ON wallet_transactions(idempotency_key);
CREATE INDEX idx_wt_session ON wallet_transactions(session_id);

-- 3. Sandbox payment intents
CREATE TABLE payment_intents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    intent_id VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    wallet_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCEEDED, FAILED, CANCELLED
    payment_method VARCHAR(50) NOT NULL DEFAULT 'SANDBOX_CARD',
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(255),
    confirmed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pi_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

CREATE INDEX idx_pi_user ON payment_intents(user_id);
CREATE INDEX idx_pi_intent ON payment_intents(intent_id);

-- 4. Prepaid plans
CREATE TABLE prepaid_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    credit_amount DECIMAL(10, 2) NOT NULL,
    energy_allowance_kwh DECIMAL(10, 2) NULL,
    validity_days INT NOT NULL DEFAULT 30,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO prepaid_plans (name, description, price, credit_amount, energy_allowance_kwh, validity_days, currency, active) VALUES
('VoltStarter Pack', 'Ideal for first-time EV drivers. Includes $3 bonus credit.', 25.00, 28.00, 50.00, 30, 'USD', TRUE),
('Commuter Booster', 'Optimized for daily city commuters. Includes $10 bonus credit.', 50.00, 60.00, 150.00, 60, 'USD', TRUE),
('Green Fleet Mega', 'Maximum savings for high-mileage drivers and fleets. Includes $25 bonus credit.', 100.00, 125.00, 400.00, 90, 'USD', TRUE);

-- 5. Customer purchased plans
CREATE TABLE customer_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    credited_amount DECIMAL(10, 2) NOT NULL,
    remaining_energy_kwh DECIMAL(10, 2) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, DEPLETED
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cp_plan FOREIGN KEY (plan_id) REFERENCES prepaid_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_cp_user ON customer_plans(user_id);
CREATE INDEX idx_cp_plan ON customer_plans(plan_id);

-- 6. Add payment_status to charging_sessions
ALTER TABLE charging_sessions ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID';
CREATE INDEX idx_session_payment_status ON charging_sessions(payment_status);
