import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isAdminLogin?: boolean;
};

export function AuthModal({ isOpen, onClose, isAdminLogin = false }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateInputs = () => {
    if (!email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!password.trim()) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (!email.includes('@')) {
      setError('L\'email n\'est pas valide');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Email ou mot de passe incorrect');
        }
        throw signInError;
      }

      if (!data?.user) {
        throw new Error('Erreur de connexion');
      }

      // Vérifier le rôle de l'utilisateur si c'est une connexion admin
      if (isAdminLogin) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('Accès non autorisé - Connexion administrateur uniquement');
        }
      }

      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full relative">
        <button
          onClick={() => {
            onClose();
            resetForm();
          }}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          disabled={loading}
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white pr-8">
          {isAdminLogin ? 'Connexion Administration' : 'Se connecter'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setError('');
                setEmail(e.target.value);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-[#40E0D0] focus:ring focus:ring-[#40E0D0] focus:ring-opacity-50"
              required
              disabled={loading}
              placeholder={isAdminLogin ? 'admin@theomoutet.com' : 'votre@email.com'}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setError('');
                setPassword(e.target.value);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-[#40E0D0] focus:ring focus:ring-[#40E0D0] focus:ring-opacity-50"
              required
              disabled={loading}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full bg-[#40E0D0] text-white py-2 px-4 rounded-md hover:bg-[#3BC9BB] transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}