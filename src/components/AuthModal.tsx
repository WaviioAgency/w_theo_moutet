import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Email ou mot de passe incorrect');
        }
        throw signInError;
      }

      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message);
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
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Se connecter
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
              placeholder="votre@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <button
          onClick={() => {
            onClose();
            resetForm();
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          disabled={loading}
        >
          ✕
        </button>
      </div>
    </div>
  );
}