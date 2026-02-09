import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Clock,
  Eye,
  ChevronRight,
  Zap,
  CreditCard,
  Settings,
  Filter
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

// All articles from all categories
const allArticles = [
  // Getting Started
  { id: 'gs-1', title: 'Creating your Paymint account', category: 'Getting Started', categoryId: 'getting-started', readTime: '5 min', views: '8.2k' },
  { id: 'gs-2', title: 'Setting up your first establishment', category: 'Getting Started', categoryId: 'getting-started', readTime: '8 min', views: '6.5k' },
  { id: 'gs-3', title: 'Adding products and categories', category: 'Getting Started', categoryId: 'getting-started', readTime: '10 min', views: '5.8k' },
  { id: 'gs-4', title: 'Inviting team members', category: 'Getting Started', categoryId: 'getting-started', readTime: '6 min', views: '4.2k' },
  { id: 'gs-5', title: 'Connecting your first printer', category: 'Getting Started', categoryId: 'getting-started', readTime: '7 min', views: '3.9k' },
  { id: 'gs-6', title: 'Processing your first order', category: 'Getting Started', categoryId: 'getting-started', readTime: '5 min', views: '3.5k' },
  // Billing
  { id: 'bl-1', title: 'Understanding your subscription plan', category: 'Billing & Payments', categoryId: 'billing', readTime: '6 min', views: '4.5k' },
  { id: 'bl-2', title: 'Updating your payment method', category: 'Billing & Payments', categoryId: 'billing', readTime: '3 min', views: '3.8k' },
  { id: 'bl-3', title: 'Downloading invoices and receipts', category: 'Billing & Payments', categoryId: 'billing', readTime: '4 min', views: '3.2k' },
  { id: 'bl-4', title: 'Upgrading or downgrading your plan', category: 'Billing & Payments', categoryId: 'billing', readTime: '5 min', views: '2.9k' },
  // Technical
  { id: 'tc-1', title: 'Connecting a Bluetooth receipt printer', category: 'Technical Support', categoryId: 'technical', readTime: '8 min', views: '5.6k' },
  { id: 'tc-2', title: 'App crashes and freezes', category: 'Technical Support', categoryId: 'technical', readTime: '6 min', views: '4.8k' },
  { id: 'tc-3', title: 'Sync issues between devices', category: 'Technical Support', categoryId: 'technical', readTime: '7 min', views: '4.2k' },
  { id: 'tc-4', title: 'Offline mode not working', category: 'Technical Support', categoryId: 'technical', readTime: '5 min', views: '3.8k' },
  { id: 'tc-5', title: 'Cash drawer not opening', category: 'Technical Support', categoryId: 'technical', readTime: '6 min', views: '3.2k' },
  // Features
  { id: 'ft-1', title: 'Understanding sales reports', category: 'Features & How-To', categoryId: 'features', readTime: '12 min', views: '6.2k' },
  { id: 'ft-2', title: 'Setting up loyalty programs', category: 'Features & How-To', categoryId: 'features', readTime: '10 min', views: '5.4k' },
  { id: 'ft-3', title: 'Creating and managing discounts', category: 'Features & How-To', categoryId: 'features', readTime: '8 min', views: '4.8k' },
  { id: 'ft-4', title: 'Inventory management basics', category: 'Features & How-To', categoryId: 'features', readTime: '15 min', views: '4.2k' },
  { id: 'ft-5', title: 'Employee scheduling and shifts', category: 'Features & How-To', categoryId: 'features', readTime: '10 min', views: '3.8k' },
];

const categories = [
  { id: 'all', label: 'All Categories', icon: BookOpen },
  { id: 'getting-started', label: 'Getting Started', icon: Zap },
  { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
  { id: 'technical', label: 'Technical Support', icon: Settings },
  { id: 'features', label: 'Features & How-To', icon: BookOpen },
];

export const AllArticlesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'views' | 'recent'>('views');

  const filteredArticles = allArticles
    .filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || article.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'views') {
        return parseFloat(b.views) - parseFloat(a.views);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/support"
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-3xl font-black tracking-tight">All Articles</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium ml-11">
              Browse all {allArticles.length} help articles
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 sticky top-28">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        selectedCategory === category.id
                          ? 'bg-paymint-green text-black'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <category.icon size={16} />
                      <span className="text-left">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Search and Sort */}
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                    />
                  </div>

                  <button
                    onClick={() => setSortBy(sortBy === 'views' ? 'recent' : 'views')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                  >
                    <Filter size={16} />
                    Sort by: {sortBy === 'views' ? 'Most Popular' : 'Recent'}
                  </button>
                </div>
              </div>

              {/* Results count */}
              <p className="text-sm text-gray-500 mb-4">
                Showing {filteredArticles.length} articles
              </p>

              {/* Articles List */}
              <div className="space-y-3">
                {filteredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link
                      to={`/support/article/${article.id}`}
                      className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:border-paymint-green/30 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-paymint-green/10 rounded-lg flex items-center justify-center">
                          <BookOpen size={18} className="text-paymint-green" />
                        </div>
                        <div>
                          <h4 className="font-bold group-hover:text-paymint-green transition-colors">
                            {article.title}
                          </h4>
                          <span className="text-xs font-medium text-gray-400">{article.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {article.readTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={12} /> {article.views}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No articles found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Try adjusting your search or filters
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="text-paymint-green font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
