/*
  # Ajout du suivi des déconnexions

  1. Nouvelles Tables
    - `user_sessions`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence à user_profiles)
      - `logout_time` (timestamp avec fuseau horaire)
      - `last_weight` (decimal, dernier poids enregistré)
      - `created_at` (timestamp avec fuseau horaire)

  2. Sécurité
    - Active RLS sur la table user_sessions
    - Ajoute des politiques pour la lecture et l'écriture
*/

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  logout_time timestamptz NOT NULL DEFAULT now(),
  last_weight decimal(5,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs d'insérer leurs propres sessions
CREATE POLICY "Users can insert their own sessions"
  ON user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre aux utilisateurs de lire leurs propres sessions
CREATE POLICY "Users can read their own sessions"
  ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique pour permettre aux admins de lire toutes les sessions
CREATE POLICY "Admins can read all sessions"
  ON user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );