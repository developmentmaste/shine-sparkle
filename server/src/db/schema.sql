-- Run this once against your Postgres database, or via `npm run db:migrate`.

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  service_name TEXT NOT NULL,
  rate_per_sqm NUMERIC(10,2) NOT NULL,
  area_sqm NUMERIC(10,2) NOT NULL,
  estimated_price NUMERIC(10,2) NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new | contacted | booked | dismissed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at DESC);
