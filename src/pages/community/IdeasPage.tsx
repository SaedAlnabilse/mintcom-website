import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Eye
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

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

const mockIdeas: Idea[] = [
  {
    id: 1,
    title: 'Dark mode for POS tablet app',
    description: 'Many users work in dim environments (bars, restaurants). A dark mode would reduce eye strain and look more professional.',
    author: 'Alex Thompson',
    votes: 234,
    comments: 45,
    status: 'planned',
    category: 'UI/UX',
    createdAt: '2 weeks ago',
    hasVoted: true
  },
  {
    id: 2,
    title: 'Multiple receipt printers per station',
    description: 'Allow connecting multiple printers to a single tablet - one for customer receipts, one for kitchen orders.',
    author: 'Maria Garcia',
    votes: 189,
    comments: 32,
    status: 'in_progress',
    category: 'Hardware',
    createdAt: '1 month ago',
    hasVoted: false
  },
  {
    id: 3,
    title: 'Customer-facing display support',
    description: 'Support for a secondary display showing order details and total to customers during checkout.',
    author: 'John Smith',
    votes: 156,
    comments: 28,
    status: 'under_review',
    category: 'Hardware',
    createdAt: '3 weeks ago',
    hasVoted: false
  },
  {
    id: 4,
    title: 'Offline mode improvements',
    description: 'Better offline functionality - sync orders automatically when connection is restored.',
    author: 'Emily Chen',
    votes: 142,
    comments: 21,
    status: 'planned',
    category: 'Performance',
    createdAt: '1 month ago',
    hasVoted: true
  },
  {
    id: 5,
    title: 'Table management & reservations',
    description: 'Built-in table layout editor and reservation system for restaurants.',
    author: 'David Kim',
    votes: 128,
    comments: 38,
    status: 'under_review',
    category: 'Features',
    createdAt: '2 months ago',
    hasVoted: false
  },
  {
    id: 6,
    title: 'QR code ordering for customers',
    description: 'Let customers scan a QR code at their table to view menu and place orders from their phone.',
    author: 'Sarah Johnson',
    votes: 115,
    comments: 25,
    status: 'completed',
    category: 'Features',
    createdAt: '3 months ago',
    hasVoted: true
  }
];

const statusConfig: Record<IdeaStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  under_review: { label: 'Under Review', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-500/20', icon: Eye },
  planned: { label: 'Planned', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: Zap },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', icon: Lightbulb }
};

const categories = [
  { id: 'all', label: 'All Ideas' },
  { id: 'features', label: 'Features' },
  { id: 'ui-ux', label: 'UI/UX' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'performance', label: 'Performance' },
  { id: 'integrations', label: 'Integrations' }
];

const statusFilters = [
  { id: 'all', label: 'All Status' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' }
];

export const IdeasPage = () => {
  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');

  const handleVote = (ideaId: number) => {
    setIdeas(ideas.map(idea => {
      if (idea.id === ideaId) {
        return {
          ...idea,
          votes: idea.hasVoted ? idea.votes - 1 : idea.votes + 1,
          hasVoted: !idea.hasVoted
        };
      }
      return idea;
    }));
  };

  const filteredIdeas = ideas
    .filter(idea => {
      const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' ||
        idea.category.toLowerCase().replace('/', '-') === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || idea.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes;
      return 0; // Keep original order for recent
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
                <h1 className="text-3xl font-black tracking-tight">Feature Ideas</h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium ml-11">
                Vote and help shape the future of Paymint
              </p>
            </div>

            <Link
              to="/community/ideas/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-paymint-green text-black rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-paymint-green/20"
            >
              <Plus size={18} />
              Submit Idea
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Lightbulb size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-black">{ideas.length}</p>
                  <p className="text-xs font-medium text-gray-500">Total Ideas</p>
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
                  <p className="text-xs font-medium text-gray-500">Planned</p>
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
                  <p className="text-xs font-medium text-gray-500">In Progress</p>
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
                  <p className="text-xs font-medium text-gray-500">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ideas..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
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
                  {sortBy === 'votes' ? 'Top Voted' : 'Recent'}
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
                  className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:border-paymint-green/30 transition-all"
                >
                  <div className="flex gap-6">
                    {/* Vote Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleVote(idea.id)}
                        className={`w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                          idea.hasVoted
                            ? 'bg-paymint-green text-black'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-paymint-green/20 hover:text-paymint-green'
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

                      <h3 className="text-lg font-bold mb-2 hover:text-paymint-green transition-colors cursor-pointer">
                        {idea.title}
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {idea.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="font-medium">by {idea.author}</span>
                        <span>{idea.createdAt}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} /> {idea.comments} comments
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
              <h3 className="text-xl font-bold mb-2">No ideas found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Try adjusting your search or filters
              </p>
              <Link
                to="/community/ideas/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-paymint-green text-black rounded-xl font-bold hover:opacity-90 transition-all"
              >
                <Plus size={18} />
                Submit the First Idea
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
