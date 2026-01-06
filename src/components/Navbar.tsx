import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav 
        className={`fixed w-full z-50 transition-all duration-500 ease-in-out ${
          isScrolled 
            ? 'bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 py-4' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="cursor-pointer"
          >
            <Logo size="md" />
          </motion.div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {['Features', 'Pricing', 'Contact'].map((item, i) => (
                <motion.a
                  key={item}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-paymint-green dark:hover:text-paymint-green transition-colors"
                >
                  {item}
                </motion.a>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />

            <div className="flex items-center gap-4">
              <motion.a
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                href="/login"
                className="text-sm font-medium text-gray-900 dark:text-white hover:text-paymint-green transition-colors"
              >
                Log In
              </motion.a>
              
              <ThemeToggle />
              
              <motion.a 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                href="/signup"
                className="bg-paymint-green text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-paymint-green/20 transition-all hover:-translate-y-0.5"
              >
                Get Started
              </motion.a>
            </div>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button 
              className="text-gray-900 dark:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl pt-24 px-6 md:hidden flex flex-col items-center"
          >
            <div className="flex flex-col items-center gap-8 w-full max-w-sm">
              {['Features', 'Pricing', 'Contact'].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="text-2xl font-medium text-gray-900 dark:text-white"
                >
                  {item}
                </a>
              ))}
              <div className="w-full h-px bg-gray-200 dark:bg-white/10" />
              <a href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-gray-600 dark:text-gray-400">Log In</a>
              <a 
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-paymint-green text-black px-8 py-4 rounded-xl font-bold text-lg w-full text-center shadow-lg shadow-paymint-green/20"
              >
                Get Started Free
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
