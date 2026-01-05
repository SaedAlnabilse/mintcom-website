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
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 dark:bg-paymint-dark/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="cursor-pointer"
        >
          <Logo size="md" />
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-base font-medium text-gray-700 dark:text-white/80 hover:text-paymint-green transition-colors">Features</a>
          <a href="#pricing" className="text-base font-medium text-gray-700 dark:text-white/80 hover:text-paymint-green transition-colors">Pricing</a>
          <a href="#contact" className="text-base font-medium text-gray-700 dark:text-white/80 hover:text-paymint-green transition-colors">Contact</a>
          <a href="/login" className="text-base font-medium text-gray-700 dark:text-white/80 hover:text-paymint-green transition-colors">Owner Portal</a>
          <a href="/signup" className="text-base font-medium text-gray-700 dark:text-white/80 hover:text-paymint-green transition-colors">Sign Up</a>
          <ThemeToggle />
          <a 
            href="#contact"
            className="bg-paymint-green text-black px-6 py-2 rounded-none font-medium hover:bg-paymint-green/90 transition-colors hover:shadow-lg hover:shadow-paymint-green/20"
          >
            Book a Demo
          </a>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <button className="text-gray-900 dark:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-paymint-surface border-t border-gray-200 dark:border-white/10 absolute w-full shadow-lg"
          >
            <div className="flex flex-col p-6 gap-4">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 dark:text-white/80">Features</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 dark:text-white/80">Pricing</a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 dark:text-white/80">Contact</a>
              <a href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 dark:text-white/80">Owner Portal</a>
              <a href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 dark:text-white/80">Sign Up</a>
              <a 
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-paymint-green text-black px-6 py-3 rounded-none font-medium w-full shadow-md shadow-paymint-green/20 block text-center"
              >
                Book a Demo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
