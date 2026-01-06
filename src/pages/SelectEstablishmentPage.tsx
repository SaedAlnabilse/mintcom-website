import { motion } from 'framer-motion';
import { Store, Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export function SelectEstablishmentPage() {
  const { establishments, setCurrentEstablishment, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to onboarding if no establishments
  useEffect(() => {
    if (establishments.length === 0) {
      navigate('/onboarding');
    }
  }, [establishments, navigate]);

  const handleSelect = (est: any) => {
    setCurrentEstablishment(est);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl text-center"
      >
        <h1 className="text-3xl md:text-5xl font-medium text-white mb-8 md:mb-12 tracking-tight">
          Who's working today?
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {establishments.map((est) => (
            <motion.div
              key={est.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group cursor-pointer"
              onClick={() => handleSelect(est)}
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-md bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center mb-4 group-hover:ring-4 ring-white transition-all shadow-2xl relative overflow-hidden">
                 {/* Icon or Logo placeholder */}
                 <Store className="w-16 h-16 text-white opacity-80" />
                 
                 {/* Trial Badge */}
                 {est.subscriptionStatus === 'trial' && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full" title="Trial Active" />
                 )}
              </div>
              <h3 className="text-gray-400 group-hover:text-white text-lg md:text-xl font-medium transition-colors max-w-[160px] truncate mx-auto">
                {est.name}
              </h3>
            </motion.div>
          ))}

          {/* Add Profile Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group cursor-pointer"
            onClick={() => navigate('/onboarding')}
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-md bg-[#141414] border-2 border-gray-600 flex items-center justify-center mb-4 group-hover:border-white transition-all">
              <Plus className="w-16 h-16 text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-gray-400 group-hover:text-white text-lg md:text-xl font-medium transition-colors">
              Add Place
            </h3>
          </motion.div>
        </div>

        {/* Manage Button */}
        <div className="mt-16 md:mt-24">
          <button
            onClick={() => {
                // If they have access to at least one, go to dashboard establishments management
                // But we need to select one first to access dashboard? 
                // Actually, let's just use this as a logout or simple account settings trigger for now
                logout();
            }}
            className="inline-flex items-center gap-2 px-6 py-2 border border-gray-500 text-gray-500 hover:text-white hover:border-white uppercase tracking-widest text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.div>
    </div>
  );
}
