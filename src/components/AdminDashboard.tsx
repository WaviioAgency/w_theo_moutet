import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useContext } from 'react';
import { ThemeContext } from '../lib/theme';

export function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [clients, setClients] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch appointments
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('*, user_profiles(full_name)')
      .order('date_time', { ascending: true });

    if (appointmentsData) {
      setAppointments(appointmentsData);
      
      // Calculate total revenue
      const totalRevenue = appointmentsData.reduce((sum: number, app: any) => sum + Number(app.price), 0);
      setRevenue(totalRevenue);

      // Calculate monthly revenue
      const monthlyData = appointmentsData.reduce((acc: any, app: any) => {
        const month = new Date(app.date_time).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        acc[month] = (acc[month] || 0) + Number(app.price);
        return acc;
      }, {});

      setMonthlyRevenue(Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount,
      })));
    }

    // Fetch clients
    const { data: clientsData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'client');

    if (clientsData) {
      setClients(clientsData);
    }

    // Fetch sessions
    const { data: sessionsData } = await supabase
      .from('user_sessions')
      .select(`
        *,
        user_profiles (
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (sessionsData) {
      setSessions(sessionsData);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Chiffre d'affaires total</h3>
          <p className="text-3xl font-bold text-[#40E0D0]">{revenue.toFixed(2)}€</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Nombre de clients</h3>
          <p className="text-3xl font-bold text-[#40E0D0]">{clients.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Séances réalisées</h3>
          <p className="text-3xl font-bold text-[#40E0D0]">
            {appointments.filter((app: any) => app.status === 'completed').length}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Chiffre d'affaires mensuel</h3>
        <div className="h-80">
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={currentTheme.gridColor}
                />
                <XAxis
                  dataKey="month"
                  stroke={currentTheme.textColor}
                  tick={{ fill: currentTheme.textColor }}
                />
                <YAxis
                  stroke={currentTheme.textColor}
                  tick={{ fill: currentTheme.textColor }}
                  unit="€"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: currentTheme.backgroundColor,
                    border: `1px solid ${currentTheme.gridColor}`,
                    color: currentTheme.textColor,
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}€`, 'Chiffre d\'affaires']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={currentTheme.lineColor}
                  name="Chiffre d'affaires"
                  strokeWidth={2}
                  dot={{ fill: currentTheme.lineColor }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              Aucune donnée de chiffre d'affaires
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Historique des sessions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date de fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dernier poids
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sessions.map((session: any) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {session.user_profiles?.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {new Date(session.logout_time).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {session.last_weight ? `${session.last_weight} kg` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Prochains rendez-vous</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Prix
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.map((appointment: any) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {appointment.user_profiles?.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {new Date(appointment.date_time).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    }`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {Number(appointment.price).toFixed(2)}€
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}