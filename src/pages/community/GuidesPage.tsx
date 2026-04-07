import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Clock,
  Star,
  ChevronRight,
  Play,
  FileText,
  Video,
  Zap,
  Settings,
  Users,
  BarChart3,
  Shield,
  X
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

interface Guide {
  id: number;
  title: string;
  description: string;
  category: string;
  type: 'article' | 'video' | 'tutorial';
  readTime: string;
  reads: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  featured: boolean;
}

const mockGuides: Guide[] = [
  {
    id: 1,
    title: 'Complete Setup Guide for New Users',
    description: 'Everything you need to know to get started with PayMint, from account creation to your first sale.',
    category: 'Getting Started',
    type: 'tutorial',
    readTime: '15 min',
    reads: '12.4k',
    difficulty: 'beginner',
    featured: true
  },
  {
    id: 2,
    title: 'Optimizing Your Menu Layout',
    description: 'Learn how to organize your menu for faster checkout and better customer experience.',
    category: 'Best Practices',
    type: 'article',
    readTime: '10 min',
    reads: '8.2k',
    difficulty: 'intermediate',
    featured: true
  },
  {
    id: 3,
    title: 'Understanding Sales Reports',
    description: 'A deep dive into all the reports available and how to use them to grow your business.',
    category: 'Reports',
    type: 'video',
    readTime: '12 min',
    reads: '6.8k',
    difficulty: 'beginner',
    featured: true
  },
  {
    id: 4,
    title: 'Employee Management Best Practices',
    description: 'Set up roles, permissions, and schedules for your team effectively.',
    category: 'Team',
    type: 'article',
    readTime: '8 min',
    reads: '5.1k',
    difficulty: 'intermediate',
    featured: false
  },
  {
    id: 5,
    title: 'Setting Up Receipt Printers',
    description: 'Step-by-step guide to connecting and configuring thermal receipt printers.',
    category: 'Hardware',
    type: 'tutorial',
    readTime: '7 min',
    reads: '4.5k',
    difficulty: 'beginner',
    featured: false
  },
  {
    id: 6,
    title: 'Advanced Inventory Management',
    description: 'Master inventory tracking, low stock alerts, and ingredient management.',
    category: 'Inventory',
    type: 'article',
    readTime: '20 min',
    reads: '3.2k',
    difficulty: 'advanced',
    featured: false
  },
  {
    id: 7,
    title: 'Loyalty Program Setup Guide',
    description: 'Create and manage customer loyalty programs that drive repeat business.',
    category: 'Marketing',
    type: 'video',
    readTime: '15 min',
    reads: '2.8k',
    difficulty: 'intermediate',
    featured: false
  },
  {
    id: 8,
    title: 'Security Best Practices',
    description: 'Keep your business data safe with these essential security tips.',
    category: 'Security',
    type: 'article',
    readTime: '10 min',
    reads: '2.1k',
    difficulty: 'beginner',
    featured: false
  }
];

export const GuidesPage = () => {
  const { t } = useTranslation();

  const categories = [
    { id: 'all', label: t('community.guides.all', 'All Guides'), icon: BookOpen, count: mockGuides.length },
    { id: 'getting-started', label: t('community.categories.getting_started', 'Getting Started'), icon: Zap, count: 1 },
    { id: 'best-practices', label: t('community.categories.best_practices', 'Best Practices'), icon: Star, count: 1 },
    { id: 'reports', label: t('community.categories.reports', 'Reports'), icon: BarChart3, count: 1 },
    { id: 'team', label: t('community.categories.team', 'Team'), icon: Users, count: 1 },
    { id: 'hardware', label: t('community.categories.hardware', 'Hardware'), icon: Settings, count: 1 },
    { id: 'security', label: t('community.categories.security', 'Security'), icon: Shield, count: 1 }
  ];

  const difficultyConfig = {
    beginner: { label: t('community.difficulty.beginner', 'Beginner'), color: 'text-paymint-green', bg: 'bg-paymint-green/10 dark:bg-paymint-green/' },
    intermediate: { label: t('community.difficulty.intermediate', 'Intermediate'), color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20' },
    advanced: { label: t('community.difficulty.advanced', 'Advanced'), color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20' }
  };

  const typeConfig = {
    article: { icon: FileText, label: t('community.types.article', 'Article') },
    video: { icon: Video, label: t('community.types.video', 'Video') },
    tutorial: { icon: Play, label: t('community.types.tutorial', 'Tutorial') }
  };

  const [guides] = useState<Guide[]>(mockGuides);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter guides based on search and filters
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
                           guide.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || guide.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Get featured guides
  const featuredGuides = guides.filter(guide => guide.featured);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/community"
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-3xl font-black tracking-tight">
                {t('community.guides.title', 'Guides & Tutorials')}
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium ml-11">
              {t('community.guides.subtitle', 'Learn everything about PayMint with our comprehensive guides')}
            </p>
          </div>

          {/* Featured Guides */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6">
              {t('community.guides.featured', 'Featured Guides')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredGuides.map((guide, index) => {
                const TypeIcon = typeConfig[guide.type].icon;
                const difficulty = difficultyConfig[guide.difficulty];

                return (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/community/guides/${guide.id}`}
                      className="block bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden hover:border-PayMint-green/30 hover:shadow-xl transition-all group h-full"
                    >
                      {/* Thumbnail */}
                      <div className="h-32 bg-gradient-to-br from-PayMint-green/20 to-blue-500/20 flex items-center justify-center relative">
                        <BookOpen size={48} className="text-PayMint-green/50" />
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-white/90 dark:bg-black/50 ${difficulty.color}`}>
                            {difficulty.label}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-white/90 dark:bg-black/50 text-gray-600">
                            <TypeIcon size={12} />
                            {typeConfig[guide.type].label}
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-2 group-hover:text-PayMint-green transition-colors">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                          {guide.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock size={14} /> {guide.readTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star size={14} /> {guide.reads}
                            </span>
                          </div>
                          <ChevronRight size={16} className="group-hover:text-PayMint-green group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 sticky top-28">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
                  {t('community.labels.categories', 'Categories')}
                </h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        selectedCategory === category.id
                          ? 'bg-PayMint-green text-black'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <category.icon size={16} />
                      <span className="flex-1 text-left">{category.label}</span>
                      <span className={`text-xs ${
                        selectedCategory === category.id ? 'text-black/60' : 'text-gray-400'
                      }`}>{category.count}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
                    {t('community.labels.difficulty', 'Difficulty')}
                  </h3>
                  <div className="space-y-1">
                    {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedDifficulty(level)}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-bold text-left transition-all ${
                          selectedDifficulty === level
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                      >
                        {level === 'all' ? t('community.difficulty.all', 'All Levels') : t(`community.difficulty.${level}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('community.guides.search_placeholder', 'Search guides...')}
                  className="w-full pl-12 pr-11 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-PayMint-green/50 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('common.clearSearch', 'Clear search')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <X size={12} strokeWidth={2.75} />
                  </button>
                )}
              </div>

              {/* Guides List */}
              <div className="space-y-4">
                {filteredGuides.map((guide, index) => {
                  const TypeIcon = typeConfig[guide.type].icon;
                  const difficulty = difficultyConfig[guide.difficulty];

                  return (
                    <motion.div
                      key={guide.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/community/guides/${guide.id}`}
                        className="flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 hover:border-PayMint-green/30 transition-all group"
                      >
                        <div className="w-14 h-14 bg-PayMint-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <TypeIcon size={24} className="text-PayMint-green" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-400">{guide.category}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${difficulty.bg} ${difficulty.color}`}>
                              {difficulty.label}
                            </span>
                          </div>
                          <h3 className="font-bold group-hover:text-PayMint-green transition-colors truncate">
                            {guide.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {guide.description}
                          </p>
                        </div>

                        <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {guide.readTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star size={14} /> {guide.reads}
                          </span>
                        </div>

                        <ChevronRight size={20} className="text-gray-400 group-hover:text-PayMint-green group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {filteredGuides.length === 0 && (
                <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {searchQuery.trim() ? t('common.noResults') : t('community.guides.empty_title', 'No guides found')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery.trim() ? t('common.noMatchingResults', { entity: 'guides', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('community.guides.empty_subtitle', 'Try adjusting your search or filters')}
                  </p>
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
