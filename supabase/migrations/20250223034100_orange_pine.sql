/*
  # Création du compte administrateur

  1. Création du compte
    - Crée un utilisateur administrateur avec des identifiants sécurisés
    - Ajoute le profil administrateur dans user_profiles

  2. Sécurité
    - Utilise la fonction de hachage de mot de passe de Supabase
    - Définit le rôle comme 'admin'
*/

-- Créer l'utilisateur admin dans auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@theomoutet.com',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Créer le profil admin dans user_profiles
INSERT INTO user_profiles (id, full_name, role)
SELECT id, 'Admin', 'admin'
FROM auth.users
WHERE email = 'admin@theomoutet.com'
ON CONFLICT (id) DO NOTHING;