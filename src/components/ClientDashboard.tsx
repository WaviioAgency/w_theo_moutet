import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useContext } from 'react';
import { ThemeContext } from '../lib/theme';

export function ClientDashboard() {
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [appointments, setAppointments] = useState([]);
  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: weightData } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('client_id', user.id)
      .order('date', { ascending: true });

    if (weightData) {
      setWeightLogs(weightData.map((log: any) => ({
        ...log,
        date: new Date(log.date).toLocaleDateString('fr-FR'),
        weight: parseFloat(log.weight)
      })));
    }

    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', user.id)
      .order('date_time', { ascending: true });

    if (appointmentsData) {
      setAppointments(appointmentsData);
    }
  };

  const validateWeight = (weight: string): boolean => {
    const value = parseFloat(weight);
    if (isNaN(value)) {
      setError('Le poids doit être un nombre valide');
      return false;
    }
    if (value <= 0) {
      setError('Le poids doit être supérieur à 0');
      return false;
    }
    if (value > 300) {
      setError('Le poids semble invalide (> 300kg)');
      return false;
    }
    return true;
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateWeight(newWeight)) {
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: insertError } = await supabase
        .from('weight_logs')
        .insert([
          {
            weight: parseFloat(newWeight),
            date: new Date().toISOString().split('T')[0],
            client_id: user.id
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      setNewWeight('');
      await fetchClientData();
    } catch (error: any) {
      setError(error.message);
      console.error('Error adding weight:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartTheme = {
    light: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      gridColor: '#e5e7eb',
      lineColor: '#40E0D0',
    },
    dark: {
      backgroundColor: '#1f2937',
      textColor: '#f3f4f6',
      gridColor: '#374151',
      lineColor: '#40E0D0',
    },
  };

  const currentTheme = chartTheme[theme];

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Suivi du poids</h3>
        <form onSubmit={handleWeightSubmit} className="mb-6">
          <div className="flex flex-col space-y-2">
            <div className="flex gap-4">
              <input
                type="number"
                step="0.1"
                min="0"
                max="300"
                value={newWeight}
                onChange={(e) => {
                  setError('');
                  setNewWeight(e.target.value);
                }}
                placeholder="Entrez votre poids (kg)"
                className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-[#40E0D0] focus:ring focus:ring-[#40E0D0] focus:ring-opacity-50"
                required
                disabled={loading}
              />
              <button
                type="submit"
                className={`bg-[#40E0D0] text-white px-4 py-2 rounded-md hover:bg-[#3BC9BB] transition ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
              >
                {loading ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </div>
        </form>
        <div className="h-80">
          {weightLogs.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightLogs}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={currentTheme.gridColor}
                />
                <XAxis
                  dataKey="date"
                  stroke={currentTheme.textColor}
                  tick={{ fill: currentTheme.textColor }}
                />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  stroke={currentTheme.textColor}
                  tick={{ fill: currentTheme.textColor }}
                  unit=" kg"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: currentTheme.backgroundColor,
                    border: `1px solid ${currentTheme.gridColor}`,
                    color: currentTheme.textColor,
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Poids']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke={currentTheme.lineColor}
                  name="Poids (kg)"
                  strokeWidth={2}
                  dot={{ fill: currentTheme.lineColor }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              Aucune donnée de poids enregistrée
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Mes prochains rendez-vous</h3>
        <div className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map((appointment: any) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between border-b dark:border-gray-700 pb-4"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(appointment.date_time).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(appointment.date_time).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  appointment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                }`}>
                  {appointment.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucun rendez-vous prévu</p>
          )}
        </div>
      </div>
    </div>
  );
}