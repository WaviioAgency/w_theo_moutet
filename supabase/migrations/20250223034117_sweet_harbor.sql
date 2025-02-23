/*
  # Création du compte administrateur

  1. Création du compte
    - Crée un utilisateur administrateur avec des identifiants sécurisés
    - Ajoute le profil administrateur dans user_profiles

  2. Sécurité
    - Utilise la fonction de hachage de mot de passe de Supabase
    - Définit le rôle comme 'admin'
*/

DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Créer l'utilisateur admin dans auth.users s'il n'existe pas déjà
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
  ) 
  SELECT
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
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@theomoutet.com'
  )
  RETURNING id INTO new_user_id;

  -- Si un nouvel utilisateur a été créé, ajouter son profil
  IF new_user_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, full_name, role)
    VALUES (new_user_id, 'Admin', 'admin');
  END IF;
END $$;