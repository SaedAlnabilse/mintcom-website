import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Send,
  Paperclip,
  X,
  AlertCircle,
  Loader2,
  HelpCircle,
  CreditCard,
  Settings,
  Zap,
  Bug,
  Lightbulb,
  Upload
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../config/api';

interface Attachment {
  name: string;
  size: string;
  file: File;
}

export const NewTicketPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, account } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'technical', label: t('support.categories.technical'), icon: Settings, description: t('support.categories.technicalDescShort') },
    { id: 'billing', label: t('support.categories.billing'), icon: CreditCard, description: t('support.categories.billingDescShort') },
    { id: 'getting-started', label: t('support.categories.gettingStarted'), icon: Zap, description: t('support.categories.gettingStartedDescShort') },
    { id: 'bug', label: t('support.categories.bug'), icon: Bug, description: t('support.categories.bugDescShort') },
    { id: 'feature', label: t('support.categories.feature'), icon: Lightbulb, description: t('support.categories.featureDescShort') },
    { id: 'other', label: t('support.categories.other'), icon: HelpCircle, description: t('support.categories.otherDescShort') }
  ];

  const priorities = [
    { id: 'low', label: t('support.tickets.priority.low'), description: t('support.tickets.priority.lowDesc'), color: 'bg-gray-100 dark:bg-gray-500/20 border-gray-200 dark:border-gray-500/30' },
    { id: 'medium', label: t('support.tickets.priority.medium'), description: t('support.tickets.priority.mediumDesc'), color: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30' },
    { id: 'high', label: t('support.tickets.priority.high'), description: t('support.tickets.priority.highDesc'), color: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30' },
    { id: 'urgent', label: t('support.tickets.priority.urgent'), description: t('support.tickets.priority.urgentDesc'), color: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' }
  ];

  const [formData, setFormData] = useState({
    category: '',
    priority: 'medium',
    subject: '',
    description: ''
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeInKB = Math.round(file.size / 1024);
      const sizeStr = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;
      newAttachments.push({ name: file.name, size: sizeStr, file });
    }
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) newErrors.category = t('support.newTicket.errors.category');
    if (!formData.subject.trim()) newErrors.subject = t('support.newTicket.errors.subject');
    if (formData.subject.length > 100) newErrors.subject = t('support.newTicket.errors.subjectLength');
    if (!formData.description.trim()) newErrors.description = t('support.newTicket.errors.description');
    if (formData.description.length < 5) newErrors.description = t('support.newTicket.errors.descriptionLength');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Step 1: Upload attachment files (if any)
      let uploadedAttachments: { name: string; url: string; sizeBytes: number; type: string }[] = [];
      if (attachments.length > 0) {
        const formDataUpload = new FormData();
        attachments.forEach((a) => formDataUpload.append('files', a.file));
        const uploadRes = await api.post('/api/support/tickets/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedAttachments = uploadRes.data?.attachments || [];
      }

      // Step 2: Create ticket with file URLs
      const payload = {
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        pageUrl: window.location.href,
        attachments: uploadedAttachments.map((a) => ({
          name: a.name,
          url: a.url,
          sizeBytes: a.sizeBytes,
          type: a.type,
        })),
      };

      // Primary: save to database via API
      const response = await api.post('/api/support/tickets', payload);
      const ticketId = response.data?.ticketId || response.data?.id;
      const ticketNumber = response.data?.ticketNumber || ticketId;

      toast.success(`${t('support.newTicket.success')} (${ticketNumber})`);
      setIsSubmitting(false);
      navigate(`/support/tickets/${ticketId}`);
    } catch (err: unknown) {
      // Log the real error so we can diagnose
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      console.error('[NewTicket] API Error:', axiosErr?.response?.status, axiosErr?.response?.data || axiosErr?.message);

      // If it was a 401 (auth issue), don't fallback — the user needs to log in again
      if (axiosErr?.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      // If it was a validation or server error, show the real error
      if (axiosErr?.response?.status && axiosErr.response.status >= 400) {
        toast.error(axiosErr?.response?.data?.message || 'Failed to create ticket. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Only fallback to localStorage if the API is truly unreachable (network error)
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).slice(2, 6).toUpperCase();
      const localTicketId = `TKT-${timestamp}-${random}`;

      const { addTicket } = await import('./TicketsPage');
      const now = new Date().toISOString();
      const userName = account?.firstName
        ? `${account.firstName} ${account.lastName || ''}`.trim()
        : 'You';

      addTicket({
        id: localTicketId,
        subject: formData.subject.trim(),
        category: formData.category,
        status: 'open' as const,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        createdAt: now,
        updatedAt: now,
        description: formData.description.trim(),
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: 'user' as const,
            senderName: userName,
            content: formData.description.trim(),
            timestamp: now,
            attachments: attachments.map((a) => ({
              name: a.name,
              size: a.size,
              type: a.file.type.startsWith('image/') ? 'image' : 'file',
            })),
          },
        ],
        unreadReplies: 0,
      });

      toast.success(`${t('support.newTicket.success')} (${localTicketId}) — saved locally`);
      setIsSubmitting(false);
      navigate('/support/tickets');
    }
  };

  // Redirect unauthenticated users to login before entering ticket screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-8 md:px-16 lg:px-24">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-10 text-center">
                <Loader2 size={28} className="animate-spin mx-auto mb-3 text-paymint-green" />
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">Loading account...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/support/tickets/new' }} />;
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
                  to="/support"
                  className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black tracking-tight">{t('support.newTicket.title')}</h1>
              </div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors ml-11">
                {t('support.newTicket.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Category Selection */}
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-4">
                  {t('support.newTicket.categoryLabel')} <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category: category.id });
                        setErrors({ ...errors, category: '' });
                      }}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${formData.category === category.id
                        ? 'border-paymint-green bg-paymint-green/5'
                        : 'border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.category === category.id
                        ? 'bg-paymint-green text-black'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                        }`}>
                        <category.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{category.label}</p>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">{category.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {errors.category && (
                  <p className="mt-3 text-sm font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Priority Selection */}
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-4">
                  {t('support.newTicket.priorityLabel')}
                </label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {priorities.map((priority) => (
                    <button
                      key={priority.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: priority.id })}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${formData.priority === priority.id
                        ? 'border-paymint-green bg-paymint-green/5'
                        : `${priority.color} border-transparent`
                        }`}
                    >
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{priority.label}</p>
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors hidden md:block">{priority.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                  {t('support.newTicket.subjectLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => {
                    setFormData({ ...formData, subject: e.target.value });
                    setErrors({ ...errors, subject: '' });
                  }}
                  placeholder={t('support.newTicket.subjectPlaceholder')}
                  className={`w-full p-4 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-paymint-green/50 ${errors.subject ? 'border-red-300' : 'border-gray-200 dark:border-white/10'
                    }`}
                  maxLength={100}
                />
                <div className="flex justify-between mt-2">
                  {errors.subject ? (
                    <p className="text-sm font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.subject}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">{formData.subject.length}/100</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                  {t('support.newTicket.descriptionLabel')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setErrors({ ...errors, description: '' });
                  }}
                  placeholder={t('support.newTicket.descriptionPlaceholder')}
                  rows={6}
                  className={`w-full p-4 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-paymint-green/50 resize-none ${errors.description ? 'border-red-300' : 'border-gray-200 dark:border-white/10'
                    }`}
                  maxLength={2000}
                />
                {errors.description && (
                  <p className="mt-2 text-sm font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.description}
                  </p>
                )}

                {/* Attachments */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">{t('support.tickets.attachments')}</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                      <Upload size={16} />
                      {t('support.newTicket.addFiles')}
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                    </label>
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors"
                        >
                          <Paperclip size={14} className="text-gray-400" />
                          <span>{attachment.name}</span>
                          <span className="text-gray-400">({attachment.size})</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors mt-2">
                    {t('support.newTicket.attachmentLimit')}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">
                  {t('support.newTicket.privacyAgreement')}{' '}
                  <a href="/legal/privacy" className="text-paymint-green hover:underline">{t('common.privacyPolicy')}</a>
                </p>

                <div className="flex gap-3">
                  <Link
                    to="/support"
                    className="px-6 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                  >
                    {t('common.cancel')}
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-paymint-green text-black rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-paymint-green/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {t('common.submitting')}
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        {t('support.newTicket.submit')}
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

