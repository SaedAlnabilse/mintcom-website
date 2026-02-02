import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { FAQ_DATA } from '../../data/faq';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FAQModal({ isOpen, onClose }: FAQModalProps) {
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    return FAQ_DATA.filter(item => 
      item.question.toLowerCase().includes(search.toLowerCase()) || 
      item.answer.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-[100px] right-[30px] z-[999999] w-[380px] max-h-[600px] bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 bg-paymint-green/10 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-paymint-green text-black rounded-lg">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Help Center</h3>
                <p className="text-xs text-gray-500 font-medium">Common questions</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-paymint-green/20"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No results found.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item, index) => (
                  <div key={index} className="rounded-xl overflow-hidden border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all">
                    <button
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      className={`w-full flex items-center justify-between p-3 text-left transition-colors ${expandedIndex === index ? 'bg-gray-50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.question}</span>
                      {expandedIndex === index ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </button>
                    <AnimatePresence>
                      {expandedIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-gray-50/50 dark:bg-white/[0.02]"
                        >
                          <div className="p-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 text-center">
             <p className="text-xs text-gray-400">Can't find what you need? Try the AI Chat.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
