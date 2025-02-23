import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

type ProfilePageProps = {
  userProfile: any;
  onProfileUpdate: () => void;
};

export function ProfilePage({ userProfile, onProfileUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || '',
    birth_date: userProfile?.birth_date || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          birth_date: formData.birth_date,
        })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      // Mettre à jour l'email si nécessaire
      if (formData.email !== userProfile.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (emailError) throw emailError;
      }

      onProfileUpdate();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mon Profil</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#40E0D0] text-white px-4 py-2 rounded-md hover:bg-[#3BC9BB] transition"
            >
              Modifier
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-[#40E0D0] focus:ring focus:ring-[#40E0D0] focus:ring-opacity-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-[#40E0D0] focus:ring focus:ring-[#40E0D0] focus:ring-opacity-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-[#40E0D0] focus:ring focus:ring-[#40E0D0] focus:ring-opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-[#40E0D0] focus:ring focus:ring-[#40E0D0] focus:ring-opacity-50"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de naissance
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-[#40E0D0] focus:ring focus:ring-[#40E0D0] focus:ring-opacity-50"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className={`bg-[#40E0D0] text-white px-4 py-2 rounded-md hover:bg-[#3BC9BB] transition ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <User className="text-[#40E0D0] w-5 h-5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nom complet</p>
                <p className="text-gray-900 dark:text-white">{userProfile?.full_name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Mail className="text-[#40E0D0] w-5 h-5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-white">{userProfile?.email}</p>
              </div>
            </div>

            {userProfile?.phone && (
              <div className="flex items-center space-x-4">
                <Phone className="text-[#40E0D0] w-5 h-5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                  <p className="text-gray-900 dark:text-white">{userProfile.phone}</p>
                </div>
              </div>
            )}

            {userProfile?.address && (
              <div className="flex items-start space-x-4">
                <MapPin className="text-[#40E0D0] w-5 h-5 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Adresse</p>
                  <p className="text-gray-900 dark:text-white">{userProfile.address}</p>
                </div>
              </div>
            )}

            {userProfile?.birth_date && (
              <div className="flex items-center space-x-4">
                <Calendar className="text-[#40E0D0] w-5 h-5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date de naissance</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(userProfile.birth_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}