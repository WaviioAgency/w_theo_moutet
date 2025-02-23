/*
  # Fix RLS Policies

  1. Changes
    - Fix user_profiles policies to allow:
      - New user registration
      - Profile access
      - Admin access
    - Simplify policy conditions to avoid recursion
    - Add insert policies for user creation

  2. Security
    - Maintain secure access control
    - Fix infinite recursion in admin policies
*/

-- Drop existing policies on user_profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON user_profiles;

-- Create new policies for user_profiles
CREATE POLICY "Enable insert for authentication" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for users" ON user_profiles
  FOR SELECT
  USING (
    auth.uid() = id OR
    role = 'admin'
  );

CREATE POLICY "Enable update for users" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Fix appointments policies
DROP POLICY IF EXISTS "Clients can read their own appointments" ON appointments;
DROP POLICY IF EXISTS "Admin can CRUD all appointments" ON appointments;

CREATE POLICY "Enable read access for appointments" ON appointments
  FOR SELECT
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable insert for appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable update for appointments" ON appointments
  FOR UPDATE
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fix weight_logs policies
DROP POLICY IF EXISTS "Clients can CRUD their own weight logs" ON weight_logs;
DROP POLICY IF EXISTS "Admin can read all weight logs" ON weight_logs;

CREATE POLICY "Enable read access for weight logs" ON weight_logs
  FOR SELECT
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable insert for weight logs" ON weight_logs
  FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Enable update for weight logs" ON weight_logs
  FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());