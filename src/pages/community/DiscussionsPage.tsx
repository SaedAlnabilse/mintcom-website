import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Plus,
  MessageSquare,
  Heart,
  Eye,
  Clock,
  Flame,
  TrendingUp,
  CheckCircle2,
  User,
  ChevronRight
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

interface Discussion {
  id: number;
  title: string;
  excerpt: string;
  author: { name: string; avatar?: string; badge?: string };
  category: string;
  replies: number;
  likes: number;
  views: number;
  createdAt: string;
  isHot: boolean;
  isPinned: boolean;
  isSolved: boolean;
}

const mockDiscussions: Discussion[] = [
  {
    id: 1,
    title: 'Best practices for managing multiple locations',
    excerpt: 'I recently expanded to 3 locations and looking for tips on how to manage inventory and staff across all of them efficiently...',
    author: { name: 'Michael Chen', badge: 'Champion' },
    category: 'Tips & Tricks',
    replies: 24,
    likes: 56,
    views: 1240,
    createdAt: '2 hours ago',
    isHot: true,
    isPinned: true,
    isSolved: false
  },
  {
    id: 2,
    title: 'How we reduced checkout time by 40%',
    excerpt: 'After optimizing our menu layout and training staff on quick keys, we managed to significantly speed up our service...',
    author: { name: 'Sarah Johnson', badge: 'Pro User' },
    category: 'Success Stories',
    replies: 18,
    likes: 42,
    views: 890,
    createdAt: '5 hours ago',
    isHot: true,
    isPinned: false,
    isSolved: true
  },
  {
    id: 3,
    title: 'Integrating Paymint with our inventory system',
    excerpt: 'Has anyone successfully integrated Paymint with a third-party inventory management system? Looking for recommendations...',
    author: { name: 'David Kim' },
    category: 'Integrations',
    replies: 12,
    likes: 28,
    views: 456,
    createdAt: '1 day ago',
    isHot: false,
    isPinned: false,
    isSolved: false
  },
  {
    id: 4,
    title: 'Custom receipt templates - is it possible?',
    excerpt: 'I want to add our logo and customize the footer of our receipts. Is this possible with the current version?',
    author: { name: 'Emma Wilson' },
    category: 'Questions',
    replies: 8,
    likes: 15,
    views: 234,
    createdAt: '2 days ago',
    isHot: false,
    isPinned: false,
    isSolved: true
  },
  {
    id: 5,
    title: 'Setting up loyalty points for coffee shop',
    excerpt: 'Looking for advice on the best loyalty program setup for a coffee shop. Should I use points or stamps?',
    author: { name: 'James Brown' },
    category: 'Questions',
    replies: 15,
    likes: 22,
    views: 567,
    createdAt: '3 days ago',
    isHot: false,
    isPinned: false,
    isSolved: false
  }
];

const categories = [
  { id: 'all', label: 'All Topics', count: 156 },
  { id: 'questions', label: 'Questions', count: 78 },
  { id: 'tips', label: 'Tips & Tricks', count: 34 },
  { id: 'success', label: 'Success Stories', count: 22 },
  { id: 'integrations', label: 'Integrations', count: 12 },
  { id: 'announcements', label: 'Announcements', count: 10 }
];

const sortOptions = [
  { id: 'latest', label: 'Latest', icon: Clock },
  { id: 'popular', label: 'Most Popular', icon: TrendingUp },
  { id: 'trending', label: 'Trending', icon: Flame }
];

export const DiscussionsPage = () => {
  const [discussions] = useState<Discussion[]>(mockDiscussions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const filteredDiscussions = discussions.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      d.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
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
                <h1 className="text-3xl font-black tracking-tight">Discussions</h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium ml-11">
                Ask questions and share knowledge with the community
              </p>
            </div>

            <Link
              to="/community/discussions/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-paymint-green text-black rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-paymint-green/20"
            >
              <Plus size={18} />
              New Discussion
            </Link>
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        selectedCategory === category.id
                          ? 'bg-paymint-green text-black'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <span>{category.label}</span>
                      <span className={`text-xs ${
                        selectedCategory === category.id ? 'text-black/60' : 'text-gray-400'
                      }`}>{category.count}</span>
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
                      placeholder="Search discussions..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          sortBy === option.id
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                        }`}
                      >
                        <option.icon size={16} />
                        <span className="hidden md:inline">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Discussions List */}
              <div className="space-y-4">
                {filteredDiscussions.map((discussion, index) => (
                  <motion.div
                    key={discussion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/community/discussions/${discussion.id}`}
                      className="block bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:border-paymint-green/30 hover:shadow-lg transition-all group"
                    >
                      <div className="flex gap-4">
                        {/* Author Avatar */}
                        <div className="hidden md:block">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center">
                            <User size={20} className="text-gray-500" />
                          </div>
                        </div>

                        <div className="flex-1">
                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {discussion.isPinned && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 rounded text-xs font-bold">
                                Pinned
                              </span>
                            )}
                            {discussion.isHot && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded text-xs font-bold">
                                <Flame size={10} /> Hot
                              </span>
                            )}
                            {discussion.isSolved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 rounded text-xs font-bold">
                                <CheckCircle2 size={10} /> Solved
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded text-xs font-bold">
                              {discussion.category}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold mb-2 group-hover:text-paymint-green transition-colors">
                            {discussion.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                            {discussion.excerpt}
                          </p>

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{discussion.author.name}</span>
                              {discussion.author.badge && (
                                <span className="px-1.5 py-0.5 bg-paymint-green/10 text-paymint-green rounded text-xs font-bold">
                                  {discussion.author.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-400">{discussion.createdAt}</span>
                            <div className="flex items-center gap-4 text-gray-400">
                              <span className="flex items-center gap-1">
                                <MessageSquare size={14} /> {discussion.replies}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart size={14} /> {discussion.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={14} /> {discussion.views}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight size={20} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all hidden md:block" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              <div className="mt-8 text-center">
                <button className="px-8 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all">
                  Load More Discussions
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
