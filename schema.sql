-- EdTech CRM & Inquiry System - database schema (Supabase / PostgreSQL)
-- Run this in the Supabase SQL Editor (or via psql) once.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admins -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Inquiries ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type  VARCHAR(20)  NOT NULL CHECK (user_type IN ('Parent', 'Student', 'School')),
  category   VARCHAR(30)  NOT NULL CHECK (category IN ('Scholarship', 'Concert', 'Admission', 'General Query')),
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  phone      VARCHAR(20)  NOT NULL,
  message    TEXT         NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Resolved')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_category   ON inquiries (category);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_type  ON inquiries (user_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);

-- The backend connects with the database connection string (service role /
-- postgres user), so lock the tables away from the public Supabase REST API.
ALTER TABLE admins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
