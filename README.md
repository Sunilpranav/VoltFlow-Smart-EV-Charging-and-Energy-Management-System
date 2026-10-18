# VoltFlow — Smart EV Charging and Energy Management System

[![CI Build](https://github.com/voltflow/voltflow/actions/workflows/ci.yml/badge.svg)](https://github.com/voltflow/voltflow/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com)

VoltFlow is an enterprise-grade full-stack Smart Electric Vehicle (EV) Charging and Energy Management platform. Built for modern EV charging network operators and drivers, it provides station discovery, continuous charging telemetry simulation, automated connector-specific tariff calculation, digital customer wallets with sandbox payments, prepaid energy subscriptions, hardware maintenance workflows, administrator operations, and immutable security audit logging.

---

## 1. Project Overview & Workflows

### 1.1 What VoltFlow Does
VoltFlow orchestrates the lifecycle of electric vehicle charging hubs:
- **For EV Drivers:** Real-time hub discovery, connector compatibility verification, live telemetry cockpits, simulated energy delivery, automated invoicing, and digital wallet payment settlements.
- **For Network Administrators:** Centralized operational cockpit, hardware stall provisioning, dynamic electricity tariff administration, maintenance ticket dispatch, driver refund processing, and financial ledger auditing.

### 1.2 Intended User Roles
| Role | Access Level | Primary Responsibilities |
| :--- | :--- | :--- |
| `PUBLIC` | Anonymous visitors | Browse stations, check connector compatibility, view platform tariffs, register accounts. |
| `ROLE_CUSTOMER` | Authenticated EV drivers | Manage EV fleet in garage, initiate charging sessions, monitor live telemetry, pay invoices, top up wallet. |
| `ROLE_ADMIN` | Station operators & techs | Monitor fleet metrics, deploy chargers, update tariffs, create maintenance tickets, issue refunds. |
| `ROLE_SUPER_ADMIN` | Platform administrators | Full system access, audit trail inspection, user authorization management. |

### 1.3 Customer Charging Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Driver as Customer (Driver)
    participant Web as React Frontend
    participant API as Spring Boot API
    participant Engine as Charging Simulator
    participant DB as MySQL Database

    Driver->>Web: Discover Station & Select Stall
    Web->>API: GET /api/stations/{id}
    API->>DB: Query station & chargers
    DB-->>Web: Real-time availability & tariffs
    Driver->>Web: Confirm & Start Session (Vehicle + Charger)
    Web->>API: POST /api/sessions/start (Atomic lock)
    API->>DB: UPDATE chargers SET status='OCCUPIED' WHERE status='AVAILABLE'
    API->>DB: INSERT INTO charging_sessions (status='CHARGING')
    API-->>Web: Session ID & start meter
    Web->>Driver: Live Cockpit (Continuous simulation clock)
    Driver->>Web: Complete & Stop Session
    Web->>API: POST /api/sessions/{id}/stop
    API->>Engine: Calculate dispensed kWh & cost (P × hours)
    API->>DB: Finalize session (status='COMPLETED', total_cost, end_meter)
    API->>DB: UPDATE chargers SET status='AVAILABLE'
    API-->>Web: Authoritative Session Receipt
    Driver->>Web: Settle Payment from Wallet
    Web->>API: POST /api/sessions/{id}/pay (Idempotent)
    API->>DB: Atomic wallet debit & ledger record
    API-->>Web: Payment confirmed
```

### 1.4 Administrator Operations Workflow
1. **Telemetry & Operations Cockpit:** Live visibility into total registered EV drivers, active hubs, dispenser availability breakdown (Available / Occupied / Maintenance / Offline), and real-time revenue aggregates.
2. **Station & Hardware Dispenser Management:** Provision new fast-charging stations, register dispensers with connector types (CCS2, CHAdeMO, Type 2), configure peak power in kW, and decommission stalls.
3. **Dynamic Tariff Configuration:** Maintain connector-specific pricing per kWh (e.g., `$0.35/kWh` DC Fast, `$0.22/kWh` AC Destination) with validation preventing conflicting active tariffs.
4. **Maintenance & Technician Workflows:** Log hardware faults (cable lock failures, screen outages, power module degradation), assign field technicians, update status (`IN_PROGRESS` → `RESOLVED`), and auto-restore charger availability upon ticket closure.
5. **Ledger & Audit Trail Inspection:** Review immutable financial transactions and view tamper-evident records of administrative actions.

### 1.5 Simulated Telemetry & Sandbox Payment Architecture
> [!NOTE]
> **Engineering Scope & Platform Transparency:**
> - **Continuous Energy Simulation:** Charging sessions calculate consumed energy deterministically using standard electrical physics: $\text{Energy (kWh)} = \text{Power (kW)} \times \text{Duration (hours)}$. No physical charging hardware is connected.
> - **OCPP Protocol Scope:** Physical charger hardware protocols (OCPP 1.6-J / 2.0.1 JSON WebSocket brokers) are not connected; hardware availability and meter registers are managed reliably via transactional database states.
> - **Isolated Sandbox Payments:** All wallet top-ups, card authorizations, and invoice settlements operate in a self-contained simulated sandbox (`SANDBOX_CARD`). No external payment gateway credentials are used and no real financial charges are incurred.

---

## 2. System Architecture

```mermaid
graph TD
    Client["Clients (Desktop & Mobile Browsers)"] -->|HTTPS / 443| Gateway["Nginx Reverse Proxy & TLS Gateway"]
    Client -.->|HTTP / 80 Redirect| Gateway
    
    subgraph "DMZ / Public Edge"
        Gateway
    end
    
    subgraph "Application Layer (Internal Network)"
        Gateway -->|Static Bundle / Assets| Frontend["React 19 + TypeScript SPA"]
        Gateway -->|Reverse Proxy /api/| Backend["Spring Boot 3.2.5 REST API (:8080)"]
        Backend --> Sim["Continuous Simulation Engine"]
        Backend --> Sec["Spring Security + JWT Auth (HMAC-SHA256)"]
    end
    
    subgraph "Data Persistence Layer (Isolated Network)"
        Backend -->|HikariCP Connection Pool / JDBC| DB[(MySQL 8.0 Database)]
        Backend -->|Flyway Migrations V1-V7| DB
    end
```

### Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Vitest.
- **Backend:** Java 17, Spring Boot 3.2.5, Spring Security, JWT, Spring Data JPA, Hibernate, Flyway.
- **Database:** MySQL 8.0 (InnoDB, utf8mb4, transactional ACID integrity).
- **Infrastructure:** Docker, Docker Compose, Nginx (TLS termination, HTTP security headers).
- **Testing:** JUnit 5, Mockito, Spring Boot Test, H2 in-memory test database, Vitest.

---

## 3. Database Entity-Relationship Diagram

The database schema is managed via Flyway migrations `V1__init.sql` through `V7__add_performance_indexes.sql`:

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : "assigned"
    ROLES ||--o{ USER_ROLES : "granted"
    USERS ||--o{ VEHICLES : "owns"
    USERS ||--|| WALLETS : "has"
    USERS ||--o{ CHARGING_SESSIONS : "initiates"
    USERS ||--o{ CUSTOMER_PLANS : "subscribes"
    
    STATIONS ||--o{ CHARGERS : "contains"
    CHARGERS ||--o{ CHARGING_SESSIONS : "dispenses"
    CHARGERS ||--o{ MAINTENANCE_RECORDS : "subject_of"
    
    WALLETS ||--o{ WALLET_TRANSACTIONS : "logs"
    WALLETS ||--o{ PAYMENT_INTENTS : "credits"
    CHARGING_SESSIONS ||--o{ WALLET_TRANSACTIONS : "settles"
    
    PREPAID_PLANS ||--o{ CUSTOMER_PLANS : "purchased_as"
    TARIFFS ||--o{ CHARGERS : "prices"

    USERS {
        bigint id PK
        string email UK
        string password
        string first_name
        string last_name
        string phone
        boolean enabled
        timestamp created_at
    }

    ROLES {
        bigint id PK
        string name UK
    }

    VEHICLES {
        bigint id PK
        bigint user_id FK
        string make
        string model
        int model_year
        string registration_number UK
        string connector_type
        decimal battery_capacity_kwh
    }

    STATIONS {
        bigint id PK
        string name
        string address
        double latitude
        double longitude
        string status
        timestamp created_at
    }

    CHARGERS {
        bigint id PK
        bigint station_id FK
        string charger_code UK
        string connector_type
        decimal max_power_kw
        string status
    }

    TARIFFS {
        bigint id PK
        string name UK
        decimal rate_per_kwh
        string connector_type
        boolean active
    }

    CHARGING_SESSIONS {
        bigint id PK
        bigint user_id FK
        bigint vehicle_id FK
        bigint station_id FK
        bigint charger_id FK
        string status
        timestamp start_time
        timestamp stop_time
        decimal start_meter_kwh
        decimal stop_meter_kwh
        decimal energy_consumed_kwh
        decimal tariff_per_kwh
        decimal total_cost
        string payment_status
    }

    WALLETS {
        bigint id PK
        bigint user_id FK,UK
        decimal balance
        string currency
    }

    WALLET_TRANSACTIONS {
        bigint id PK
        bigint wallet_id FK
        string transaction_type
        decimal amount
        decimal balance_after
        string status
        string idempotency_key UK
        bigint session_id FK
    }

    PREPAID_PLANS {
        bigint id PK
        string name UK
        decimal price
        decimal energy_kwh
        int validity_days
        boolean active
    }

    MAINTENANCE_RECORDS {
        bigint id PK
        bigint charger_id FK
        string category
        string description
        string severity
        string status
        string assigned_technician
    }

    AUDIT_LOGS {
        bigint id PK
        string actor_email
        string action
        string entity_type
        bigint entity_id
        text details
        string ip_address
        timestamp created_at
    }
```

---

## 4. UI Screenshot Gallery

| Screen | Description | Reference Artifact |
| :--- | :--- | :--- |
| **Landing Page (Desktop)** | Public introduction, value proposition, live network counter | `docs/screenshots/landing_desktop.png` |
| **Landing Page (Mobile)** | Responsive navigation drawer, touch targets, and responsive hero | `docs/screenshots/landing_mobile.png` |
| **Customer Dashboard** | Driver garage, recent sessions, wallet summary, quick actions | `docs/screenshots/customer_dashboard.png` |
| **Active Charging Cockpit** | Continuous energy accumulator, delivery speed, stop modal | `docs/screenshots/active_charging.png` |
| **Admin Operations Cockpit** | Dispenser breakdown, active sessions, financial totals, navigation | `docs/screenshots/admin_dashboard.png` |
| **Admin Maintenance Management**| Hardware repair tickets, severity filters, technician dispatch | `docs/screenshots/admin_maintenance.png` |
| **Admin Plan Administration** | Prepaid energy subscription package configuration | `docs/screenshots/admin_plans.png` |

---

## 5. Currency & Financial Consistency

VoltFlow standardizes strictly on **USD ($)** across all layers:
- **Database:** Column defaults in `wallets` and `wallet_transactions` are `USD` with `DECIMAL(12, 2)` monetary precision.
- **Tariffs:** Structured as `DECIMAL(10, 4)` to support exact electricity pricing (e.g. `$0.3500 / kWh`).
- **Frontend Utility:** All components import centralized formatters from `frontend/src/utils/currency.ts`:
  - `formatCurrency(val)`: Formats standard values (`$25.00`), zero (`$0.00`), and negative refunds (`-$15.50`).
  - `formatTariffRate(rate)`: Formats rates as `$X.XX / kWh`.
  - `formatEnergy(kwh)`: Formats delivered power as `X.XX kWh`.

---

## 6. Demo Data & Test Isolation

### Demonstration Fixtures
- Flyway migrations `V1`–`V5` seed initial demo stations (e.g., Downtown EV Hub, Mission District Supercharger), standard connector tariffs, and sample maintenance tickets.
- All demo stations use realistic coordinates in the San Francisco Bay Area and include OpenStreetMap direct navigation links.

### Complete Isolation in Automated Tests
- Backend tests (`backend/src/test/resources/application-test.yml`) execute against an in-memory H2 database with `flyway.enabled: false` and `ddl-auto: create-drop`. Tests never write to or read from MySQL.
- The `ProductionSecurityValidator` executes on `@Profile("prod")` and fails fast on default development secrets or wildcard CORS configurations, ensuring development credentials cannot be deployed into production.

---

## 7. Local Development & Quick Start

### Prerequisites
- Docker Engine 24+ and Docker Compose v2+
- (Host builds): Java 17 JDK, Maven 3.9+, Node.js 20+

### Step 1: Environment Setup
```bash
cp .env.example .env
```

### Step 2: Start All Services via Docker
```bash
docker compose up -d --build
```
This boots:
1. `voltflow-db`: MySQL 8.0 on host port `3307` (container port 3306).
2. `voltflow-backend`: Spring Boot 3 API on host port `8080`.
3. `voltflow-frontend`: React application on host port `5173`.

### Step 3: Verify Liveness
```bash
# Check container status
docker compose ps

# Backend Healthcheck
curl http://localhost:8080/actuator/health

# Frontend HTTP Status
curl -I http://localhost:5173/
```

### Accessing the Web Application
- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API Base:** [http://localhost:8080/api](http://localhost:8080/api)
- **Health Endpoint:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

## 8. Verification & Test Suite Execution

### Backend Integration Tests (JUnit 5 + Spring Boot)
```bash
cd backend
mvn test
```
**Expected Result:** 144 tests passing, 0 failures, 0 errors.

### Frontend Unit & Formatting Tests (Vitest)
```bash
cd frontend
npm test
```
**Expected Result:** 22 tests passing across 4 test suites (auth, charging, wallet, currency).

### Frontend Production Build & Typecheck
```bash
cd frontend
npm run lint
npm run build
```
**Expected Result:** 0 ESLint warnings/errors, clean Vite production bundle generated.

### Database Migration Verification
Run the automated migration runner to verify fresh schema initialization against MySQL:
```bash
powershell -ExecutionPolicy Bypass -File .\scripts\test_migration_chain.ps1
```
**Expected Result:** V1 through V7 migrations execute in sequence with exit code 0.

---

## 9. Troubleshooting & Operations

1. **Port 3307 Conflict:**
   - If port 3307 is already bound on your machine, edit `docker-compose.yml` to change `"3307:3306"` to another free port (e.g. `"3308:3306"`).
2. **CORS Rejection:**
   - Verify `CORS_ALLOWED_ORIGINS` in `.env` includes your exact browser origin (e.g. `http://localhost:5173`).
3. **Database Connection Refused:**
   - Wait 10 seconds for `voltflow-db` to complete health initialization before starting local IDE backends.
   - Run `docker logs voltflow-db` to inspect database error logs.

---

## 10. Security & Release Readiness Checklist

- [x] Passwords securely hashed with BCrypt.
- [x] Stateless JWT authentication with expiration.
- [x] Zero public ports on internal database in production profile.
- [x] Fail-fast security validation on production profile.
- [x] Idempotency keys enforced on billing and refund endpoints.
- [x] Sensitive parameters excluded from audit logging.
- [x] Centralized currency and energy formatting.
- [x] Flyway migrations V1–V7 verified on clean database.
- [x] 100% test pass rate across backend (144) and frontend (22).
- [x] Zero credentials, secrets, or certificates committed to Git.
