import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    Hash,
    Search,
    Bell,
    User,
    Plus,
    Filter,
    ThumbsUp,
    Server,
    Zap,
    MessageCircle,
    Clock,
    Menu,
    X,
    LogOut,
    Bookmark
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Logo } from '../../components/Logo';
import { formatInputPlaceholder } from '../../utils/textCase';

export const CommunityHubPage = () => {
    const { t } = useTranslation();
    const { isAuthenticated, account, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleAuthRequired = (action: string) => {
        if (!isAuthenticated) {
            toast.error(t('community.auth_required', `Please log in to ${action}`), {
                icon: '🔒',
                style: {
                    borderRadius: '12px',
                    background: '#333',
                    color: '#fff',
                },
            });
            // Optional: Navigate to login, or just show toast
            // navigate('/login'); 
            return true;
        }
        return false;
    };

    // CATEGORY STRUCTURE - Based on "The Architecture" guide
    const categories = [
        { id: 'all', label: 'All Topics', icon: Hash, description: 'Browse all discussions' },
        { id: 'announcements', label: '📣 Announcements', icon: Bell, description: 'Official news & updates' },
        { id: 'help', label: '🆘 Help & Support', icon: MessageSquare, description: 'Get help with bugs or setup' },
        { id: 'feature-requests', label: '💡 Feature Requests', icon: ThumbsUp, description: 'Vote on new features' },
        { id: 'hardware', label: '🛒 Hardware Talk', icon: Server, description: 'Printers, terminals & iPads' },
    ];

    const topics = [
        {
            id: 1,
            title: "How do I connect the Epson TM-m30II printer via Bluetooth?",
            category: "hardware",
            author: "BistroBoss",
            authorBadges: ["Founding Member", "Hardware Expert"],
            replies: 12,
            views: 450,
            lastActivity: "10m",
            tags: ["printer", "bluetooth", "setup"],
            isPinned: false,
            votes: 0
        },
        {
            id: 2,
            title: "Feature Request: Split payments by item (Seat Handling)",
            category: "feature-requests",
            author: "Sarah J.",
            authorBadges: ["Pro User"],
            replies: 128,
            views: 3400,
            lastActivity: "1h",
            tags: ["payments", "ux"],
            isPinned: false,
            votes: 245
        },
        {
            id: 3,
            title: "⚠️ Scheduled Maintenance: Sunday Feb 15th, 2 AM EST",
            category: "announcements",
            author: "Mintcom Team",
            authorBadges: ["Admin", "Staff"],
            replies: 0,
            views: 5000,
            lastActivity: "3d",
            tags: ["maintenance", "official"],
            isPinned: true,
            votes: 0
        },
        {
            id: 4,
            title: "My inventory isn't syncing between iPad and Dashboard",
            category: "help",
            author: "CoffeeBean",
            authorBadges: [],
            replies: 4,
            views: 89,
            lastActivity: "2h",
            tags: ["bug", "sync"],
            isPinned: false,
            votes: 0
        }
    ];

    return (
        <div className="min-h-screen bg-[#Fdfdfd] dark:bg-[#050505] text-gray-900 dark:text-white font-sans flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#0a0a0a] fixed h-full z-20">
                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                    <Logo size="md" />
                    <div className="mt-2 text-xs font-bold text-gray-400 tracking-widest uppercase">Community</div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-xl font-bold text-sm">
                            <MessageSquare size={18} />
                            Discussions
                        </button>
                        {isAuthenticated && (
                            <>
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl font-medium text-sm transition-colors">
                                    <Bookmark size={18} />
                                    Bookmarks
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl font-medium text-sm transition-colors">
                                    <User size={18} />
                                    My Profile
                                </button>
                            </>
                        )}
                    </div>

                    <div>
                        <h3 className="font-barlow px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categories</h3>
                        <div className="space-y-1">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-colors ${selectedCategory === cat.id
                                        ? 'text-Mintcom-green font-bold bg-Mintcom-green/5'
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <cat.icon size={16} />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-white/5">
                    {isAuthenticated ? (
                        <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-bold">
                            <LogOut size={16} />
                            Check Out
                        </button>
                    ) : (
                        <Link to="/login" className="w-full flex items-center gap-3 px-4 py-2 text-Mintcom-green font-bold text-sm hover:underline">
                            <User size={16} />
                            Log In
                        </Link>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 min-h-screen">
                {/* Top Header */}
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 lg:hidden">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-500">
                            <Menu size={24} />
                        </button>
                        <Logo size="sm" />
                    </div>

                    <div className="flex-1 max-w-2xl mx-auto hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input maxLength={255}
                                type="text"
                                placeholder={formatInputPlaceholder("Search topics, posts, or users...", t('common.locale'))}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-xl py-2.5 pl-11 pr-12 font-medium focus:ring-2 focus:ring-Mintcom-green/50 transition-all"
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
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                        {isAuthenticated ? (
                            <>
                                <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative">
                                    <Bell size={20} />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
                                </button>
                                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-white/10">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-Mintcom-green to-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                                        {account?.firstName?.charAt(0) || 'U'}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-sm font-bold text-gray-900 dark:text-white hover:text-Mintcom-green transition-colors">Log In</Link>
                                <Link to="/signup" className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold">Sign Up</Link>
                            </div>
                        )}
                        <ThemeToggle />
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg">
                                <Hash size={20} className="text-gray-600 dark:text-gray-300" />
                            </div>
                            <h2 className="font-barlow text-2xl font-black">{selectedCategory === 'all' ? 'All Discussions' : categories.find(c => c.id === selectedCategory)?.label}</h2>
                        </div>
                        <button
                            onClick={() => {
                                if (handleAuthRequired('post a new topic')) return;
                                navigate('/community/discussions/new');
                            }}
                            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-gray-900/10 hover:scale-105 transition-transform"
                        >
                            <Plus size={18} />
                            <span className="hidden md:inline">New Topic</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 dark:bg-white/10 rounded-lg text-sm font-bold whitespace-nowrap">
                            Latest
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors">
                            Top
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors">
                            Unsolved
                        </button>
                        <div className="flex-1"></div>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <Filter size={16} />
                            <span className="text-sm font-bold">Filter</span>
                        </button>
                    </div>

                    {/* Topic List */}
                    <div className="space-y-3">
                        {topics.map((topic, idx) => (
                            <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Link
                                    to={`/community/discussions/${topic.id}`}
                                    className="block group bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/5 rounded-2xl p-5 hover:border-Mintcom-green/30 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {topic.isPinned && (
                                                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded text-[10px] font-black uppercase tracking-wider">Pinned</span>
                                                )}
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{categories.find(c => c.id === topic.category)?.label || topic.category}</span>
                                            </div>

                                            <div className="flex gap-4">
                                                {/* Voting UI for Feature Requests */}
                                                {topic.category === 'feature-requests' && (
                                                    <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-2 min-w-[60px]">
                                                        <div className="text-Mintcom-green"><ThumbsUp size={16} /></div>
                                                        <span className="text-sm font-black mt-1">{topic.votes}</span>
                                                    </div>
                                                )}

                                                <div>
                                                    <h3 className="font-barlow text-lg font-bold mb-2 group-hover:text-Mintcom-green transition-colors">{topic.title}</h3>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        {topic.tags.map(tag => (
                                                            <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-xs font-bold">#{tag}</span>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                                        <span className="flex items-center gap-1.5 text-gray-900 dark:text-white">
                                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                                                {topic.author.charAt(0)}
                                                            </div>
                                                            {topic.author}
                                                            {/* First Badge Display */}
                                                            {topic.authorBadges?.[0] && (
                                                                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 rounded text-[10px] font-bold border border-yellow-200 dark:border-yellow-500/30">
                                                                    <Zap size={10} fill="currentColor" /> {topic.authorBadges[0]}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {topic.lastActivity} ago</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats - Desktop */}
                                        <div className="hidden md:flex items-center gap-6 text-gray-400 px-4">
                                            <div className="text-center">
                                                <div className="font-bold text-lg text-gray-900 dark:text-white">{topic.replies}</div>
                                                <div className="text-xs">Replies</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-lg text-gray-900 dark:text-white">{topic.views}</div>
                                                <div className="text-xs">Views</div>
                                            </div>
                                        </div>

                                        {/* Stats - Mobile */}
                                        <div className="md:hidden flex flex-col items-end gap-2 text-gray-400">
                                            <div className="flex items-center gap-1 text-xs">
                                                <MessageCircle size={14} /> {topic.replies}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <motion.div
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        className="absolute top-0 left-0 bottom-0 w-72 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/5 p-6"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <Logo size="md" />
                            <button onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
                        </div>

                        {/* Mobile Sidebar Content */}
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-white/10 rounded-xl font-bold">
                                    <MessageSquare size={20} /> Discussions
                                </button>
                                {/* Reuse categories... */}
                                {categories.map(cat => (
                                    <button key={cat.id} className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 rounded-xl font-medium">
                                        <cat.icon size={20} /> {cat.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-white/5" />

                            {isAuthenticated ? (
                                <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-bold">
                                    <LogOut size={20} /> Check Out
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <button onClick={() => navigate('/login')} className="w-full flex items-center gap-3 px-4 py-3 text-gray-900 dark:text-white font-bold">
                                        <User size={20} /> Log In
                                    </button>
                                    <button onClick={() => navigate('/signup')} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold">
                                        Sign Up
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};


