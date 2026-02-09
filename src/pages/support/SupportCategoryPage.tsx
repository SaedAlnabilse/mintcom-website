import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Clock,
  ChevronRight,
  Zap,
  CreditCard,
  Settings,
  HelpCircle,
  Star,
  Eye
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

// Category configuration
const categoryConfig: Record<string, {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  'getting-started': {
    title: 'Getting Started',
    description: 'New to Paymint? Learn the basics and set up your account.',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500'
  },
  'billing': {
    title: 'Billing & Payments',
    description: 'Manage subscriptions, invoices, and payment methods.',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500'
  },
  'technical': {
    title: 'Technical Support',
    description: 'Troubleshoot issues with hardware, software, and integrations.',
    icon: Settings,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500'
  },
  'features': {
    title: 'Features & How-To',
    description: 'Deep dive into features, tips, and best practices.',
    icon: BookOpen,
    color: 'text-green-600',
    bgColor: 'bg-paymint-green'
  }
};

// Articles data by category
const articlesByCategory: Record<string, Array<{
  id: string;
  title: string;
  excerpt: string;
  readTime: string;
  views: string;
  featured?: boolean;
}>> = {
  'getting-started': [
    {
      id: 'gs-1',
      title: 'Creating your Paymint account',
      excerpt: 'Step-by-step guide to creating and verifying your Paymint business account.',
      readTime: '5 min',
      views: '8.2k',
      featured: true
    },
    {
      id: 'gs-2',
      title: 'Setting up your first establishment',
      excerpt: 'Learn how to configure your business location, hours, and basic settings.',
      readTime: '8 min',
      views: '6.5k',
      featured: true
    },
    {
      id: 'gs-3',
      title: 'Adding products and categories',
      excerpt: 'Organize your menu with categories and add your first products.',
      readTime: '10 min',
      views: '5.8k'
    },
    {
      id: 'gs-4',
      title: 'Inviting team members',
      excerpt: 'Add employees and assign roles with appropriate permissions.',
      readTime: '6 min',
      views: '4.2k'
    },
    {
      id: 'gs-5',
      title: 'Connecting your first printer',
      excerpt: 'How to set up and connect a receipt printer to your tablet.',
      readTime: '7 min',
      views: '3.9k'
    },
    {
      id: 'gs-6',
      title: 'Processing your first order',
      excerpt: 'Walk through taking an order, applying discounts, and completing payment.',
      readTime: '5 min',
      views: '3.5k'
    },
    {
      id: 'gs-7',
      title: 'Understanding the dashboard',
      excerpt: 'Navigate the web dashboard and find key metrics and reports.',
      readTime: '8 min',
      views: '3.1k'
    },
    {
      id: 'gs-8',
      title: 'Mobile app vs web dashboard',
      excerpt: 'Learn when to use the mobile app versus the web dashboard.',
      readTime: '4 min',
      views: '2.8k'
    }
  ],
  'billing': [
    {
      id: 'bl-1',
      title: 'Understanding your subscription plan',
      excerpt: 'Compare plan features and understand what\'s included in each tier.',
      readTime: '6 min',
      views: '4.5k',
      featured: true
    },
    {
      id: 'bl-2',
      title: 'Updating your payment method',
      excerpt: 'How to add, remove, or change your payment card on file.',
      readTime: '3 min',
      views: '3.8k',
      featured: true
    },
    {
      id: 'bl-3',
      title: 'Downloading invoices and receipts',
      excerpt: 'Access and download your billing history and invoices.',
      readTime: '4 min',
      views: '3.2k'
    },
    {
      id: 'bl-4',
      title: 'Upgrading or downgrading your plan',
      excerpt: 'Step-by-step guide to changing your subscription tier.',
      readTime: '5 min',
      views: '2.9k'
    },
    {
      id: 'bl-5',
      title: 'Canceling your subscription',
      excerpt: 'How to cancel and what happens to your data.',
      readTime: '4 min',
      views: '2.1k'
    },
    {
      id: 'bl-6',
      title: 'Understanding pro-rated charges',
      excerpt: 'How billing works when you upgrade mid-cycle.',
      readTime: '3 min',
      views: '1.8k'
    },
    {
      id: 'bl-7',
      title: 'Failed payment troubleshooting',
      excerpt: 'What to do if your payment fails and how to resolve it.',
      readTime: '5 min',
      views: '1.5k'
    },
    {
      id: 'bl-8',
      title: 'Requesting a refund',
      excerpt: 'Our refund policy and how to request one if eligible.',
      readTime: '4 min',
      views: '1.2k'
    }
  ],
  'technical': [
    {
      id: 'tc-1',
      title: 'Connecting a Bluetooth receipt printer',
      excerpt: 'Troubleshoot Bluetooth pairing issues with thermal printers.',
      readTime: '8 min',
      views: '5.6k',
      featured: true
    },
    {
      id: 'tc-2',
      title: 'App crashes and freezes',
      excerpt: 'Common causes and solutions for app stability issues.',
      readTime: '6 min',
      views: '4.8k',
      featured: true
    },
    {
      id: 'tc-3',
      title: 'Sync issues between devices',
      excerpt: 'Resolve data synchronization problems across multiple tablets.',
      readTime: '7 min',
      views: '4.2k'
    },
    {
      id: 'tc-4',
      title: 'Offline mode not working',
      excerpt: 'Ensure offline mode is properly configured and functioning.',
      readTime: '5 min',
      views: '3.8k'
    },
    {
      id: 'tc-5',
      title: 'Cash drawer not opening',
      excerpt: 'Troubleshoot cash drawer connectivity and trigger issues.',
      readTime: '6 min',
      views: '3.2k'
    },
    {
      id: 'tc-6',
      title: 'Barcode scanner setup',
      excerpt: 'Configure USB and Bluetooth barcode scanners.',
      readTime: '7 min',
      views: '2.9k'
    },
    {
      id: 'tc-7',
      title: 'Network and connectivity issues',
      excerpt: 'Diagnose Wi-Fi and internet connection problems.',
      readTime: '8 min',
      views: '2.5k'
    },
    {
      id: 'tc-8',
      title: 'Updating the Paymint app',
      excerpt: 'How to update and what to do if updates fail.',
      readTime: '4 min',
      views: '2.1k'
    },
    {
      id: 'tc-9',
      title: 'Clearing cache and data',
      excerpt: 'When and how to clear app cache to resolve issues.',
      readTime: '5 min',
      views: '1.9k'
    },
    {
      id: 'tc-10',
      title: 'Kitchen display system setup',
      excerpt: 'Configure a secondary display for kitchen orders.',
      readTime: '10 min',
      views: '1.6k'
    }
  ],
  'features': [
    {
      id: 'ft-1',
      title: 'Understanding sales reports',
      excerpt: 'Deep dive into all available reports and what they tell you.',
      readTime: '12 min',
      views: '6.2k',
      featured: true
    },
    {
      id: 'ft-2',
      title: 'Setting up loyalty programs',
      excerpt: 'Create points-based or stamp-based customer loyalty programs.',
      readTime: '10 min',
      views: '5.4k',
      featured: true
    },
    {
      id: 'ft-3',
      title: 'Creating and managing discounts',
      excerpt: 'Set up percentage, fixed amount, and conditional discounts.',
      readTime: '8 min',
      views: '4.8k'
    },
    {
      id: 'ft-4',
      title: 'Inventory management basics',
      excerpt: 'Track stock levels and set up low-stock alerts.',
      readTime: '15 min',
      views: '4.2k'
    },
    {
      id: 'ft-5',
      title: 'Employee scheduling and shifts',
      excerpt: 'Manage work schedules and track shift hours.',
      readTime: '10 min',
      views: '3.8k'
    },
    {
      id: 'ft-6',
      title: 'Customer database management',
      excerpt: 'Store customer information and purchase history.',
      readTime: '7 min',
      views: '3.2k'
    },
    {
      id: 'ft-7',
      title: 'Multi-location management',
      excerpt: 'Manage multiple establishments from one account.',
      readTime: '12 min',
      views: '2.9k'
    },
    {
      id: 'ft-8',
      title: 'Custom receipt templates',
      excerpt: 'Personalize receipts with your logo and messages.',
      readTime: '6 min',
      views: '2.5k'
    },
    {
      id: 'ft-9',
      title: 'Product modifiers and add-ons',
      excerpt: 'Set up customization options for menu items.',
      readTime: '8 min',
      views: '2.2k'
    },
    {
      id: 'ft-10',
      title: 'Exporting data to Excel',
      excerpt: 'Export reports and data for external analysis.',
      readTime: '5 min',
      views: '1.9k'
    }
  ]
};

export const SupportCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const category = categoryId ? categoryConfig[categoryId] : null;
  const articles = categoryId ? articlesByCategory[categoryId] || [] : [];

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticles = filteredArticles.filter(a => a.featured);
  const regularArticles = filteredArticles.filter(a => !a.featured);

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-8 md:px-16 lg:px-24 text-center">
            <h1 className="text-3xl font-black mb-4">Category Not Found</h1>
            <p className="text-gray-500 mb-8">The category you're looking for doesn't exist.</p>
            <Link to="/support" className="text-paymint-green font-bold hover:underline">
              ← Back to Help Center
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const CategoryIcon = category.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Link
                to="/support"
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center text-white`}>
                <CategoryIcon size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{category.title}</h1>
                <p className="text-gray-500 dark:text-gray-400">{category.description}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${category.title}...`}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
            />
          </div>

          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Star size={18} className="text-yellow-500" />
                Featured Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/support/article/${article.id}`}
                      className="block bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:border-paymint-green/30 hover:shadow-lg transition-all group h-full"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${category.bgColor}/10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <BookOpen size={20} className={category.color} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 group-hover:text-paymint-green transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {article.readTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye size={12} /> {article.views} views
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All Articles */}
          <div>
            <h2 className="text-lg font-bold mb-4">
              {searchQuery ? `Search Results (${filteredArticles.length})` : 'All Articles'}
            </h2>
            <div className="space-y-3">
              {regularArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/support/article/${article.id}`}
                    className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:border-paymint-green/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center">
                        <BookOpen size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-bold group-hover:text-paymint-green transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {article.excerpt}
                        </p>
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
                  <HelpCircle size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">No articles found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Try adjusting your search terms
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-paymint-green font-bold hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>

          {/* Help CTA */}
          <div className="mt-12 p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white/10 dark:to-white/5 rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-white">
                <h3 className="text-xl font-bold mb-1">Still need help?</h3>
                <p className="text-gray-400">Can't find what you're looking for? Contact our support team.</p>
              </div>
              <Link
                to="/support/tickets/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-paymint-green text-black rounded-xl font-bold hover:opacity-90 transition-all whitespace-nowrap"
              >
                Submit a Ticket
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
