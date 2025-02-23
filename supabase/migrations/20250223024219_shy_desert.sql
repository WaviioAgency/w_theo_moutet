/*
  # Initial Schema Setup

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text, either 'admin' or 'client')
      - `full_name` (text)
      - `created_at` (timestamp)
    
    - `appointments`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references user_profiles)
      - `date_time` (timestamp)
      - `status` (text)
      - `notes` (text)
      - `price` (decimal)
      - `created_at` (timestamp)
    
    - `weight_logs`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references user_profiles)
      - `weight` (decimal)
      - `date` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin and client access
*/

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES user_profiles ON DELETE CASCADE,
  date_time timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  notes text,
  price decimal(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

-- Create weight_logs table
CREATE TABLE weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES user_profiles ON DELETE CASCADE,
  weight decimal(5,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can read their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for appointments
CREATE POLICY "Clients can read their own appointments"
  ON appointments
  FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Admin can CRUD all appointments"
  ON appointments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for weight_logs
CREATE POLICY "Clients can CRUD their own weight logs"
  ON weight_logs
  FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY "Admin can read all weight logs"
  ON weight_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );