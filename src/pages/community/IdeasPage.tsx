import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Plus,
  TrendingUp,
  ChevronUp,
  Clock,
  CheckCircle2,
  MessageSquare,
  Lightbulb,
  Zap,
  Rocket,
  Eye,
  X
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

type IdeaStatus = 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';

interface Idea {
  id: number;
  title: string;
  description: string;
  author: string;
  votes: number;
  comments: number;
  status: IdeaStatus;
  category: string;
  createdAt: string;
  hasVoted: boolean;
}

export const IdeasPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const statusConfig: Record<IdeaStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    under_review: { label: t('community.status.under_review', 'Under Review'), color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-500/20', icon: Eye },
    planned: { label: t('community.status.planned', 'Planned'), color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: Clock },
    in_progress: { label: t('community.status.in_progress', 'In Progress'), color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: Zap },
    completed: { label: t('community.status.completed', 'Completed'), color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', icon: CheckCircle2 },
    declined: { label: t('community.status.declined', 'Declined'), color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', icon: Lightbulb }
  };

  const categories = [
    { id: 'all', label: t('community.ideas.all', 'All Ideas') },
    { id: 'features', label: t('community.categories.features', 'Features') },
    { id: 'ui-ux', label: t('community.categories.ui_ux', 'UI/UX') },
    { id: 'hardware', label: t('community.categories.hardware', 'Hardware') },
    { id: 'performance', label: t('community.categories.performance', 'Performance') },
    { id: 'integrations', label: t('community.categories.integrations', 'Integrations') }
  ];

  const statusFilters = [
    { id: 'all', label: t('community.status.all', 'All Status') },
    { id: 'under_review', label: t('community.status.under_review', 'Under Review') },
    { id: 'planned', label: t('community.status.planned', 'Planned') },
    { id: 'in_progress', label: t('community.status.in_progress', 'In Progress') },
    { id: 'completed', label: t('community.status.completed', 'Completed') }
  ];

  const mockIdeas: Idea[] = [
    {
      id: 1,
      title: t('community.ideas.item_1.title', 'Dark mode for POS tablet app'),
      description: t('community.ideas.item_1.description', 'Many users work in dim environments (bars, restaurants). A dark mode would reduce eye strain and look more professional.'),
      author: 'Alex Thompson',
      votes: 234,
      comments: 45,
      status: 'planned',
      category: 'UI/UX',
      createdAt: t('community.times.weeks_ago', '2 weeks ago', { count: 2 }),
      hasVoted: true
    },
    {
      id: 2,
      title: t('community.ideas.item_2.title', 'Multiple receipt printers per station'),
      description: t('community.ideas.item_2.description', 'Allow connecting multiple printers to a single tablet - one for customer receipts, one for kitchen orders.'),
      author: 'Maria Garcia',
      votes: 189,
      comments: 32,
      status: 'in_progress',
      category: 'Hardware',
      createdAt: t('community.times.months_ago', '1 month ago', { count: 1 }),
      hasVoted: false
    },
    {
      id: 3,
      title: t('community.ideas.item_3.title', 'Customer-facing display support'),
      description: t('community.ideas.item_3.description', 'Support for a secondary display showing order details and total to customers during checkout.'),
      author: 'John Smith',
      votes: 156,
      comments: 28,
      status: 'under_review',
      category: 'Hardware',
      createdAt: t('community.times.weeks_ago', '3 weeks ago', { count: 3 }),
      hasVoted: false
    },
    {
      id: 4,
      title: t('community.ideas.item_4.title', 'Offline mode improvements'),
      description: t('community.ideas.item_4.description', 'Better offline functionality - sync orders automatically when connection is restored.'),
      author: 'Emily Chen',
      votes: 142,
      comments: 21,
      status: 'planned',
      category: 'Performance',
      createdAt: t('community.times.months_ago', '1 month ago', { count: 1 }),
      hasVoted: true
    },
    {
      id: 5,
      title: t('community.ideas.item_5.title', 'Table management & reservations'),
      description: t('community.ideas.item_5.description', 'Built-in table layout editor and reservation system for restaurants.'),
      author: 'David Kim',
      votes: 128,
      comments: 38,
      status: 'under_review',
      category: 'Features',
      createdAt: t('community.times.months_ago', '2 months ago', { count: 2 }),
      hasVoted: false
    },
    {
      id: 6,
      title: t('community.ideas.item_6.title', 'QR code ordering for customers'),
      description: t('community.ideas.item_6.description', 'Let customers scan a QR code at their table to view menu and place orders from their phone.'),
      author: 'Sarah Johnson',
      votes: 115,
      comments: 25,
      status: 'completed',
      category: 'Features',
      createdAt: t('community.times.months_ago', '3 months ago', { count: 3 }),
      hasVoted: true
    }
  ];

  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('votes');

  const handleVote = (ideaId: number) => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote on ideas', { icon: 'Ã°Å¸â€â€™' });
      navigate('/login');
      return;
    }
    setIdeas(ideas.map(idea =>
      idea.id === ideaId
        ? { ...idea, votes: idea.hasVoted ? idea.votes - 1 : idea.votes + 1, hasVoted: !idea.hasVoted }
        : idea
    ));
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      idea.category.toLowerCase().replace('/', '-') === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || idea.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'votes') {
      return b.votes - a.votes;
    }
    return 0; // Keep original order for 'recent'
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  to="/community"
                  className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black tracking-tight">
                  {t('community.ideas.title', 'Feature Ideas')}
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium ml-11">
                {t('community.ideas.subtitle', 'Vote and help shape the future of PayMint')}
              </p>
            </div>

            {isAuthenticated ? (
              <Link
                to="/community/ideas/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-PayMint-green text-black rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-PayMint-green/20"
              >
                <Plus size={18} />
                {t('community.ideas.submit', 'Submit Idea')}
              </Link>
            ) : (
              <button
                onClick={() => {
                  toast.error('Please log in to submit a feature idea', { icon: 'Ã°Å¸â€â€™' });
                  navigate('/login');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
              >
                <Plus size={18} />
                {t('community.ideas.submit', 'Submit Idea')}
              </button>
            )}
          </div>

          {/* Stats middle part (keeping it as is) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Lightbulb size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-black">{ideas.length}</p>
                  <p className="text-xs font-medium text-gray-500">
                    {t('community.ideas.total', 'Total Ideas')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Clock size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-black">{ideas.filter(i => i.status === 'planned').length}</p>
                  <p className="text-xs font-medium text-gray-500">
                    {t('community.status.planned', 'Planned')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Rocket size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-xl font-black">{ideas.filter(i => i.status === 'in_progress').length}</p>
                  <p className="text-xs font-medium text-gray-500">
                    {t('community.status.in_progress', 'In Progress')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-black">{ideas.filter(i => i.status === 'completed').length}</p>
                  <p className="text-xs font-medium text-gray-500">
                    {t('community.status.completed', 'Completed')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and List */}
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('community.ideas.search_placeholder', 'Search ideas...')}
                  className="w-full pl-12 pr-11 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-PayMint-green/50 transition-all"
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

              <div className="flex gap-2 overflow-x-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-PayMint-green/50"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-PayMint-green/50"
                >
                  {statusFilters.map(status => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => setSortBy(sortBy === 'votes' ? 'recent' : 'votes')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                >
                  <TrendingUp size={16} />
                  {sortBy === 'votes' ? t('community.sort.top_voted', 'Top Voted') : t('community.sort.recent', 'Recent')}
                </button>
              </div>
            </div>
          </div>

          {/* Ideas List */}
          <div className="space-y-4">
            {filteredIdeas.map((idea, index) => {
              const status = statusConfig[idea.status];
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:border-PayMint-green/30 transition-all"
                >
                  <div className="flex gap-6">
                    {/* Vote Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleVote(idea.id)}
                        className={`w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${idea.hasVoted
                          ? 'bg-PayMint-green text-black'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-PayMint-green/20 hover:text-PayMint-green'
                          }`}
                      >
                        <ChevronUp size={24} />
                        <span className="text-lg font-black">{idea.votes}</span>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${status.bg} ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-md text-xs font-bold">
                          {idea.category}
                        </span>
                      </div>

                      <Link to={`/community/ideas/${idea.id}`}>
                        <h3 className="text-lg font-bold mb-2 hover:text-PayMint-green transition-colors cursor-pointer group-hover:text-PayMint-green">
                          {idea.title}
                        </h3>
                      </Link>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                        {idea.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="font-medium">
                          {t('community.labels.by', 'by')} {idea.author}
                        </span>
                        <span>{idea.createdAt}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} /> {idea.comments} {t('community.labels.comments', 'comments')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredIdeas.length === 0 && (
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lightbulb size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {searchQuery.trim() ? t('common.noResults') : t('community.ideas.empty_title', 'No ideas found')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery.trim() ? t('common.noMatchingResults', { entity: 'ideas', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('community.ideas.empty_subtitle', 'Try adjusting your search or filters')}
              </p>
              {isAuthenticated ? (
                <Link
                  to="/community/ideas/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-PayMint-green text-black rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  <Plus size={18} />
                  {t('community.ideas.submit_first', 'Submit the First Idea')}
                </Link>
              ) : (
                <button
                  onClick={() => {
                    toast.error('Please log in to submit a feature idea', { icon: 'Ã°Å¸â€â€™' });
                    navigate('/login');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
                >
                  <Plus size={18} />
                  {t('community.ideas.submit_first', 'Submit the First Idea')}
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
