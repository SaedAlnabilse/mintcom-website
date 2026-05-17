import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    ChevronUp,
    MessageSquare,
    Share2,
    MoreVertical,
    User,
    Clock,
    Send,
    Lock,
    TrendingUp,
    Flame,
    CheckCircle2,
    Eye,
    Heart
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatInputPlaceholder } from '../../utils/textCase';

type IdeaStatus = 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';

interface Comment {
    id: number;
    author: string;
    avatar?: string;
    content: string;
    createdAt: string;
    likes: number;
    isOfficial?: boolean;
}

interface Idea {
    id: number;
    title: string;
    description: string;
    author: string;
    votes: number;
    commentsCount: number;
    status: IdeaStatus;
    category: string;
    createdAt: string;
    hasVoted: boolean;
    comments: Comment[];
}

export const IdeaDetailPage = () => {
    const { ideaId } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [commentText, setCommentText] = useState('');

    // Mock data fetching based on ID
    const [idea, setIdea] = useState<Idea | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        const timer = setTimeout(() => {
            setIdea({
                id: Number(ideaId),
                title: t('community.ideas.item_1.title', 'Dark mode for POS tablet app'),
                description: t('community.ideas.item_1.description', 'Many users work in dim environments (bars, restaurants). A dark mode would reduce eye strain and look more professional. This would specifically apply to the main ordering interface and the settings screens of the Android and iOS tablet builds.'),
                author: 'Alex Thompson',
                votes: 234,
                commentsCount: 3,
                status: 'planned',
                category: 'UI/UX',
                createdAt: t('community.times.weeks_ago', '2 weeks ago', { count: 2 }),
                hasVoted: true,
                comments: [
                    {
                        id: 1,
                        author: 'Mark Rutte',
                        content: 'This is a must-have for us. We operate a late-night bar and the current white interface is very bright at night.',
                        createdAt: '1 week ago',
                        likes: 12
                    },
                    {
                        id: 2,
                        author: 'Mintcom Team',
                        content: "Great suggestion, Alex! We've added this to our upcoming roadmap. We're currently exploring different color palettes to ensure high accessibility.",
                        createdAt: '5 days ago',
                        likes: 45,
                        isOfficial: true
                    },
                    {
                        id: 3,
                        author: 'Jane Doe',
                        content: '+1 for this. Also helps with battery life on OLED tablets!',
                        createdAt: '2 days ago',
                        likes: 8
                    }
                ]
            });
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [ideaId, t]);

    const handleVote = () => {
        if (!isAuthenticated) {
            toast.error('Please log in to vote on ideas', { icon: '🔒' });
            navigate('/login');
            return;
        }
        if (!idea) return;
        setIdea({
            ...idea,
            votes: idea.hasVoted ? idea.votes - 1 : idea.votes + 1,
            hasVoted: !idea.hasVoted
        });
    };

    const handlePostComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please log in to join the discussion', { icon: '🔒' });
            navigate('/login');
            return;
        }
        if (!commentText.trim()) return;

        const newComment: Comment = {
            id: Date.now(),
            author: 'You',
            content: commentText,
            createdAt: 'Just now',
            likes: 0
        };

        setIdea(prev => prev ? {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [newComment, ...prev.comments]
        } : null);

        setCommentText('');
        toast.success('Comment posted!');
    };

    const statusConfig: Record<IdeaStatus, { label: string; color: string; bg: string; icon: any }> = {
        under_review: { label: t('community.status.under_review', 'Under Review'), color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-500/20', icon: Eye },
        planned: { label: t('community.status.planned', 'Planned'), color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: Clock },
        in_progress: { label: t('community.status.in_progress', 'In Progress'), color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: Flame },
        completed: { label: t('community.status.completed', 'Completed'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10 dark:bg-mintcom-green/', icon: CheckCircle2 },
        declined: { label: t('community.status.declined', 'Declined'), color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20', icon: Lock }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-Mintcom-green border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!idea) {
        return <div className="min-h-screen bg-gray-50 dark:bg-[#050505] p-20 text-center">Idea not found</div>;
    }

    const status = statusConfig[idea.status];
    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
            <Navbar />

            <main className="pt-28 pb-20">
                <div className="container mx-auto px-8 md:px-16 lg:px-24">
                    <div className="max-w-4xl mx-auto">
                        {/* Back Link */}
                        <Link
                            to="/community/ideas"
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-Mintcom-green font-bold mb-8 transition-colors group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            {t('community.ideas.backToList', 'Back to Ideas')}
                        </Link>

                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Main Content */}
                            <div className="flex-1">
                                <article className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-8 mb-8 shadow-sm">
                                    <div className="flex gap-6 mb-8">
                                        {/* Votes */}
                                        <div className="flex-shrink-0">
                                            <button
                                                onClick={handleVote}
                                                className={`w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${idea.hasVoted
                                                    ? 'bg-Mintcom-green text-black scale-105 shadow-lg shadow-Mintcom-green/20'
                                                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-Mintcom-green/20 hover:text-Mintcom-green'
                                                    }`}
                                            >
                                                <ChevronUp size={28} />
                                                <span className="text-xl font-black">{idea.votes}</span>
                                            </button>
                                        </div>

                                        {/* Meta & Title */}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${status.bg} ${status.color}`}>
                                                    <StatusIcon size={14} />
                                                    {status.label}
                                                </span>
                                                <span className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-black uppercase tracking-wider">
                                                    {idea.category}
                                                </span>
                                                <div className="flex items-center gap-2 text-gray-400 text-sm ml-auto">
                                                    <Clock size={16} />
                                                    <span className="font-bold">{idea.createdAt}</span>
                                                </div>
                                            </div>

                                            <h1 className="font-barlow text-3xl font-black tracking-tight mb-6">
                                                {idea.title}
                                            </h1>

                                            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                                                {idea.description}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Author & Actions */}
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center">
                                                <User size={20} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black">{idea.author}</p>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('community.labels.author', 'Idea Submitter')}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-Mintcom-green">
                                                <Share2 size={20} />
                                            </button>
                                            <button className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400">
                                                <MoreVertical size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </article>

                                {/* Comments Section */}
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <MessageSquare size={24} className="text-Mintcom-green" />
                                        <h2 className="font-barlow text-2xl font-black">{idea.commentsCount} {t('community.labels.comments', 'Comments')}</h2>
                                    </div>

                                    {/* Post Comment */}
                                    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 mb-10 shadow-sm transition-all focus-within:border-Mintcom-green/50">
                                        <form onSubmit={handlePostComment} className="relative">
                                            <textarea maxLength={2000}
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder={formatInputPlaceholder(isAuthenticated ? t('community.labels.writeComment', 'Add a comment...') : t('community.labels.loginToComment', 'Join the discussion...'), t('common.locale'))}
                                                className="w-full bg-transparent p-4 text-gray-600 dark:text-gray-300 font-medium focus:outline-none resize-none min-h-[100px]"
                                                readOnly={!isAuthenticated}
                                                onClick={() => !isAuthenticated && navigate('/login')}
                                            />
                                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-4 mt-2">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest px-4">
                                                    {isAuthenticated ? t('community.labels.commentRules', 'Be respectful & constructive') : t('community.labels.membersOnly', 'Members only')}
                                                </p>
                                                <button
                                                    type="submit"
                                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-Mintcom-green text-black rounded-xl font-black hover:opacity-90 transition-all disabled:opacity-50"
                                                    disabled={!isAuthenticated || !commentText.trim()}
                                                >
                                                    <Send size={18} />
                                                    {t('community.labels.postComment', 'Post')}
                                                </button>
                                            </div>
                                            {!isAuthenticated && (
                                                <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center flex-col p-4 text-center">
                                                    <Lock size={24} className="mb-2 text-gray-500" />
                                                    <p className="text-sm font-black text-gray-900 dark:text-white mb-2">Login Required</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/login')}
                                                        className="text-xs font-black text-Mintcom-green hover:underline uppercase tracking-widest"
                                                    >
                                                        Sign in to join the conversation
                                                    </button>
                                                </div>
                                            )}
                                        </form>
                                    </div>

                                    {/* Comment List */}
                                    <div className="space-y-6">
                                        {idea.comments.map((comment) => (
                                            <motion.div
                                                key={comment.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-6 rounded-3xl border ${comment.isOfficial
                                                    ? 'bg-Mintcom-green/[0.03] border-Mintcom-green/20'
                                                    : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${comment.isOfficial ? 'bg-Mintcom-green text-black' : 'bg-gray-100 dark:bg-white/10'}`}>
                                                            <User size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-sm">{comment.author}</span>
                                                                {comment.isOfficial && (
                                                                    <span className="px-1.5 py-0.5 bg-Mintcom-green/20 text-Mintcom-green text-[10px] font-black uppercase tracking-widest rounded-md">
                                                                        Official
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{comment.createdAt}</span>
                                                        </div>
                                                    </div>
                                                    <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-Mintcom-green transition-colors">
                                                        <Heart size={14} />
                                                        {comment.likes}
                                                    </button>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-300 font-medium text-sm leading-relaxed ml-12">
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
                                    {/* Stats Card */}
                                    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                                        <h3 className="font-barlow text-sm font-black uppercase tracking-widest text-gray-400 mb-6">{t('community.labels.ideaStats', 'Analytics')}</h3>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-100 dark:bg-purple-500/20 text-purple-600 rounded-lg">
                                                        <TrendingUp size={18} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-500">{t('community.labels.totalVotes', 'Total Votes')}</span>
                                                </div>
                                                <span className="font-black text-lg">{idea.votes}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg">
                                                        <MessageSquare size={18} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-500">{t('community.labels.comments', 'Comments')}</span>
                                                </div>
                                                <span className="font-black text-lg">{idea.commentsCount}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 dark:bg-gray-500/20 text-gray-500 rounded-lg">
                                                        <TrendingUp size={18} className="rotate-90" />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-500">{t('community.labels.rank', 'Rank')}</span>
                                                </div>
                                                <span className="font-black text-lg">#12</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleVote}
                                            className={`w-full mt-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${idea.hasVoted
                                                ? 'bg-Mintcom-green text-black hover:opacity-90'
                                                : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-[1.02]'
                                                }`}
                                        >
                                            <ChevronUp size={24} />
                                            {idea.hasVoted ? t('community.ideas.voted', 'Voted') : t('community.ideas.upvote', 'Upvote Idea')}
                                        </button>
                                    </div>

                                    {/* Similar Ideas */}
                                    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                                        <h3 className="font-barlow text-sm font-black uppercase tracking-widest text-gray-400 mb-6">{t('community.labels.similarIdeas', 'Similar Ideas')}</h3>
                                        <div className="space-y-4">
                                            {[1, 2].map(i => (
                                                <Link key={i} to="/community/ideas" className="block group">
                                                    <p className="text-sm font-bold group-hover:text-Mintcom-green transition-colors mb-2 line-clamp-2">
                                                        {i === 1 ? 'Customer-facing display support' : 'QR code ordering for tables'}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                        <span className="flex items-center gap-1"><ChevronUp size={10} /> 156</span>
                                                        <span className="flex items-center gap-1"><MessageSquare size={10} /> 28</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
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

