import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    MessageSquare,
    Share2,
    User,
    Clock,
    Send,
    Lock,
    Heart,
    Eye,
    Flame,
    Award,
    ChevronRight
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatInputPlaceholder } from '../../utils/textCase';

interface Comment {
    id: number;
    author: { name: string; avatar?: string; badge?: string };
    content: string;
    createdAt: string;
    likes: number;
    isOfficial?: boolean;
}

interface Discussion {
    id: number;
    title: string;
    content: string;
    author: { name: string; badge?: string };
    category: string;
    repliesCount: number;
    likes: number;
    views: number;
    createdAt: string;
    isHot: boolean;
    isPinned: boolean;
    isSolved: boolean;
    comments: Comment[];
}

export const DiscussionDetailPage = () => {
    const { discussionId } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [commentText, setCommentText] = useState('');

    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        const timer = setTimeout(() => {
            setDiscussion({
                id: Number(discussionId),
                title: t('community.discussions.item_1.title', 'Best practices for managing multiple locations'),
                content: t('community.discussions.item_1.excerpt', 'I recently expanded to 3 locations and looking for tips on how to manage inventory and staff across all of them efficiently. Specifically, I am struggling with how to handle stock transfers and real-time reporting across different time zones. Any advice on how to best utilize the Mintcom dashboard for this?'),
                author: { name: 'Michael Chen', badge: 'Champion' },
                category: 'Tips & Tricks',
                repliesCount: 24,
                likes: 56,
                views: 1240,
                createdAt: t('community.times.hours_ago', '2 hours ago', { count: 2 }),
                isHot: true,
                isPinned: true,
                isSolved: false,
                comments: [
                    {
                        id: 1,
                        author: { name: 'Sarah Johnson', badge: 'Pro User' },
                        content: 'Merging reports is the way to go! Check out the "Consolidated Reports" feature in the Owner Portal.',
                        createdAt: '1 hour ago',
                        likes: 15
                    },
                    {
                        id: 2,
                        author: { name: 'David Kim' },
                        content: "We use the central warehouse feature to manage stock. It's really helped us keep track of inventory moving between our 5 branches.",
                        createdAt: '45 mins ago',
                        likes: 8
                    },
                    {
                        id: 3,
                        author: { name: 'Mintcom Support', badge: 'Official' },
                        content: "Hi Michael! We recommend setting up 'Brand Levels' in your organizational structure. This allows for top-down reporting while keeping individual location data separate. Reach out if you need a walk-through!",
                        createdAt: '20 mins ago',
                        likes: 120,
                        isOfficial: true
                    }
                ]
            });
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [discussionId, t]);

    const handlePostComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please log in to reply', { icon: '🔒' });
            navigate('/login');
            return;
        }
        if (!commentText.trim()) return;

        const newComment: Comment = {
            id: Date.now(),
            author: { name: 'You' },
            content: commentText,
            createdAt: 'Just now',
            likes: 0
        };

        setDiscussion(prev => prev ? {
            ...prev,
            repliesCount: prev.repliesCount + 1,
            comments: [newComment, ...prev.comments]
        } : null);

        setCommentText('');
        toast.success('Reply posted!');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-Mintcom-green border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!discussion) {
        return <div className="min-h-screen bg-gray-50 dark:bg-[#050505] p-20 text-center">Discussion not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
            <Navbar />

            <main className="pt-28 pb-20">
                <div className="container mx-auto px-8 md:px-16 lg:px-24">
                    <div className="max-w-4xl mx-auto">
                        {/* Back */}
                        <Link
                            to="/community/discussions"
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-Mintcom-green font-bold mb-8 transition-colors group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            {t('community.discussions.back', 'Back to Discussions')}
                        </Link>

                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1">
                                {/* Original Post */}
                                <article className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-8 mb-8 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-2 mb-6">
                                        {discussion.isPinned && (
                                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 rounded-lg text-xs font-black uppercase tracking-widest">
                                                {t('community.labels.pinned', 'Pinned')}
                                            </span>
                                        )}
                                        {discussion.isHot && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-lg text-xs font-black uppercase tracking-widest">
                                                <Flame size={12} /> {t('community.labels.hot', 'Hot')}
                                            </span>
                                        )}
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-500 rounded-lg text-xs font-black uppercase tracking-widest">
                                            {discussion.category}
                                        </span>
                                        <div className="ml-auto text-gray-400 text-sm font-bold flex items-center gap-2">
                                            <Clock size={16} /> {discussion.createdAt}
                                        </div>
                                    </div>

                                    <h1 className="text-3xl font-black tracking-tight mb-6">
                                        {discussion.title}
                                    </h1>

                                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-10">
                                        {discussion.content}
                                    </div>

                                    {/* Author Info */}
                                    <div className="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center">
                                                <User size={24} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black">{discussion.author.name}</p>
                                                    {discussion.author.badge && (
                                                        <span className="px-2 py-0.5 bg-Mintcom-green/20 text-Mintcom-green text-[10px] font-black uppercase tracking-widest rounded">
                                                            {discussion.author.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('community.labels.originalPoster', 'Original Poster')}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400">
                                                <Heart size={20} />
                                            </button>
                                            <button className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400">
                                                <Share2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </article>

                                {/* Replies Container */}
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <MessageSquare size={24} className="text-Mintcom-green" />
                                        <h2 className="text-2xl font-black">{discussion.repliesCount} {t('community.labels.replies', 'Replies')}</h2>
                                    </div>

                                    {/* Reply Input */}
                                    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 mb-10 shadow-sm relative focus-within:border-Mintcom-green/50 transition-all">
                                        <form onSubmit={handlePostComment}>
                                            <textarea maxLength={2000}
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder={formatInputPlaceholder(isAuthenticated ? t('community.discussions.replyPlaceholder', 'What are your thoughts?') : t('community.discussions.loginToReply', 'Sign in to reply...'), t('common.locale'))}
                                                className="w-full bg-transparent p-4 text-gray-600 dark:text-gray-300 font-medium focus:outline-none resize-none min-h-[120px]"
                                                readOnly={!isAuthenticated}
                                                onClick={() => !isAuthenticated && navigate('/login')}
                                            />
                                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-4 mt-2">
                                                <span className="text-xs text-gray-400 font-black uppercase tracking-widest px-4">
                                                    {isAuthenticated ? t('community.labels.formattingEnabled', 'Basic formatting supported') : t('community.labels.memberLock', 'Restricted to members')}
                                                </span>
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center gap-2 px-8 py-3 bg-Mintcom-green text-black rounded-xl font-black hover:opacity-90 transition-all disabled:opacity-50"
                                                    disabled={!isAuthenticated || !commentText.trim()}
                                                >
                                                    <Send size={18} />
                                                    {t('community.labels.postReply', 'Post Reply')}
                                                </button>
                                            </div>
                                            {!isAuthenticated && (
                                                <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-[2px] rounded-3xl flex items-center justify-center flex-col p-4">
                                                    <Lock size={28} className="text-gray-400 mb-3" />
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/login')}
                                                        className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-black transition-transform active:scale-95"
                                                    >
                                                        Sign In to Reply
                                                    </button>
                                                </div>
                                            )}
                                        </form>
                                    </div>

                                    {/* Reply List */}
                                    <div className="space-y-6">
                                        {discussion.comments.map((comment) => (
                                            <motion.div
                                                key={comment.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-8 rounded-3xl border ${comment.isOfficial
                                                        ? 'bg-Mintcom-green/[0.03] border-Mintcom-green/30'
                                                        : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${comment.isOfficial ? 'bg-Mintcom-green text-black' : 'bg-gray-100 dark:bg-white/10'}`}>
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black">{comment.author.name}</span>
                                                                {comment.author.badge && (
                                                                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded ${comment.isOfficial ? 'bg-Mintcom-green/20 text-Mintcom-green' : 'bg-gray-100 dark:bg-white/20 text-gray-400'
                                                                        }`}>
                                                                        {comment.author.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{comment.createdAt}</span>
                                                        </div>
                                                    </div>
                                                    <button className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-Mintcom-green transition-all">
                                                        <Heart size={16} /> {comment.likes}
                                                    </button>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed md:ml-14">
                                                    {comment.content}
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Sidebar */}
                            <div className="lg:w-72">
                                <div className="sticky top-28 space-y-6">
                                    {/* Activity Stats */}
                                    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 italic">{t('community.labels.activity', 'Thread Activity')}</h3>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <Eye size={18} />
                                                    <span className="text-sm font-bold">{t('community.labels.views', 'Views')}</span>
                                                </div>
                                                <span className="font-black">{discussion.views}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <Heart size={18} />
                                                    <span className="text-sm font-bold">{t('community.labels.likes', 'Likes')}</span>
                                                </div>
                                                <span className="font-black">{discussion.likes}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-gray-500">
                                                    <Award size={18} />
                                                    <span className="text-sm font-bold">Karma</span>
                                                </div>
                                                <span className="font-black text-Mintcom-green">+240</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Join Discussion */}
                                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-purple-500/20">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                                        <h4 className="font-black text-lg mb-3 relative z-10">{t('community.cta.joinHero', 'Join this conversation')}</h4>
                                        <p className="text-xs text-white/70 font-medium mb-6 relative z-10">{t('community.cta.joinHeroDesc', 'Share your thoughts and help Michael build a better multi-location business.')}</p>
                                        <button
                                            onClick={() => !isAuthenticated && navigate('/login')}
                                            className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"
                                        >
                                            {isAuthenticated ? t('community.labels.writeReply', 'Write a Reply') : t('common.joinNow', 'Join Now')}
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

