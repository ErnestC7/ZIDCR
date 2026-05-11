-- =============================================================
-- ZAMBIA INTEGRATED DIGITAL ID & CIVIL REGISTRY (ZIDCR)
-- PostgreSQL Database Schema — Production Grade
-- Aligned with INRIS 13-Digit eNRC Standard
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUMS (Named types for data integrity)
-- =============================================================
CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Intersex');
CREATE TYPE marital_status_type AS ENUM ('Single', 'Married', 'Divorced', 'Widowed');
CREATE TYPE registration_channel AS ENUM ('CITIZEN_PORTAL', 'OFFICER_STATION', 'MOBILE_FIELD', 'HOSPITAL_CRVS');
CREATE TYPE birth_location_type AS ENUM ('Hospital', 'Clinic', 'Home Birth', 'Rural Health Post');
CREATE TYPE vital_event_type AS ENUM ('BIRTH', 'DEATH', 'MARRIAGE', 'DIVORCE');
CREATE TYPE vital_event_status AS ENUM ('PENDING', 'REGISTERED', 'VERIFIED', 'REJECTED');
CREATE TYPE certificate_type AS ENUM ('BIRTH_CERTIFICATE', 'DEATH_CERTIFICATE', 'NATIONAL_ID', 'GUARDIAN_CERTIFICATE');
CREATE TYPE subject_type AS ENUM ('NORMAL_BIRTH', 'ORPHAN', 'WARD_OF_STATE', 'ABANDONED');
CREATE TYPE kyc_level AS ENUM ('TIER_1_BASIC', 'TIER_2_ENHANCED', 'TIER_3_FULL_BIOMETRIC');
CREATE TYPE payment_network AS ENUM ('MTN_MOMO', 'AIRTEL_MONEY', 'ZAMTEL_MONEY', 'VISA', 'MASTERCARD');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED');
CREATE TYPE officer_role AS ENUM ('REGISTRATION_OFFICER', 'HOSPITAL_OFFICER', 'FIELD_HEALTH_WORKER', 'SYSTEM_ADMIN', 'AUDITOR');
CREATE TYPE notification_type AS ENUM ('EMAIL', 'SMS', 'PUSH');
CREATE TYPE notification_status AS ENUM ('QUEUED', 'SENT', 'FAILED', 'BOUNCED');

-- =============================================================
-- 1. OFFICERS & SYSTEM USERS
-- =============================================================
CREATE TABLE IF NOT EXISTS officers (
    officer_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            officer_role NOT NULL DEFAULT 'REGISTRATION_OFFICER',
    station         VARCHAR(255),          -- e.g. Lusaka Civil Registry Office
    province        VARCHAR(100),
    phone           VARCHAR(20),
    email           VARCHAR(255) UNIQUE,
    password_hash   TEXT NOT NULL,         -- bcrypt hashed
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_officers_email ON officers(email);
CREATE INDEX idx_officers_role ON officers(role);

-- =============================================================
-- 2. CITIZENS — Core Identity Record
-- Uses 13-digit INRIS eNRC as the primary national identifier
-- =============================================================
CREATE TABLE IF NOT EXISTS citizens (
    -- Primary Key: 13-digit numeric string (INRIS eNRC Standard)
    uci             CHAR(13) PRIMARY KEY,
    
    -- Demographics
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    other_names     VARCHAR(100),
    date_of_birth   DATE NOT NULL,
    gender          gender_type NOT NULL,
    nationality     VARCHAR(50) NOT NULL DEFAULT 'Zambian',
    marital_status  marital_status_type DEFAULT 'Single',
    province        VARCHAR(100),
    address         TEXT,
    
    -- Contact
    phone           VARCHAR(20),
    email           VARCHAR(255),
    
    -- Legacy & linked IDs
    legacy_nrc_number   VARCHAR(20) UNIQUE,   -- Old NRC format e.g. 123456/10/1
    passport_number     VARCHAR(20) UNIQUE,
    
    -- Biometrics (Stored as hashes/vectors — NEVER raw images)
    biometric_facial_vector TEXT,             -- 128-dim FaceNet embedding (Base64)
    biometric_hash          TEXT,             -- SHA-256 hash for deduplication
    
    -- Cryptographic Credential
    vc_public_key       TEXT,                 -- Citizen's public key for VC
    vc_signature        TEXT,                 -- Ministry's digital signature
    vc_issued_at        TIMESTAMP WITH TIME ZONE,
    vc_expires_at       TIMESTAMP WITH TIME ZONE,
    
    -- KYC Level
    kyc_level       kyc_level DEFAULT 'TIER_1_BASIC',
    
    -- Registration Metadata
    registration_channel    registration_channel NOT NULL DEFAULT 'CITIZEN_PORTAL',
    registered_by_officer   UUID REFERENCES officers(officer_id),
    
    -- Lifecycle
    is_deceased     BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_citizens_legacy_nrc ON citizens(legacy_nrc_number);
CREATE INDEX idx_citizens_dob ON citizens(date_of_birth);
CREATE INDEX idx_citizens_province ON citizens(province);
CREATE INDEX idx_citizens_kyc ON citizens(kyc_level);

-- =============================================================
-- 3. FAMILY LINEAGE (Parent-Child Relationships)
-- =============================================================
CREATE TABLE IF NOT EXISTS citizen_lineage (
    lineage_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_uci         CHAR(13) NOT NULL REFERENCES citizens(uci) ON DELETE CASCADE,
    parent_uci          CHAR(13) REFERENCES citizens(uci),
    relationship_type   VARCHAR(20) NOT NULL CHECK (relationship_type IN ('FATHER', 'MOTHER', 'GUARDIAN')),
    -- For orphans/wards of state where parents may be unknown
    guardian_nrc        VARCHAR(50),          -- Social worker / guardian NRC
    institution_name    VARCHAR(255),         -- e.g. Kasisi Children's Home
    verified            BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lineage_citizen ON citizen_lineage(citizen_uci);
CREATE INDEX idx_lineage_parent ON citizen_lineage(parent_uci);

-- =============================================================
-- 4. VITAL EVENTS — Civil Registration System (CRVS)
-- =============================================================
CREATE TABLE IF NOT EXISTS vital_events (
    event_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Subject
    citizen_uci     CHAR(13) REFERENCES citizens(uci),
    event_type      vital_event_type NOT NULL,
    event_status    vital_event_status DEFAULT 'PENDING',
    
    -- Subject Type (Key for Orphan/Ward support)
    subject_type    subject_type DEFAULT 'NORMAL_BIRTH',
    
    -- Event Details
    event_date      TIMESTAMP WITH TIME ZONE NOT NULL,
    event_location  VARCHAR(255),
    
    -- Birth-specific fields
    birth_location_type birth_location_type,
    facility_name       VARCHAR(255),       -- Hospital / clinic name or village
    mother_uci          CHAR(13) REFERENCES citizens(uci),
    father_uci          CHAR(13) REFERENCES citizens(uci),
    guardian_uci        CHAR(13) REFERENCES citizens(uci),  -- For orphans
    institution_name    VARCHAR(255),       -- Orphanage/children's home name
    
    -- Death-specific fields
    icd_11_code         VARCHAR(20),        -- ICD-11 Cause of Death code
    cause_of_death      TEXT,               -- Human-readable description
    certifying_doctor   VARCHAR(255),
    certifying_doctor_reg_no VARCHAR(50),   -- HPCZ registration number
    
    -- Registration Metadata
    registered_by_officer   UUID REFERENCES officers(officer_id),
    registration_channel    registration_channel DEFAULT 'HOSPITAL_CRVS',
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vital_events_type ON vital_events(event_type);
CREATE INDEX idx_vital_events_citizen ON vital_events(citizen_uci);
CREATE INDEX idx_vital_events_status ON vital_events(event_status);
CREATE INDEX idx_vital_events_date ON vital_events(event_date);

-- =============================================================
-- 5. DIGITAL CERTIFICATES (Birth, Death, National ID)
-- =============================================================
CREATE TABLE IF NOT EXISTS digital_certificates (
    certificate_id      VARCHAR(20) PRIMARY KEY,  -- e.g. CRT-928374
    certificate_type    certificate_type NOT NULL,
    citizen_uci         CHAR(13) REFERENCES citizens(uci),
    event_id            UUID REFERENCES vital_events(event_id),
    
    -- Certificate Data
    issued_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at          TIMESTAMP WITH TIME ZONE,
    issued_by_officer   UUID REFERENCES officers(officer_id),
    
    -- Cryptographic Integrity
    certificate_hash    TEXT NOT NULL,      -- SHA-256 of certificate contents
    ministry_signature  TEXT NOT NULL,      -- Digital signature by Ministry PKI
    
    -- Status
    is_revoked          BOOLEAN DEFAULT FALSE,
    revoke_reason       TEXT,
    revoked_at          TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_certificates_citizen ON digital_certificates(citizen_uci);
CREATE INDEX idx_certificates_type ON digital_certificates(certificate_type);

-- =============================================================
-- 6. KYC CONSENT MANAGEMENT
-- Tracks which agencies have been granted data-sharing consent
-- =============================================================
CREATE TABLE IF NOT EXISTS kyc_consent_logs (
    consent_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_uci         CHAR(13) NOT NULL REFERENCES citizens(uci),
    requesting_agency   VARCHAR(100) NOT NULL,    -- e.g. ZANACO_BANK, MTN_MOMO
    
    -- Consent scope granted
    fields_shared       TEXT[] NOT NULL,          -- e.g. ['first_name', 'dob', 'kyc_level']
    
    -- Token issued to the agency
    kyc_auth_token      TEXT NOT NULL,
    token_expires_at    TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    consent_given_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consent_revoked_at  TIMESTAMP WITH TIME ZONE,
    is_active           BOOLEAN DEFAULT TRUE,
    
    gsb_request_ip      INET                      -- IP of the agency making the request
);

CREATE INDEX idx_kyc_consent_citizen ON kyc_consent_logs(citizen_uci);
CREATE INDEX idx_kyc_consent_agency ON kyc_consent_logs(requesting_agency);

-- =============================================================
-- 7. GSB TRANSACTION ORCHESTRATION LOG
-- Records every financial transaction routed through the GSB
-- =============================================================
CREATE TABLE IF NOT EXISTS gsb_transactions (
    transaction_id      VARCHAR(20) PRIMARY KEY,  -- e.g. TXN-A1B2C3D4
    citizen_uci         CHAR(13) REFERENCES citizens(uci),
    
    -- Payment Details
    network             payment_network NOT NULL,
    amount              NUMERIC(15, 2) NOT NULL,
    currency            CHAR(3) DEFAULT 'ZMW',
    transaction_type    VARCHAR(100) NOT NULL,     -- e.g. SUBSIDY_PAYMENT, FEE_COLLECTION
    
    -- ISO Messaging
    iso_message_type    VARCHAR(10),               -- e.g. '0200' for ISO 8583
    iso_payload         TEXT,                      -- Packed ISO message (for card networks)
    
    -- Status
    status              transaction_status DEFAULT 'PENDING',
    gateway_reference   UUID,                      -- Reference from the payment network
    failure_reason      TEXT,
    
    -- Timestamps
    initiated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_gsb_txn_citizen ON gsb_transactions(citizen_uci);
CREATE INDEX idx_gsb_txn_network ON gsb_transactions(network);
CREATE INDEX idx_gsb_txn_status ON gsb_transactions(status);
CREATE INDEX idx_gsb_txn_date ON gsb_transactions(initiated_at);

-- =============================================================
-- 8. NOTIFICATION DISPATCH LOG
-- Records every Email and SMS dispatched by the Notification Gateway
-- =============================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    notification_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_uci         CHAR(13) REFERENCES citizens(uci),
    
    -- Delivery
    notification_type   notification_type NOT NULL,
    recipient           VARCHAR(255) NOT NULL,    -- Email address or phone number
    subject             VARCHAR(255),             -- For emails
    message_body        TEXT NOT NULL,
    
    -- Status
    status              notification_status DEFAULT 'QUEUED',
    smtp_response       TEXT,
    failure_reason      TEXT,
    
    -- Timestamps
    queued_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at             TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_citizen ON notification_logs(citizen_uci);
CREATE INDEX idx_notifications_type ON notification_logs(notification_type);
CREATE INDEX idx_notifications_status ON notification_logs(status);

-- =============================================================
-- 9. SYSTEM AUDIT LOG
-- Immutable record of every sensitive action taken in the system
-- =============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name    VARCHAR(100) NOT NULL,         -- e.g. 'identity-service', 'gsb-gateway'
    action          VARCHAR(255) NOT NULL,         -- e.g. 'CITIZEN_ENROLLED', 'CERTIFICATE_ISSUED'
    actor_id        VARCHAR(255),                  -- Officer UUID or 'SYSTEM'
    actor_ip        INET,
    target_resource VARCHAR(255),                  -- The UCI or event_id affected
    outcome         VARCHAR(20) DEFAULT 'SUCCESS', -- 'SUCCESS' | 'FAILED'
    details         JSONB,                         -- Full request/response payload
    timestamp       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_service ON audit_logs(service_name);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_target ON audit_logs(target_resource);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- =============================================================
-- 10. SEED DATA — System bootstrap
-- =============================================================

-- Default System Admin Officer
INSERT INTO officers (employee_number, first_name, last_name, role, station, province, email, password_hash)
VALUES (
    'ZMB-ADMIN-0001',
    'System',
    'Administrator',
    'SYSTEM_ADMIN',
    'Ministry of Home Affairs HQ',
    'Lusaka',
    'admin@mha.gov.zm',
    -- Password: 'ZIDCRadmin@2026' (bcrypt hashed — change on first login)
    '$2b$12$X9dMjNjEH7MgFDJfGJwgmOiUhV4R6BmbIWqU8WaQuFf1AeKRFHm7a'
) ON CONFLICT DO NOTHING;

-- Audit the bootstrap event
INSERT INTO audit_logs (service_name, action, actor_id, target_resource, details)
VALUES (
    'db-init',
    'DATABASE_INITIALIZED',
    'SYSTEM',
    'ALL_TABLES',
    '{"version": "2.0.0", "schema": "ZIDCR Production", "inris_compliant": true}'
);
