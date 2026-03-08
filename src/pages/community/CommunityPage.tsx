import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Lightbulb,
  BookOpen,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  Search,
  Flame,
  Clock,
  Award,
  ChevronRight,
  Heart,
  MessageSquare,
  X
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const CommunityPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const featuredDiscussions = [
    {
      id: 1,
      title: t('community.discussions.featured_1.title', 'Best practices for managing multiple locations'),
      author: 'Michael Chen',
      avatar: null,
      replies: 24,
      likes: 56,
      category: t('community.categories.tips', 'Tips & Tricks'),
      isHot: true
    },
    {
      id: 2,
      title: t('community.discussions.featured_2.title', 'How we reduced checkout time by 40%'),
      author: 'Sarah Johnson',
      avatar: null,
      replies: 18,
      likes: 42,
      category: t('community.categories.success', 'Success Stories'),
      isHot: true
    },
    {
      id: 3,
      title: t('community.discussions.featured_3.title', 'Integrating PayMint with our inventory system'),
      author: 'David Kim',
      avatar: null,
      replies: 12,
      likes: 28,
      category: t('community.categories.integrations', 'Integrations'),
      isHot: false
    }
  ];

  const topIdeas = [
    { id: 1, title: t('community.ideas.item_1.title', 'Dark mode for POS tablet app'), votes: 234, status: 'planned' },
    { id: 2, title: t('community.ideas.item_2.title', 'Multiple receipt printers per station'), votes: 189, status: 'in_progress' },
    { id: 3, title: t('community.ideas.item_3.title', 'Customer-facing display support'), votes: 156, status: 'under_review' }
  ];

  const popularGuides = [
    { id: 1, title: t('community.guides.item_1.title', 'Complete Setup Guide for New Users'), reads: '12.4k', time: '15 min' },
    { id: 2, title: t('community.guides.item_2.title', 'Optimizing Your Menu Layout'), reads: '8.2k', time: '10 min' },
    { id: 3, title: t('community.guides.item_3.title', 'Understanding Sales Reports'), reads: '6.8k', time: '12 min' },
    { id: 4, title: t('community.guides.item_4.title', 'Employee Management Best Practices'), reads: '5.1k', time: '8 min' }
  ];

  const communityStats = [
    { label: t('community.stats.members', 'Members'), value: '12.5k+', icon: Users },
    { label: t('community.stats.discussions', 'Discussions'), value: '3.2k', icon: MessageCircle },
    { label: t('community.stats.ideas', 'Ideas Submitted'), value: '890', icon: Lightbulb },
    { label: t('community.stats.guides', 'Guides'), value: '120+', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#050505] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-PayMint-green/10 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-8 md:px-16 lg:px-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-500 text-sm font-bold mb-6">
              <Users size={16} />
              {t('community.hub.title', 'Community Hub')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              {t('community.hub.hero.title_part1', 'Learn, Share,')}{' '}
              <span className="text-PayMint-green">{t('community.hub.hero.title_part2', 'Grow')}</span>{' '}
              {t('community.hub.hero.title_part3', 'Together')}
            </h1>

            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-10 max-w-xl mx-auto">
              {t('community.hub.hero.subtitle', 'Join thousands of business owners sharing tips, requesting features, and helping each other succeed.')}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('community.hub.search_placeholder', 'Search discussions, ideas, or guides...')}
                className="w-full pl-16 pr-14 py-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-PayMint-green/50 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all"
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
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-gray-100 dark:border-white/5">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {communityStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon size={24} className="text-PayMint-green" />
                </div>
                <p className="text-2xl md:text-3xl font-black">{stat.value}</p>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Sections */}
      <section className="py-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Discussions */}
            <Link
              to="/community/discussions"
              className="group bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-3xl p-8 hover:border-blue-500/40 transition-all"
            >
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 group-hover:text-blue-500 transition-colors">
                {t('community.discussions.title', 'Discussions')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t('community.discussions.description', 'Ask questions, share experiences, and connect with other PayMint users.')}
              </p>
              <div className="flex items-center gap-2 text-blue-500 font-bold">
                {t('community.discussions.browse', 'Browse Discussions')}{' '}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Ideas */}
            <Link
              to="/community/ideas"
              className="group bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-3xl p-8 hover:border-yellow-500/40 transition-all"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                <Lightbulb size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 group-hover:text-yellow-500 transition-colors">
                {t('community.ideas.title', 'Feature Ideas')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t('community.ideas.description', 'Vote on feature requests and help shape the future of PayMint.')}
              </p>
              <div className="flex items-center gap-2 text-yellow-600 font-bold">
                {t('community.ideas.explore', 'Explore Ideas')}{' '}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Guides */}
            <Link
              to="/community/guides"
              className="group bg-gradient-to-br from-PayMint-green/10 to-emerald-500/5 border border-PayMint-green/20 rounded-3xl p-8 hover:border-PayMint-green/40 transition-all"
            >
              <div className="w-14 h-14 bg-PayMint-green rounded-2xl flex items-center justify-center text-black mb-6 group-hover:scale-110 transition-transform">
                <BookOpen size={28} />
              </div>
              <h3 className="text-2xl font-black mb-3 group-hover:text-PayMint-green transition-colors">
                {t('community.guides.title', 'Guides & Tutorials')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t('community.guides.description', 'Learn best practices and master every feature with our guides.')}
              </p>
              <div className="flex items-center gap-2 text-PayMint-green font-bold">
                {t('community.guides.start', 'Start Learning')}{' '}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Discussions */}
      <section className="py-20 bg-gray-50 dark:bg-white/[0.02]">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                {t('community.discussions.trending', 'Trending Discussions')}
              </h2>
              <p className="text-gray-500">{t('community.discussions.trending_subtitle', 'Popular conversations in the community')}</p>
            </div>
            <Link
              to="/community/discussions"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-all"
            >
              {t('common.viewAll', 'View All')} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredDiscussions.map((discussion, index) => (
              <motion.div
                key={discussion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/community/discussions/${discussion.id}`}
                  className="block bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:border-PayMint-green/30 hover:shadow-xl transition-all group h-full"
                >
                  {discussion.isHot && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-md text-xs font-bold mb-3">
                      <Flame size={12} />
                      {t('community.labels.hot', 'Hot')}
                    </div>
                  )}
                  <h3 className="font-bold text-lg mb-3 group-hover:text-PayMint-green transition-colors">
                    {discussion.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{discussion.category}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} /> {discussion.replies}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={14} /> {discussion.likes}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      {t('community.labels.by', 'by')} {discussion.author}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Ideas */}
      <section className="py-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                  {t('community.ideas.top', 'Top Feature Ideas')}
                </h2>
                <p className="text-gray-500">{t('community.ideas.top_subtitle', 'Vote to help prioritize what we build next')}</p>
              </div>
              <Link
                to="/community/ideas"
                className="text-sm font-bold text-PayMint-green hover:underline flex items-center gap-1"
              >
                {t('community.ideas.see_all', 'See all ideas')} <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {topIdeas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 hover:border-PayMint-green/30 transition-all"
                >
                  <div className="text-center">
                    <button className="w-12 h-12 bg-PayMint-green/10 hover:bg-PayMint-green/20 text-PayMint-green rounded-xl flex flex-col items-center justify-center transition-colors">
                      <TrendingUp size={16} />
                      <span className="text-xs font-black mt-0.5">{idea.votes}</span>
                    </button>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{idea.title}</h4>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${idea.status === 'planned' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' :
                        idea.status === 'in_progress' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600' :
                          'bg-gray-100 dark:bg-gray-500/20 text-gray-600'
                      }`}>
                      {idea.status === 'planned' ? t('community.status.planned', 'Planned') :
                        idea.status === 'in_progress' ? t('community.status.in_progress', 'In Progress') : t('community.status.under_review', 'Under Review')}
                    </span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Guides */}
      <section className="py-20 bg-gray-50 dark:bg-white/[0.02]">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                  {t('community.guides.popular', 'Popular Guides')}
                </h2>
                <p className="text-gray-500">{t('community.guides.popular_subtitle', 'Most-read tutorials from the community')}</p>
              </div>
              <Link
                to="/community/guides"
                className="text-sm font-bold text-PayMint-green hover:underline flex items-center gap-1"
              >
                {t('community.guides.browse_all', 'Browse all')} <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularGuides.map((guide, index) => (
                <motion.a
                  key={guide.id}
                  href="#"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 hover:border-PayMint-green/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-PayMint-green/10 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-PayMint-green" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold group-hover:text-PayMint-green transition-colors">
                      {guide.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Star size={12} /> {guide.reads} {t('community.labels.reads', 'reads')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {guide.time}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-PayMint-green group-hover:translate-x-1 transition-all" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-PayMint-green/20 rounded-full blur-[60px]" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Award size={32} />
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4">
                  {t('community.cta.title', 'Become a Community Champion')}
                </h2>
                <p className="text-white/80 font-medium mb-8 max-w-lg mx-auto">
                  {t('community.cta.subtitle', 'Help others, earn badges, and get early access to new features. Join the PayMint community today!')}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/community/discussions/new"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:opacity-90 transition-all"
                      >
                        <MessageCircle size={18} />
                        {t('community.discussions.new', 'Start a Discussion')}
                      </Link>
                      <Link
                        to="/community/ideas/new"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/20"
                      >
                        <Lightbulb size={18} />
                        {t('community.ideas.submit', 'Share an Idea')}
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          toast.error('Please log in to start a discussion', { icon: 'Ã°Å¸â€â€™' });
                          navigate('/login');
                        }}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:opacity-90 transition-all"
                      >
                        <MessageCircle size={18} />
                        {t('community.discussions.new', 'Start a Discussion')}
                      </button>
                      <button
                        onClick={() => {
                          toast.error('Please log in to share an idea', { icon: 'Ã°Å¸â€â€™' });
                          navigate('/login');
                        }}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/20"
                      >
                        <Lightbulb size={18} />
                        {t('community.ideas.submit', 'Share an Idea')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};