/*
  # Ajout de la table des factures

  1. Nouvelle Table
    - `invoices`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `amount` (decimal)
      - `status` (text)
      - `due_date` (date)
      - `file_url` (text)
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS
    - Policies pour les admins et les clients
*/

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('paid', 'pending', 'cancelled')) DEFAULT 'pending',
  due_date date NOT NULL,
  file_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policies pour les factures
CREATE POLICY "Enable read access for users" ON invoices
  FOR SELECT
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable insert for admins" ON invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable update for admins" ON invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable delete for admins" ON invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );