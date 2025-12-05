-- Doc Time Database Schema
-- Create all tables for Cloud SQL database
--
-- Database Credentials (hardcoded):
--   Username: doctime_user
--   Password: DoctimeCloud2024Secure
--   Database: doctime
--   Instance: doctime-db (IP: 34.27.171.24)
--
-- To run this file:
--   Option 1: Use run-migrations.sh script (recommended)
--     ./cloud/run-migrations.sh
--
--   Option 2: Direct psql command (replace HOST with actual IP):
--     psql "postgresql://doctime_user:DoctimeCloud2024Secure@34.27.171.24:5432/doctime?sslmode=require" -f create-tables.sql
--
--   Option 3: Using gcloud sql connect:
--     gcloud sql connect doctime-db --user=doctime_user --database=doctime
--     Then run: \i create-tables.sql

-- Enable UUID extension (if not already enabled)
-- Note: Cloud SQL PostgreSQL may already have this enabled
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION "uuid-ossp";
    END IF;
END $$;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "phoneNumber" VARCHAR(255) NOT NULL UNIQUE,
    "pinHash" VARCHAR(255),
    role VARCHAR(255) CHECK (role IN ('Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other')),
    "otherRole" VARCHAR(255),
    prefix VARCHAR(255) CHECK (prefix IN ('Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Prof.')),
    "preferredName" VARCHAR(255),
    "biometricEnabled" BOOLEAN DEFAULT false,
    "isVerified" BOOLEAN DEFAULT false,
    "lastLoginAt" TIMESTAMP,
    "pushToken" VARCHAR(255),
    "signupOTP" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "phoneNumber_format" CHECK ("phoneNumber" ~ '^254\d{9,10}$')
);

-- ============================================
-- FACILITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    "isSystemDefined" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- PAYERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    "isSystemDefined" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- PROCEDURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    "isSystemDefined" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE CHECK (name IN ('Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other')),
    "teamMemberNames" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(255) NOT NULL CHECK (role IN ('Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other')),
    "otherRole" VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(255),
    "isSystemDefined" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- CASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "dateOfProcedure" TIMESTAMP NOT NULL,
    "patientName" VARCHAR(255) NOT NULL,
    "inpatientNumber" VARCHAR(255),
    "patientAge" INTEGER,
    "facilityId" UUID REFERENCES facilities(id) ON DELETE SET NULL,
    "payerId" UUID REFERENCES payers(id) ON DELETE SET NULL,
    "invoiceNumber" VARCHAR(255),
    "procedureId" UUID REFERENCES procedures(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2),
    "paymentStatus" VARCHAR(255) DEFAULT 'Pending' CHECK ("paymentStatus" IN ('Pending', 'Paid', 'Partially Paid', 'Pro Bono', 'Cancelled')),
    "additionalNotes" TEXT,
    status VARCHAR(255) NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Completed', 'Cancelled', 'Referred', 'Invoiced', 'Paid')),
    "isReferred" BOOLEAN DEFAULT false,
    "referredToId" UUID REFERENCES users(id) ON DELETE SET NULL,
    "isAutoCompleted" BOOLEAN DEFAULT false,
    "completedAt" TIMESTAMP,
    "cancelledAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- CASE PROCEDURES TABLE (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS case_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "caseId" UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    "procedureId" UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE ("caseId", "procedureId")
);

-- ============================================
-- CASE TEAM MEMBERS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS case_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "caseId" UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    "teamMemberId" UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE ("caseId", "teamMemberId")
);

-- ============================================
-- REFERRALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "caseId" UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    "referrerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "refereeId" UUID REFERENCES users(id) ON DELETE SET NULL,
    "refereePhoneNumber" VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Declined')),
    "declinedAt" TIMESTAMP,
    "acceptedAt" TIMESTAMP,
    "smsSent" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    "entityType" VARCHAR(255),
    "entityId" UUID,
    description TEXT,
    metadata JSONB,
    "ipAddress" VARCHAR(255),
    "userAgent" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases("userId");
CREATE INDEX IF NOT EXISTS idx_cases_facility_id ON cases("facilityId");
CREATE INDEX IF NOT EXISTS idx_cases_payer_id ON cases("payerId");
CREATE INDEX IF NOT EXISTS idx_cases_procedure_id ON cases("procedureId");
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_date_of_procedure ON cases("dateOfProcedure");
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members("userId");
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_referrals_case_id ON referrals("caseId");
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals("referrerId");
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals("refereeId");
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs("userId");
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs("entityType", "entityId");
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs("createdAt");

