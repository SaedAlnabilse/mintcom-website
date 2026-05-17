import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Filter,
  Inbox,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { FullScreenLoader, SurfaceLoader } from '../../components/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { isSupportAdminEmail } from '../../config/support';
import api from '../../config/api';
import { formatInputPlaceholder } from '../../utils/textCase';

interface FeedbackItem {
  id: string;
  rating: number;
  category: string;
  area: string | null;
  comment: string;
  pageUrl: string | null;
  route: string | null;
  userName: string | null;
  userEmail: string | null;
  contactConsent: boolean;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  total: number;
  averageRating: number;
  lowRatingCount: number;
  newCount: number;
  byCategory: { category: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

const statusOptions = ['NEW', 'REVIEWING', 'PLANNED', 'DONE', 'ARCHIVED'];
const categoryOptions = ['all', 'general', 'bug', 'feature', 'usability', 'performance', 'pricing', 'support'];

const statusTone: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  REVIEWING: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  PLANNED: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
  DONE: 'bg-mintcom-green/10 text-green-700 dark:text-mintcom-green',
  ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SupportFeedbackPage = () => {
  const { isAuthenticated, isLoading: authLoading, account } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    averageRating: 0,
    lowRatingCount: 0,
    newCount: 0,
    byCategory: [],
    byStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('NEW');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const isSupportTeam = isSupportAdminEmail(account?.email);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get('/api/contact/feedback', {
          params: {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            rating: ratingFilter !== 'all' ? ratingFilter : undefined,
            search: searchQuery.trim() || undefined,
          },
        }),
        api.get('/api/contact/feedback/stats'),
      ]);

      setFeedback(listRes.data?.feedback || []);
      setStats(statsRes.data || {
        total: 0,
        averageRating: 0,
        lowRatingCount: 0,
        newCount: 0,
        byCategory: [],
        byStatus: [],
      });
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, ratingFilter, searchQuery, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && isSupportTeam) {
      fetchFeedback();
    }
  }, [fetchFeedback, isAuthenticated, isSupportTeam]);

  const topCategory = useMemo(() => stats.byCategory[0], [stats.byCategory]);

  const updateFeedback = async (item: FeedbackItem, status: string) => {
    try {
      const res = await api.patch(`/api/contact/feedback/${item.id}`, { status });
      setFeedback((current) =>
        current.map((feedbackItem) =>
          feedbackItem.id === item.id ? res.data : feedbackItem,
        ),
      );
      toast.success(`Feedback marked ${status.toLowerCase()}`);
    } catch {
      toast.error('Failed to update feedback');
    }
  };

  if (authLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: '/support/admin/feedback' }} replace />;
  if (!isSupportTeam) return <Navigate to="/support" replace />;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-28 pb-16 dark:bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link to="/support/admin" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-mintcom-green dark:text-gray-400">
                <ArrowLeft size={16} />
                Back to tickets
              </Link>
              <h1 className="font-magilio text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Feedback Insights
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500 dark:text-gray-400">
                Review product feedback by rating, POS area, and status so useful requests become planned improvements.
              </p>
            </div>
            <button
              onClick={fetchFeedback}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total feedback', value: stats.total, icon: MessageSquare, tone: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { label: 'Average rating', value: stats.averageRating.toFixed(1), icon: Star, tone: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              { label: 'Low ratings', value: stats.lowRatingCount, icon: BarChart3, tone: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
              { label: topCategory ? `Top: ${topCategory.category}` : 'Top area', value: topCategory?.count || 0, icon: CheckCircle2, tone: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}>
                    <item.icon size={20} className={item.tone} />
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-none text-gray-900 dark:text-white">{item.value}</p>
                    <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-400">{item.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  maxLength={255}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchFeedback();
                  }}
                  placeholder={formatInputPlaceholder('Search comments, area, route, name, or email...', 'en')}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-11 text-sm font-bold text-gray-700 outline-none transition-colors focus:border-mintcom-green/50 focus:ring-2 focus:ring-mintcom-green/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
              >
                <Filter size={18} />
                Filters
              </button>
              <button
                onClick={fetchFeedback}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-mintcom-green px-5 py-3 text-sm font-black text-black transition-opacity hover:opacity-90"
              >
                Apply
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 dark:border-white/10 md:grid-cols-3">
                <FilterGroup label="Status" value={statusFilter} options={['all', ...statusOptions]} onChange={setStatusFilter} />
                <FilterGroup label="Category" value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
                <FilterGroup label="Rating" value={ratingFilter} options={['all', '1', '2', '3', '4', '5']} onChange={setRatingFilter} />
              </div>
            )}
          </div>

          {loading ? (
            <SurfaceLoader message="Loading feedback..." paddingClassName="py-16" />
          ) : feedback.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <Inbox className="mx-auto mb-4 h-14 w-14 text-gray-300 dark:text-gray-600" />
              <h3 className="font-magilio mb-2 text-lg font-black text-gray-900 dark:text-white">No feedback found</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Try a different filter or clear the search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => (
                <article key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          <Star size={12} fill="currentColor" />
                          {item.rating}/5
                        </span>
                        <span className={`rounded-lg px-2 py-1 text-xs font-black ${statusTone[item.status] || statusTone.NEW}`}>
                          {item.status.replace('_', ' ').toLowerCase()}
                        </span>
                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-black capitalize text-gray-600 dark:bg-white/10 dark:text-gray-300">
                          {item.category}
                        </span>
                        {item.area && (
                          <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-black capitalize text-gray-600 dark:bg-white/10 dark:text-gray-300">
                            {item.area}
                          </span>
                        )}
                        <span className="text-xs font-bold text-gray-400">{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-gray-700 dark:text-gray-200">{item.comment}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span>{item.userName || 'Anonymous'}</span>
                        {item.userEmail && <span>{item.userEmail}</span>}
                        {item.route && <span>{item.route}</span>}
                        {item.contactConsent && <span className="font-bold text-mintcom-green">Contact allowed</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:w-80 lg:justify-end">
                      {statusOptions.filter((status) => status !== item.status).slice(0, 4).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateFeedback(item, status)}
                          className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-600 transition-colors hover:bg-mintcom-green/20 dark:bg-white/10 dark:text-gray-300"
                        >
                          {status.replace('_', ' ').toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
              value === option
                ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15'
            }`}
          >
            {option.replace('_', ' ').toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
