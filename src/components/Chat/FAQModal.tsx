import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, ChevronRight, HelpCircle, Package, CreditCard, Wrench, UserCircle, ClipboardList, Users } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FAQ_DATA } from '../../data/faq';
import type { FAQItem } from '../../data/faq';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FAQItem['category'] | 'all'>('all');
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Ignore clicks on the launcher switcher bar
        const isSwitcher = (event.target as Element).closest('#paymint-launcher-switcher');
        if (!isSwitcher) {
          onClose();
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const CATEGORY_CONFIG: Record<FAQItem['category'], { label: string; icon: React.ReactNode; color: string; activeChip: string }> = useMemo(() => ({
    general: { label: t('support.qa.categories.general'), icon: <HelpCircle size={14} />, color: 'text-blue-500 bg-blue-500/10', activeChip: 'bg-blue-500 text-white' },
    products: { label: t('support.qa.categories.products'), icon: <Package size={14} />, color: 'text-purple-500 bg-purple-500/10', activeChip: 'bg-purple-500 text-white' },
    orders: { label: t('support.qa.categories.orders'), icon: <ClipboardList size={14} />, color: 'text-orange-500 bg-orange-500/10', activeChip: 'bg-orange-500 text-white' },
    staff: { label: t('support.qa.categories.staff'), icon: <Users size={14} />, color: 'text-cyan-500 bg-cyan-500/10', activeChip: 'bg-cyan-500 text-white' },
    billing: { label: t('support.qa.categories.billing'), icon: <CreditCard size={14} />, color: 'text-paymint-green bg-paymint-green/', activeChip: 'bg-paymint-green text-white' },
    technical: { label: t('support.qa.categories.technical'), icon: <Wrench size={14} />, color: 'text-yellow-500 bg-yellow-500/10', activeChip: 'bg-yellow-500 text-white' },
    account: { label: t('support.qa.categories.account'), icon: <UserCircle size={14} />, color: 'text-pink-500 bg-pink-500/10', activeChip: 'bg-pink-500 text-white' },
  }), [t]);

  const filteredItems = useMemo(() => {
    return FAQ_DATA.filter(item => {
      const matchesSearch = search === '' ||
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase()) ||
        (item.questionAr && item.questionAr.includes(search)) ||
        (item.answerAr && item.answerAr.includes(search));
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(FAQ_DATA.map(item => item.category));
    return Array.from(cats);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`fixed bottom-[100px] ${isRTL ? 'left-[30px]' : 'right-[30px]'} z-[950] w-[400px] max-w-[calc(100vw-60px)] h-[600px] max-h-[calc(100vh-150px)] bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <HelpCircle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{t('support.qa.title')}</h3>
                <p className="text-white/80 text-xs font-medium">{t('support.qa.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-white/5">
            <div className="relative">
              <Search size={16} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
              <input maxLength={255}
                type="text"
                placeholder={t('support.qa.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-11' : 'pl-10 pr-11'} py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none transition-all`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label={t('common.clearSearch', 'Clear search')}
                  className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors`}
                >
                  <X size={12} strokeWidth={2.75} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {t('support.qa.categories.all')}
              </button>
              {categories.map((category) => {
                const config = CATEGORY_CONFIG[category];
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedCategory === category
                        ? `${config.activeChip} shadow-sm`
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {config.icon}
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{t('support.qa.noResults')}</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('support.qa.tryDifferent')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item, index) => {
                  const config = CATEGORY_CONFIG[item.category];
                  return (
                    <motion.div
                      id={`faq-item-${index}`}
                      key={index}
                      layout
                      className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02]"
                    >
                      <button
                        onClick={() => {
                          const isExpanding = expandedIndex !== index;
                          setExpandedIndex(isExpanding ? index : null);
                          
                          if (isExpanding) {
                            setTimeout(() => {
                              const el = document.getElementById(`faq-item-${index}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }
                            }, 250);
                          }
                        }}
                        className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                          expandedIndex === index
                            ? 'bg-gray-50 dark:bg-white/5'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className={`flex-shrink-0 p-1.5 rounded-lg ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block">
                            {isRTL && item.questionAr ? item.questionAr : item.question}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color.split(' ')[0]}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex-shrink-0 mt-0.5">
                          {expandedIndex === index
                            ? <ChevronDown size={16} className="text-gray-400" />
                            : <ChevronRight size={16} className={`text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                          }
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedIndex === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-0">
                              <div className={`p-3 bg-gray-50 dark:bg-white/[0.03] rounded-lg ${isRTL ? 'border-r-2' : 'border-l-2'} border-indigo-500`}>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {isRTL && item.answerAr ? item.answerAr : item.answer}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5">
            <p className="text-center text-xs text-gray-400">
              {t('support.qa.needMoreHelp')}{' '}
              <a href="mailto:support@paymint.io" className="text-indigo-500 font-medium hover:underline">
                support@paymint.io
              </a>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


