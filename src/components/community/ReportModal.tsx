import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { communityApi } from '../../services/communityApi';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton } from '../ui';

const REASONS = ['SPAM', 'ABUSE', 'OFF_TOPIC', 'HARASSMENT', 'ILLEGAL', 'OTHER'] as const;

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'TOPIC' | 'REPLY' | 'PROFILE';
  topicId?: string;
  replyId?: string;
  profileId?: string;
}

export function ReportModal({
  open,
  onClose,
  targetType,
  topicId,
  replyId,
  profileId,
}: ReportModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string>('SPAM');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await communityApi.createReport({
        targetType,
        topicId,
        replyId,
        profileId,
        reason,
        details: details.trim() || undefined,
      });
      if (res.status === 'NOOP') {
        toast.success(t('community.moderation.reportNoop', { defaultValue: 'Already handled.' }));
      } else {
        toast.success(t('community.moderation.reportSent', { defaultValue: 'Report submitted. Thank you.' }));
      }
      onClose();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast.error(t('community.login_cta.title', { defaultValue: 'Sign in to join the conversation' }));
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      } else {
        toast.error(t('community.errors.actionFailed', { defaultValue: 'Failed to submit report.' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="sm">
      <ModalHeader
        title={t('community.moderation.reportTitle', { defaultValue: 'Report content' })}
        onClose={onClose}
      />

      <ModalBody>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('community.moderation.reason', { defaultValue: 'Reason' })}
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl mb-3 dark:bg-[#0F172A] dark:border-white/10 dark:text-white"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`community.moderation.reasons.${r}`, { defaultValue: r.replace(/_/g, ' ') })}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('community.moderation.details', { defaultValue: 'Details (optional)' })}
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl mb-4 dark:bg-[#0F172A] dark:border-white/10 dark:text-white"
        />
      </ModalBody>

      <ModalFooter>
        <ModalCancelButton onClick={onClose}>
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </ModalCancelButton>
        <ModalSubmitButton
          type="button"
          onClick={submit}
          loading={submitting}
        >
          {t('community.moderation.submitReport', { defaultValue: 'Submit report' })}
        </ModalSubmitButton>
      </ModalFooter>
    </Modal>
  );
}
