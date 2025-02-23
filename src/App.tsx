import React, { useState, useEffect } from 'react';
import { Dumbbell, ChevronRight, Star, Download, Phone, Book, ShoppingCart } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { ProfilePage } from './components/ProfilePage';
import { ThemeToggle } from './components/ThemeToggle';
import logo from './lib/theo_moutet_logotypes.png';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'profile'>('home');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        setUserProfile(null);
        setCurrentView('home');
        setIsLoggingOut(false);
      } else {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
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
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserProfile(userId);
        }
        throw error;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      setUserProfile(null);
      setCurrentView('home');
    }
  };

  const handleSignOut = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error during sign out:', error);
      alert('Une erreur est survenue lors de la déconnexion. Veuillez réessayer.');
      setIsLoggingOut(false);
    }
  };

  const renderContent = () => {
    if (!user || !userProfile) return null;

    switch (currentView) {
      case 'profile':
        return <ProfilePage userProfile={userProfile} onProfileUpdate={() => fetchUserProfile(user.id)} />;
      case 'dashboard':
        return userProfile?.role === 'admin' ? <AdminDashboard /> : <ClientDashboard />;
      default:
        return null;
    }
  };

  const testimonials = [
    {
      name: "Marie L.",
      text: "Grâce à Théo, j'ai perdu 15kg en 6 mois tout en me musclant. Son approche personnalisée a changé ma vie !",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
      name: "Thomas D.",
      text: "Un coach exceptionnel qui sait vous pousser à donner le meilleur. Résultats garantis !",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
      name: "Sophie M.",
      text: "Le suivi nutritionnel couplé aux séances d'entraînement, c'est la combinaison parfaite pour atteindre ses objectifs.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md fixed w-full z-50">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <div className="flex-1 flex justify-center">
            <img src={logo} alt="Théo Moutet" className="h-[200px] w-[200px] object-contain" />
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {!user && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-[#40E0D0] text-white px-6 py-2 rounded-full hover:bg-[#3BC9BB] transition"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="pt-[232px]">
        {currentView === 'home' ? (
          <>
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-12">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="md:w-1/2 mb-8 md:mb-0">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
                    Transformez votre corps, <br />
                    <span className="text-[#40E0D0]">transformez votre vie</span>
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    Coaching personnalisé, suivi nutritionnel et programmes d'entraînement adaptés à vos objectifs.
                  </p>
                  <a
                    href="tel:0675243171"
                    className="bg-[#40E0D0] text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-[#3BC9BB] transition flex items-center inline-flex"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    06 75 24 31 71
                  </a>
                </div>
                <div className="md:w-1/2">
                  <img
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=600&h=400"
                    alt="Transformation"
                    className="rounded-lg shadow-xl"
                  />
                </div>
              </div>
            </section>

            {/* About Me Section */}
            <section className="py-16 bg-white dark:bg-gray-800">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="md:w-1/2">
                    <img
                      src="https://images.unsplash.com/photo-1611672585731-fa10603fb9e0?auto=format&fit=crop&q=80&w=600&h=800"
                      alt="Théo Moutet Coach Sportif"
                      className="rounded-lg shadow-2xl"
                    />
                  </div>
                  <div className="md:w-1/2 space-y-6">
                    <h2 className="text-4xl font-bold text-gray-800 dark:text-white">
                      Qui suis-je ?
                    </h2>
                    <div className="space-y-4 text-gray-600 dark:text-gray-300">
                      <p>
                        Je suis Théo Moutet, coach sportif passionné et spécialiste en transformation physique. Avec plus de 5 ans d'expérience dans le domaine du fitness et de la nutrition, j'ai aidé des centaines de personnes à atteindre leurs objectifs.
                      </p>
                      <p>
                        Ma philosophie est simple : des résultats durables s'obtiennent par une approche équilibrée, combinant entraînement intelligent et nutrition adaptée. Je crois en la puissance des changements progressifs et en l'importance d'un accompagnement personnalisé.
                      </p>
                      <p>
                        Diplômé en coaching sportif et en nutrition, je continue constamment à me former pour vous offrir les meilleures stratégies et conseils basés sur les dernières recherches scientifiques.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                        <div className="text-[#40E0D0] font-bold text-3xl">500+</div>
                        <div className="text-gray-600 dark:text-gray-300">Clients satisfaits</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                        <div className="text-[#40E0D0] font-bold text-3xl">5+</div>
                        <div className="text-gray-600 dark:text-gray-300">Années d'expérience</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Services Section */}
            <section className="bg-white dark:bg-gray-800 py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
                  Mes services
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <Dumbbell className="w-12 h-12 text-[#40E0D0] mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      Programmes personnalisés
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Des programmes d'entraînement sur mesure adaptés à vos objectifs et votre niveau.
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <Download className="w-12 h-12 text-[#40E0D0] mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      Suivi nutritionnel
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Des conseils nutritionnels personnalisés pour optimiser vos résultats.
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <Star className="w-12 h-12 text-[#40E0D0] mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                      Coaching premium
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Un accompagnement complet pour atteindre vos objectifs plus rapidement.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Free Ebook Section */}
            <section className="py-16 bg-gradient-to-br from-[#40E0D0]/5 via-white dark:via-gray-900 to-[#40E0D0]/5">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="md:w-1/2">
                    <img
                      src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600&h=400"
                      alt="Guide nutritionnel gratuit"
                      className="rounded-lg shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-300"
                    />
                  </div>
                  <div className="md:w-1/2 space-y-6">
                    <div className="inline-block bg-[#40E0D0]/10 dark:bg-[#40E0D0]/20 px-4 py-2 rounded-full">
                      <span className="text-[#40E0D0] font-semibold">Guide Gratuit</span>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-800 dark:text-white">
                      Découvrez mon guide gratuit sur la nutrition et la prise de masse
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                      Commencez votre transformation dès aujourd'hui avec mon guide gratuit qui vous révèle les bases essentielles pour une prise de masse musculaire naturelle.
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-center text-gray-600 dark:text-gray-300">
                        <ChevronRight className="w-5 h-5 text-[#40E0D0] mr-2" />
                        Les fondamentaux de la nutrition
                      </li>
                      <li className="flex items-center text-gray-600 dark:text-gray-300">
                        <ChevronRight className="w-5 h-5 text-[#40E0D0] mr-2" />
                        Les erreurs à éviter
                      </li>
                      <li className="flex items-center text-gray-600 dark:text-gray-300">
                        <ChevronRight className="w-5 h-5 text-[#40E0D0] mr-2" />
                        3 recettes protéinées
                      </li>
                      <li className="flex items-center text-gray-600 dark:text-gray-300">
                        <ChevronRight className="w-5 h-5 text-[#40E0D0] mr-2" />
                        Programme débutant offert
                      </li>
                    </ul>
                    <div className="pt-4">
                      <a
                        href="#"
                        className="inline-flex items-center bg-[#40E0D0] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#3BC9BB] transition"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsAuthModalOpen(true);
                        }}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Télécharger gratuitement
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Ebook Section */}
            <section className="py-16 bg-gradient-to-r from-[#40E0D0]/10 to-[#40E0D0]/5">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="md:w-1/2">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-300">
                      <img
                        src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600&h=400"
                        alt="Ebook Nutrition et Musculation"
                        className="rounded-lg mb-6"
                      />
                      <Book className="w-12 h-12 text-[#40E0D0] mb-4" />
                      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        Guide Complet : Nutrition et Prise de Masse
                      </h2>
                      <div className="space-y-4 mb-6">
                        <p className="text-gray-600 dark:text-gray-300">
                          Découvrez tous mes secrets pour une prise de masse naturelle et efficace :
                        </p>
                        <ul className="space-y-2">
                          <li className="flex items-center text-gray-600 dark:text-gray-300">
                            <ChevronRight className="w-5 h-5 text-[#40E0D0] mr-2" />
                            Plans nutritionnels détaillés
                          </li>
                          <li className="flex items-center text-gray-600 dark:text-gray-300">
                            <ChevronRight className="w-5 h-5 text-[#40E0D0] mr-2" />
                            Calcul des macronutriments
                          </li>
                          <li className="flex items-center text-gray-600 dark:text-gray-300">
                            <ChevronRight className="w-5 h-5 text-[#40E0D0] mr-2" />
                            Timing des repas optimal
                          </li>
                          <li className="flex items-center text-gray-600 dark:text-gray-300">
                            <ChevronRight className="w-5 h-5 text-[#40E0D0] mr-2" />
                            Supplémentation naturelle
                          </li>
                        </ul>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-[#40E0D0]">29,99 €</div>
                        <a
                          href="https://buy.stripe.com/test_XXXXXXX"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#40E0D0] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#3BC9BB] transition flex items-center"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Acheter maintenant
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/2">
                    <h3 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
                      Transformez votre physique avec mon guide expert
                    </h3>
                    <div className="space-y-6">
                      <p className="text-lg text-gray-600 dark:text-gray-300">
                        Plus de 150 pages de contenu exclusif pour comprendre et maîtriser les principes d'une prise de masse réussie.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                          <div className="text-[#40E0D0] font-bold text-2xl mb-1">150+</div>
                          <div className="text-gray-600 dark:text-gray-300">Pages de contenu</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                          <div className="text-[#40E0D0] font-bold text-2xl mb-1">50+</div>
                          <div className="text-gray-600 dark:text-gray-300">Recettes healthy</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                          <div className="text-[#40E0D0] font-bold text-2xl mb-1">12</div>
                          <div className="text-gray-600 dark:text-gray-300">Programmes types</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                          <div className="text-[#40E0D0] font-bold text-2xl mb-1">24/7</div>
                          <div className="text-gray-600 dark:text-gray-300">Support email</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
                  Témoignages
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                      <div className="flex items-center mb-4">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full mr-4"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white">{testimonial.name}</h3>
                          <div className="flex text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            <Star className="w-4 h-4 fill-current" />
                            <Star className="w-4 h-4 fill-current" />
                            <Star className="w-4 h-4 fill-current" />
                            <Star className="w-4 h-4 fill-current" />
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">{testimonial.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="bg-[#40E0D0] py-16">
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Prêt à commencer votre transformation ?
                </h2>
                <p className="text-white text-lg mb-8">
                  Contactez-moi dès aujourd'hui pour atteindre vos objectifs fitness.
                </p>
                <a
                  href="tel:0675243171"
                  className="bg-white text-[#40E0D0] px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-100 transition inline-flex items-center"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  06 75 24 31 71
                </a>
              </div>
            </section>
          </>
        ) : (
          renderContent()
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default App;