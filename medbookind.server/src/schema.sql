-- MedBookInd API schema (PostgreSQL 14+)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(100) NOT NULL,
  is_onboarded BOOLEAN DEFAULT false,
  practice_id UUID,
  location_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT,
  type TEXT,
  description TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS fk_users_practice;
ALTER TABLE users
  ADD CONSTRAINT fk_users_practice FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(100);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS fk_users_location;
ALTER TABLE users
  ADD CONSTRAINT fk_users_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS practice_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  plan_name TEXT,
  admin_primary_location_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment columns (safe for existing DBs created before Razorpay)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount_paise INTEGER;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_razorpay_order
  ON subscriptions(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS password_resets (
  email VARCHAR(255) PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_otps (
  channel TEXT NOT NULL CHECK (channel IN ('email', 'phone')),
  identifier TEXT NOT NULL,
  purpose TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel, identifier, purpose)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS tx_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tx_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES tx_category(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fee NUMERIC NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS tx_addon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  required BOOLEAN DEFAULT false,
  multiple BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_tx_category_practice ON tx_category(practice_id);
CREATE INDEX IF NOT EXISTS idx_tx_plan_practice ON tx_plan(practice_id);
CREATE INDEX IF NOT EXISTS idx_tx_addon_practice ON tx_addon(practice_id);

-- Clinical appointments & treatment records
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  appointment_type TEXT NOT NULL DEFAULT 'Consultation',
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  fee_paise INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  record_type TEXT NOT NULL DEFAULT 'visit'
    CHECK (record_type IN ('visit', 'lab', 'prescription', 'progress', 'note')),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_practice ON appointments(practice_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_patient ON treatment_records(patient_id);

-- Extended patient profile (consult / registration)
CREATE TABLE IF NOT EXISTS patient_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  middle_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  emergency_name TEXT,
  emergency_phone TEXT,
  emergency_relation TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_group_number TEXT,
  extra JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_practice ON patient_profiles(practice_id);

-- Practice-level configuration (patient / payment / appointment modules)
ALTER TABLE practices ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '[]';

ALTER TABLE locations ADD COLUMN IF NOT EXISTS address_config JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'in_progress', 'completed', 'follow_up')),
  chief_complaint TEXT,
  notes TEXT,
  follow_up_at TIMESTAMPTZ,
  follow_up_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_practice ON consultations(practice_id);
CREATE INDEX IF NOT EXISTS idx_consultations_appointment ON consultations(appointment_id);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'alert', 'announcement')),
  title TEXT NOT NULL,
  body TEXT,
  link_path TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_practice ON notifications(practice_id, created_at DESC);

CREATE TABLE IF NOT EXISTS practice_settings (
  practice_id UUID PRIMARY KEY REFERENCES practices(id) ON DELETE CASCADE,
  patient_config JSONB NOT NULL DEFAULT '{}',
  payment_config JSONB NOT NULL DEFAULT '{}',
  appointment_config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
