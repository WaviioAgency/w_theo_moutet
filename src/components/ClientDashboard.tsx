import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { useContext } from 'react';
import { ThemeContext } from '../lib/theme';
import { TrendingUp, TrendingDown, Minus, Calendar, Scale, Target } from 'lucide-react';

export function ClientDashboard() {
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [appointments, setAppointments] = useState([]);
  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [weightStats, setWeightStats] = useState<{
    initial?: number;
    current?: number;
    difference?: number;
    trend?: 'up' | 'down' | 'stable';
    average?: number;
    min?: number;
    max?: number;
  }>({});

  useEffect(() => {
    const initializeData = async () => {
      await fetchClientData();
    };
    initializeData();
  }, []);

  const calculateWeightStats = (logs: any[]) => {
    if (logs.length === 0) return {};

    const weights = logs.map(log => log.weight);
    const initial = logs[0].weight;
    const current = logs[logs.length - 1].weight;
    const difference = current - initial;
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (difference > 0.1) trend = 'up';
    else if (difference < -0.1) trend = 'down';

    const average = weights.reduce((a, b) => a + b, 0) / weights.length;
    const min = Math.min(...weights);
    const max = Math.max(...weights);

    return { initial, current, difference, trend, average, min, max };
  };

  const fetchClientData = async () => {
    try {
      setIsInitializing(true);
      setError('');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!userProfile) throw new Error('Profil utilisateur non trouvé');

      const [weightResponse, appointmentsResponse] = await Promise.all([
        supabase
          .from('weight_logs')
          .select('*')
          .eq('client_id', user.id)
          .order('date', { ascending: true }),
        supabase
          .from('appointments')
          .select('*')
          .eq('client_id', user.id)
          .order('date_time', { ascending: true })
      ]);

      if (weightResponse.error) throw weightResponse.error;
      if (appointmentsResponse.error) throw appointmentsResponse.error;

      const processedWeightLogs = weightResponse.data?.map((log: any) => ({
        ...log,
        date: new Date(log.date).toLocaleDateString('fr-FR'),
        weight: parseFloat(log.weight)
      })) || [];

      setWeightLogs(processedWeightLogs);
      setWeightStats(calculateWeightStats(processedWeightLogs));
      setAppointments(appointmentsResponse.data || []);

    } catch (error: any) {
      console.error('Error fetching client data:', error);
      setError(error.message || 'Une erreur est survenue lors du chargement des données');
    } finally {
      setIsInitializing(false);
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('Veuillez vous reconnecter');

      const { error: insertError } = await supabase
        .from('weight_logs')
        .insert([
          {
            weight: parseFloat(newWeight),
            date: new Date().toISOString().split('T')[0],
            client_id: user.id
          },
        ]);

      if (insertError) throw insertError;

      setNewWeight('');
      await fetchClientData();
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'ajout du poids');
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
      areaColor: 'rgba(64, 224, 208, 0.1)',
    },
    dark: {
      backgroundColor: '#1f2937',
      textColor: '#f3f4f6',
      gridColor: '#374151',
      lineColor: '#40E0D0',
      areaColor: 'rgba(64, 224, 208, 0.1)',
    },
  };

  const currentTheme = chartTheme[theme];

  if (isInitializing) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
          <p className="text-red-800 dark:text-red-200">
            Une erreur est survenue : {error}
          </p>
          <button
            onClick={() => {
              setError('');
              fetchClientData();
            }}
            className="mt-2 text-red-600 dark:text-red-400 hover:underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Suivi du poids</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {weightLogs.length} mesures enregistrées
          </div>
        </div>
        
        {weightStats.initial !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar className="w-5 h-5 text-[#40E0D0] mr-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Évolution</p>
              </div>
              <div className="flex items-center">
                <p className="text-2xl font-bold mr-2" style={{
                  color: weightStats.trend === 'down' ? '#10B981' : 
                         weightStats.trend === 'up' ? '#EF4444' : 
                         '#6B7280'
                }}>
                  {weightStats.difference && weightStats.difference > 0 ? '+' : ''}
                  {weightStats.difference?.toFixed(1)} kg
                </p>
                {weightStats.trend === 'down' && <TrendingDown className="w-6 h-6 text-green-500" />}
                {weightStats.trend === 'up' && <TrendingUp className="w-6 h-6 text-red-500" />}
                {weightStats.trend === 'stable' && <Minus className="w-6 h-6 text-gray-500" />}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Scale className="w-5 h-5 text-[#40E0D0] mr-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Poids actuel</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weightStats.current?.toFixed(1)} kg
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Initial: {weightStats.initial?.toFixed(1)} kg
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 text-[#40E0D0] mr-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Statistiques</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Min:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {weightStats.min?.toFixed(1)} kg
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Max:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {weightStats.max?.toFixed(1)} kg
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Moyenne:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    {weightStats.average?.toFixed(1)} kg
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

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
              <AreaChart data={weightLogs}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentTheme.lineColor} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={currentTheme.lineColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={currentTheme.gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke={currentTheme.textColor}
                  tick={{ fill: currentTheme.textColor }}
                  tickLine={{ stroke: currentTheme.gridColor }}
                />
                <YAxis
                  domain={[
                    (dataMin: number) => Math.floor(dataMin - 1),
                    (dataMax: number) => Math.ceil(dataMax + 1)
                  ]}
                  stroke={currentTheme.textColor}
                  tick={{ fill: currentTheme.textColor }}
                  tickLine={{ stroke: currentTheme.gridColor }}
                  unit=" kg"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: currentTheme.backgroundColor,
                    border: `1px solid ${currentTheme.gridColor}`,
                    color: currentTheme.textColor,
                    borderRadius: '0.375rem',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Poids']}
                  labelStyle={{ color: currentTheme.textColor }}
                />
                <Legend />
                {weightLogs.length > 1 && (
                  <>
                    <ReferenceLine
                      y={weightStats.initial}
                      stroke="#9CA3AF"
                      strokeDasharray="3 3"
                      label={{
                        value: 'Initial',
                        fill: currentTheme.textColor,
                        position: 'right'
                      }}
                    />
                    <ReferenceLine
                      y={weightStats.average}
                      stroke="#6B7280"
                      strokeDasharray="3 3"
                      label={{
                        value: 'Moyenne',
                        fill: currentTheme.textColor,
                        position: 'left'
                      }}
                    />
                  </>
                )}
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke={currentTheme.lineColor}
                  fill="url(#weightGradient)"
                  name="Poids (kg)"
                  strokeWidth={2}
                  dot={{ fill: currentTheme.lineColor, r: 4 }}
                  activeDot={{ r: 6, fill: currentTheme.lineColor }}
                />
              </AreaChart>
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