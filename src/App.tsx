import React, { useState, useEffect } from 'react';
import { Dumbbell, ChevronRight, Star, Download, UserCircle, Phone } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { ThemeToggle } from './components/ThemeToggle';
import logo from './lib/theo_moutet_logotypes.png';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setShowDashboard(false); // Reset dashboard state on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      
      // Get the latest weight for the user
      const { data: weightData } = await supabase
        .from('weight_logs')
        .select('weight')
        .eq('client_id', user.id)
        .order('date', { ascending: false })
        .limit(1);

      // Record the session with the last weight
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert([
          {
            user_id: user.id,
            logout_time: new Date().toISOString(),
            last_weight: weightData?.[0]?.weight || null
          }
        ]);

      if (sessionError) {
        console.error('Error recording session:', sessionError);
      }

      // Perform the sign out
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Reset all states
      setShowDashboard(false);
      setUserProfile(null);
      setUser(null);
      
      // Force reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#caf0f8] dark:bg-[#03045e] transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-[#03045e] shadow-md fixed w-full z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">Théo Moutet</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowDashboard(!showDashboard)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition flex items-center space-x-2"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>{userProfile?.full_name || 'Mon compte'}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className={`text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition ${
                    isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-[#00b4d8] text-white px-6 py-2 rounded-full hover:bg-[#0096c7] transition"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {showDashboard && user ? (
          <div className="pt-20 container mx-auto px-4">
            {userProfile?.role === 'admin' ? <AdminDashboard /> : <ClientDashboard />}
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section id="hero" className="pt-32 pb-16 bg-gradient-to-br from-[#00b4d8] to-[#0096c7]">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="md:w-1/2 text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                      Transformez votre corps, transformez votre vie
                    </h1>
                    <p className="text-xl mb-8">
                      Découvrez les secrets pour prendre de la masse musculaire naturellement avec notre guide complet de nutrition
                    </p>
                    <button className="bg-white text-[#00b4d8] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition flex items-center">
                      Je veux progresser <ChevronRight className="ml-2" />
                    </button>
                  </div>
                  <div className="md:w-1/2 mt-8 md:mt-0">
                    <img 
                      src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                      alt="Coach sportif" 
                      className="rounded-lg shadow-xl"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section Appelez-moi */}
            <section id="contact" className="py-16 bg-white dark:bg-[#03045e]">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                    Prêt à commencer votre transformation ?
                  </h2>
                  <div className="bg-[#00b4d8] rounded-lg p-8 shadow-xl">
                    <div className="flex flex-col items-center space-y-4">
                      <Phone className="w-12 h-12 text-white" />
                      <p className="text-2xl font-bold text-white">Appelez-moi</p>
                      <a 
                        href="tel:0675243171"
                        className="text-3xl font-bold text-white hover:underline transition-all"
                      >
                        06 75 24 31 71
                      </a>
                      <p className="text-white text-lg">
                        Disponible du lundi au samedi de 8h à 20h
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Avant/Après Section */}
            <section className="py-16 bg-[#caf0f8] dark:bg-[#03045e]">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Transformations Réelles</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white dark:bg-[#03045e] rounded-lg overflow-hidden shadow-lg">
                      <div className="flex">
                        <div className="w-1/2">
                          <img 
                            src={`https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80`}
                            alt="Avant"
                            className="w-full h-64 object-cover"
                          />
                          <p className="text-center py-2 bg-gray-200 dark:bg-gray-600 font-semibold dark:text-white">AVANT</p>
                        </div>
                        <div className="w-1/2">
                          <img 
                            src={`https://images.unsplash.com/photo-1583454152045-e0c2ba7d8c81?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80`}
                            alt="Après"
                            className="w-full h-64 object-cover"
                          />
                          <p className="text-center py-2 bg-[#00b4d8] text-white font-semibold">APRÈS</p>
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-600 dark:text-gray-300">
                          "J'ai suivi le programme pendant 12 semaines et les résultats sont incroyables. +8kg de masse musculaire !"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Témoignages */}
            <section className="py-16 bg-white dark:bg-[#03045e]">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Ce qu'en disent nos clients</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-[#03045e] p-6 rounded-lg shadow-lg">
                      <div className="flex items-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        "Le guide nutritionnel est complet et facile à suivre. Les recettes sont délicieuses et les résultats sont là !"
                      </p>
                      <div className="flex items-center">
                        <img
                          src={`https://images.unsplash.com/photo-1600486913747-55e5470d6f40?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80`}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div>
                          <p className="font-semibold dark:text-white">Thomas D.</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Client depuis 6 mois</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-[#00b4d8]">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center text-white">
                  <h2 className="text-3xl font-bold mb-6">
                    Prêt à transformer votre physique ?
                  </h2>
                  <p className="text-xl mb-8">
                    Obtenez notre guide complet de nutrition pour la prise de masse musculaire
                  </p>
                  <div className="bg-white dark:bg-[#03045e] rounded-lg p-8 shadow-xl">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                      Guide Nutrition & Masse Musculaire
                    </h3>
                    <ul className="text-left text-gray-600 dark:text-gray-300 mb-8">
                      <li className="flex items-center mb-3">
                        <Dumbbell className="w-5 h-5 mr-2 text-[#00b4d8]" />
                        Plans nutritionnels détaillés
                      </li>
                      <li className="flex items-center mb-3">
                        <Dumbbell className="w-5 h-5 mr-2 text-[#00b4d8]" />
                        100+ recettes riches en protéines
                      </li>
                      <li className="flex items-center mb-3">
                        <Dumbbell className="w-5 h-5 mr-2 text-[#00b4d8]" />
                        Guide des suppléments
                      </li>
                      <li className="flex items-center">
                        <Dumbbell className="w-5 h-5 mr-2 text-[#00b4d8]" />
                        Suivi des progrès
                      </li>
                    </ul>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mb-4">29,99€</p>
                      <button className="bg-[#00b4d8] text-white px-8 py-3 rounded-full font-bold hover:bg-[#0096c7] transition flex items-center justify-center mx-auto">
                        <Download className="mr-2" />
                        Télécharger maintenant
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#03045e] text-white py-8">
              <div className="container mx-auto px-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                  <span className="text-lg font-bold">Théo Moutet</span>
                </div>
                <p className="text-gray-400">© 2024 Théo Moutet. Tous droits réservés.</p>
              </div>
            </footer>
          </>
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default App;