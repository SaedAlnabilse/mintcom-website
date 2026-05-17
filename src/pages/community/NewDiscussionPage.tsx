import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    MessageSquare,
    HelpCircle,
    Lightbulb,
    Zap,
    Users,
    Loader2,
    AlertCircle,
    Lock,
    ArrowRight
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatInputPlaceholder } from '../../utils/textCase';

export const NewDiscussionPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = [
        { id: 'questions', label: t('community.categories.questions', 'General Questions'), icon: HelpCircle, description: t('community.categories.questionsDesc', 'Get help from the community with your Day-to-Day operations.') },
        { id: 'tips', label: t('community.categories.tips', 'Tips & Tricks'), icon: Zap, description: t('community.categories.tipsDesc', 'Share your workflow hacks and best practices.') },
        { id: 'success', label: t('community.categories.success', 'Success Stories'), icon: Users, description: t('community.categories.successDesc', 'Tell us how you grow your business with Mintcom.') },
        { id: 'showcase', label: t('community.categories.showcase', 'Showcase'), icon: Lightbulb, description: t('community.categories.showcaseDesc', 'Show off your setup or new menu items.') }
    ];

    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.category) newErrors.category = t('community.discussions.errors.category', 'Please select a topic');
        if (!formData.title.trim()) newErrors.title = t('community.discussions.errors.title', 'Title is required');
        if (!formData.description.trim()) newErrors.description = t('community.discussions.errors.description', 'Please provide some context');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success(t('community.discussions.submitSuccess', 'Discussion started!'), { icon: '💬' });
            navigate('/community/discussions');
        } catch {
            toast.error(t('community.discussions.submitError', 'Failed to start discussion.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
                <Navbar />
                <main className="pt-40 pb-20">
                    <div className="container mx-auto px-8 md:px-16 lg:px-24">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-xl mx-auto text-center"
                        >
                            <div className="w-20 h-20 bg-Mintcom-green/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-Mintcom-green/20">
                                <Lock size={36} className="text-Mintcom-green" />
                            </div>
                            <h1 className="text-3xl font-black mb-4 tracking-tight">Members Only Space</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-10">
                                Starting a discussion requires a Mintcom account. Sign in to share your thoughts or ask questions.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full sm:w-auto px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    Log In to Continue
                                    <ArrowRight size={18} />
                                </button>
                                <Link
                                    to="/community"
                                    className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                >
                                    Back to Community
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
            <Navbar />

            <main className="pt-28 pb-20">
                <div className="container mx-auto px-8 md:px-16 lg:px-24">
                    <div className="max-w-3xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <Link
                                    to="/community/discussions"
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </Link>
                                <h1 className="text-3xl font-black tracking-tight">{t('community.discussions.submitTitle', 'Start a Discussion')}</h1>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium ml-11">
                                {t('community.discussions.submitSubtitle', 'Connect with other business owners and share your expertise.')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Category */}
                            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-8 mb-6 shadow-sm">
                                <label className="block text-sm font-normal mb-6 text-gray-500  tracking-normal">
                                    {t('community.discussions.categoryLabel', 'Discussion Topic')} <span className="text-red-500">*</span>
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, category: category.id });
                                                setErrors({ ...errors, category: '' });
                                            }}
                                            className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${formData.category === category.id
                                                ? 'border-Mintcom-green bg-Mintcom-green/5'
                                                : 'border-gray-100 dark:border-white/10 hover:border-Mintcom-green/30 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.category === category.id
                                                ? 'bg-Mintcom-green text-black scale-110'
                                                : 'bg-gray-100 dark:bg-white/5 text-gray-500 group-hover:scale-105'
                                                }`}>
                                                <category.icon size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-lg mb-1">{category.label}</p>
                                                <p className="text-xs text-gray-400 leading-relaxed font-medium">{category.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {errors.category && (
                                    <p className="mt-4 text-sm text-red-500 flex items-center gap-2 font-bold">
                                        <AlertCircle size={16} />
                                        {errors.category}
                                    </p>
                                )}
                            </div>

                            {/* Input Fields */}
                            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-8 mb-8 shadow-sm">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-normal mb-3 text-gray-500  tracking-normal">
                                            {t('community.discussions.titleLabel', 'Discussion Title')} <span className="text-red-500">*</span>
                                        </label>
                                        <input maxLength={255}
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => {
                                                setFormData({ ...formData, title: e.target.value });
                                                setErrors({ ...errors, title: '' });
                                            }}
                                            placeholder={formatInputPlaceholder(t('community.discussions.titlePlaceholder', 'e.g. How do you handle rush hour staff scheduling?'), t('common.locale'))}
                                            className={`w-full p-4 bg-gray-50 dark:bg-white/5 border rounded-2xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-Mintcom-green/50 transition-all ${errors.title ? 'border-red-300' : 'border-gray-200 dark:border-white/10'
                                                }`}
                                        />
                                        {errors.title && (
                                            <p className="mt-2 text-sm text-red-500 flex items-center gap-1 font-bold">
                                                <AlertCircle size={14} />
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-normal mb-3 text-gray-500  tracking-normal">
                                            {t('community.discussions.descriptionLabel', 'Details')} <span className="text-red-500">*</span>
                                        </label>
                                        <textarea maxLength={2000}
                                            value={formData.description}
                                            onChange={(e) => {
                                                setFormData({ ...formData, description: e.target.value });
                                                setErrors({ ...errors, description: '' });
                                            }}
                                            placeholder={formatInputPlaceholder(t('community.discussions.descriptionPlaceholder', 'Tell the community more about your topic...'), t('common.locale'))}
                                            rows={8}
                                            className={`w-full p-5 bg-gray-50 dark:bg-white/5 border rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-Mintcom-green/50 transition-all resize-none ${errors.description ? 'border-red-300' : 'border-gray-200 dark:border-white/10'
                                                }`}
                                        />
                                        {errors.description && (
                                            <p className="mt-3 text-sm text-red-500 flex items-center gap-2 font-bold">
                                                <AlertCircle size={16} />
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Section */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-1">
                                <p className="text-sm text-gray-400 font-medium">
                                    {t('community.discussions.tips', 'Tip: Descriptive titles get more helpful replies!')}
                                </p>

                                <div className="flex gap-4 w-full md:w-auto">
                                    <Link
                                        to="/community/discussions"
                                        className="flex-1 md:flex-none px-8 py-4 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-center"
                                    >
                                        {t('common.cancel', 'Cancel')}
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-10 py-4 bg-Mintcom-green text-black rounded-2xl font-black text-lg hover:opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-Mintcom-green/20"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin" />
                                                {t('common.posting', 'Posting...')}
                                            </>
                                        ) : (
                                            <>
                                                <MessageSquare size={20} />
                                                {t('community.discussions.post', 'Start Discussion')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

