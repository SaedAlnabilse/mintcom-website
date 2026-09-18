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
import { formatInputPlaceholder, formatInputLabel } from '../../utils/textCase';

interface Attachment {
  name: string;
  size: string;
  file: File;
}

const MAX_ATTACHMENT_COUNT = 5;
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const NewTicketPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
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
    { id: 'low', label: t('support.tickets.priority.low'), description: t('support.tickets.priority.lowDesc') },
    { id: 'medium', label: t('support.tickets.priority.medium'), description: t('support.tickets.priority.mediumDesc') },
    { id: 'high', label: t('support.tickets.priority.high'), description: t('support.tickets.priority.highDesc') },
    { id: 'urgent', label: t('support.tickets.priority.urgent'), description: t('support.tickets.priority.urgentDesc') }
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
      if (attachments.length + newAttachments.length >= MAX_ATTACHMENT_COUNT) {
        toast.error(t('support.newTicket.attachmentLimit'));
        break;
      }

      const file = files[i];
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        toast.error(`${file.name}: ${t('support.newTicket.attachmentLimit')}`);
        continue;
      }

      const sizeInKB = Math.round(file.size / 1024);
      const sizeStr = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;
      newAttachments.push({ name: file.name, size: sizeStr, file });
    }
    if (newAttachments.length > 0) {
      setAttachments([...attachments, ...newAttachments]);
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const subject = formData.subject.trim();
    const description = formData.description.trim();

    if (!formData.category) newErrors.category = t('support.newTicket.errors.category');
    if (!subject) newErrors.subject = t('support.newTicket.errors.subject');
    if (subject.length > 100) newErrors.subject = t('support.newTicket.errors.subjectLength');
    if (!description) newErrors.description = t('support.newTicket.errors.description');
    if (description.length < 5) newErrors.description = t('support.newTicket.errors.descriptionLength');

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
        toast.error(t('support.newTicket.sessionExpired'));
        setIsSubmitting(false);
        return;
      }

      toast.error(axiosErr?.response?.data?.message || t('support.newTicket.error'));
      setIsSubmitting(false);
    }
  };

  // Redirect unauthenticated users to login before entering ticket screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Navbar hideCommercialLinks />
        <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-28">
          <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
            <Loader2 size={24} className="mx-auto mb-3 animate-spin text-mintcom-green" />
            <p className="text-sm text-stone-500 dark:text-zinc-400">{t('support.newTicket.loadingAccount')}</p>
          </div>
        </main>
        <Footer hideCommercialLinks />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/support/tickets/new' }} />;
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-white p-3.5 text-[15px] transition-colors placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500 ${
      hasError ? 'border-red-400' : 'border-stone-200'
    }`;

  return (
    <div className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar hideCommercialLinks />

      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-28">
        <Link to="/support" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          {t('support.articles.backToHelp')}
        </Link>
        <h1 className="font-magilio mt-4 text-3xl font-bold tracking-tight md:text-4xl">{t('support.newTicket.title')}</h1>
        <p className="mt-2 text-[15px] text-stone-500 dark:text-zinc-400">
          {t('support.newTicket.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          {/* Category */}
          <fieldset className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60 md:p-6">
            <legend className="px-1 text-sm font-bold">
              {t('support.newTicket.categoryLabel')} <span className="text-red-500">*</span>
            </legend>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label={t('support.newTicket.categoryLabel')}>
              {categories.map((category) => {
                const selected = formData.category === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setFormData({ ...formData, category: category.id });
                      setErrors({ ...errors, category: '' });
                    }}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-start transition-colors ${
                      selected
                        ? 'border-stone-900 bg-stone-50 dark:border-zinc-100 dark:bg-zinc-800/60'
                        : 'border-stone-200 hover:border-stone-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      selected ? 'bg-mintcom-green text-black' : 'bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      <category.icon size={17} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{category.label}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-stone-500 dark:text-zinc-400">{category.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {errors.category && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                <AlertCircle size={14} />
                {errors.category}
              </p>
            )}
          </fieldset>

          {/* Priority */}
          <fieldset className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60 md:p-6">
            <legend className="px-1 text-sm font-bold">
              {formatInputLabel(t('support.newTicket.priorityLabel'), t('common.locale'))}
            </legend>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4" role="radiogroup" aria-label={t('support.newTicket.priorityLabel')}>
              {priorities.map((priority) => {
                const selected = formData.priority === priority.id;
                return (
                  <button
                    key={priority.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setFormData({ ...formData, priority: priority.id })}
                    className={`rounded-xl border p-3.5 text-center transition-colors ${
                      selected
                        ? 'border-stone-900 bg-stone-50 dark:border-zinc-100 dark:bg-zinc-800/60'
                        : 'border-stone-200 hover:border-stone-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="block text-sm font-bold">{priority.label}</span>
                    <span className="mt-0.5 hidden text-xs leading-snug text-stone-500 dark:text-zinc-400 md:block">{priority.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Subject */}
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60 md:p-6">
            <label htmlFor="ticket-subject" className="mb-2.5 block text-sm font-bold">
              {t('support.newTicket.subjectLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                setErrors({ ...errors, subject: '' });
              }}
              placeholder={formatInputPlaceholder(t('support.newTicket.subjectPlaceholder'), t('common.locale'))}
              className={inputClass(!!errors.subject)}
              maxLength={100}
            />
            <div className="mt-1.5 flex items-center justify-between">
              {errors.subject ? (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle size={14} />
                  {errors.subject}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs tabular-nums text-stone-400">{formData.subject.length}/100</span>
            </div>
          </div>

          {/* Description + attachments */}
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60 md:p-6">
            <label htmlFor="ticket-description" className="mb-2.5 block text-sm font-bold">
              {t('support.newTicket.descriptionLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ticket-description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors({ ...errors, description: '' });
              }}
              placeholder={formatInputPlaceholder(t('support.newTicket.descriptionPlaceholder'), t('common.locale'))}
              rows={6}
              className={`${inputClass(!!errors.description)} resize-none`}
              maxLength={2000}
            />
            {errors.description && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                <AlertCircle size={14} />
                {errors.description}
              </p>
            )}

            <div className="mt-4 border-t border-stone-200 pt-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold">{t('support.tickets.attachments')}</p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 px-3.5 py-2 text-sm font-semibold transition-colors hover:border-stone-300 dark:border-zinc-700">
                  <Upload size={15} />
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
                <ul className="flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <li
                      key={index}
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 text-[13px] dark:border-zinc-700"
                    >
                      <Paperclip size={13} className="text-stone-400" />
                      <span className="font-medium">{attachment.name}</span>
                      <span className="text-stone-400">({attachment.size})</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        aria-label={t('common.remove', { defaultValue: 'Remove' })}
                        className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-zinc-800"
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-2 text-xs text-stone-400">
                {t('support.newTicket.attachmentLimit')}
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-[13px] text-stone-500 dark:text-zinc-400">
              {t('support.newTicket.privacyAgreement')}{' '}
              <a href="/legal/privacy" className="font-semibold text-mintcom-greenInk dark:text-mintcom-green hover:underline">{t('common.privacyPolicy')}</a>
            </p>

            <div className="flex gap-2.5">
              <Link
                to="/support"
                className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-stone-300 dark:border-zinc-700"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('common.submitting')}
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {t('support.newTicket.submit')}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      <Footer hideCommercialLinks />
    </div>
  );
};
