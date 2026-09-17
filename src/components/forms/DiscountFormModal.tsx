import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, RotateCcw } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton, TextInput, Toggle, ErrorBanner } from '../ui';
import { QuickInfo } from '../QuickInfo';
import { formatInputPlaceholder } from '../../utils/textCase';
import { TEXT_INPUT_LIMITS } from '../../config/textLimits';

interface Discount {
  id: string;
  name: string;
  percentage: number;
  adminOnly: boolean;
  isActive?: boolean;
}

interface DiscountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, percentage: number, adminOnly: boolean) => Promise<void>;
  onDelete?: (id: string) => void;
  onReactivate?: (id: string) => void | Promise<void>;
  initialData?: Discount | null;
  isSubmitting?: boolean;
}

export function DiscountFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  onReactivate,
  initialData,
  isSubmitting = false,
}: DiscountFormModalProps) {
  const { t } = useTranslation();
  const isReactivationMode = Boolean(initialData?.id && onReactivate);
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState<string>('');
  const [adminOnly, setAdminOnly] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setName(initialData.name);
        // `percentage` is stored as a whole percent (15 => 15%), same unit the
        // field edits in. It used to be scaled by 100 here because this form
        // wrote fractions; an admin-portal-created 15% then prefilled as 1500
        // and tripped the 100% cap, making the discount uneditable from web.
        setPercentage(initialData.percentage.toLocaleString(t('common.locale'), { useGrouping: false }));
        setAdminOnly(initialData.adminOnly);
      } else {
        setName('');
        setPercentage('');
        setAdminOnly(false);
      }
    }
  }, [isOpen, initialData, t]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  // ATM-style percentage entry, hard-capped at 100.00
  const formatATM = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length > 5) return null;
    const cents = parseInt(digits || '0', 10);
    if (cents > 10000) return null;
    if (cents === 0) return '';
    return (cents / 100).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isReactivationMode) {
      return;
    }

    const newErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = t('discounts.errors.nameRequired');
    } else if (trimmedName.length > TEXT_INPUT_LIMITS.DISCOUNT_NAME) {
      newErrors.name = t('discounts.errors.nameMax', {
        defaultValue: `Name must be at most ${TEXT_INPUT_LIMITS.DISCOUNT_NAME} characters`,
        count: TEXT_INPUT_LIMITS.DISCOUNT_NAME,
      });
    }

    const numVal = parseFloat(percentage);
    if (!percentage || isNaN(numVal)) {
      newErrors.percentage = t('discounts.errors.percentageRequired');
    } else if (numVal > 100) {
      newErrors.percentage = t('discounts.errors.percentageMax');
    } else if (numVal <= 0) {
      newErrors.percentage = t('discounts.errors.percentageRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first field that has an error
      setTimeout(() => {
        const firstErrorField = scrollRef.current?.querySelector('.border-mintcom-red');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    // Submit the whole percent as typed — the API stores whole percents.
    await onSubmit(name, numVal, adminOnly);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        title={initialData ? t('discounts.editDiscount') : t('discounts.newDiscount')}
        onClose={onClose}
      />

      <ModalBody className="p-4 sm:p-6 pt-2">
        <form id="discount-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Error Banner */}
              {Object.keys(errors).length > 0 && (
                <ErrorBanner ref={errorBannerRef} className="animate-pulse">
                  {t('common.validationError')}
                </ErrorBanner>
              )}

              {/* Name */}
              <TextInput
                label={<>{t('discounts.form.nameLabel')} <QuickInfo text={t('discounts.form.nameTip')} /></>}
                required
                fontBold
                maxLength={TEXT_INPUT_LIMITS.DISCOUNT_NAME}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value.slice(0, TEXT_INPUT_LIMITS.DISCOUNT_NAME));
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder={formatInputPlaceholder(t('discounts.form.namePlaceholder'), t('common.locale'))}
                error={errors.name}
              />

              {/* Percentage */}
              <div className="space-y-2">
                <label className="label-strong block flex items-center gap-1">
                  {t('discounts.form.percentageLabel')} <span className="text-mintcom-red">*</span>
                  <QuickInfo text={t('discounts.form.percentageTip')} />
                </label>
                <div className="relative group">
                  <input
                    maxLength={6}
                    type="text"
                    inputMode="decimal"
                    value={percentage}
                    onChange={(e) => {
                      const formatted = formatATM(e.target.value);
                      if (formatted !== null) {
                        setPercentage(formatted);
                        if (errors.percentage) setErrors({ ...errors, percentage: '' });
                      }
                    }}
                    placeholder={formatInputPlaceholder(t('common.zeroDecimal'), t('common.locale'))}
                    className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.percentage ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 pr-16 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all shadow-sm`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-mintcom-green/10 border border-mintcom-green/20 rounded-lg shadow-sm">
                    <span className="text-mintcom-green text-xs font-black">{t('common.percent')}</span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] font-bold text-mintcom-green tracking-widest px-1">{t('attributes.form.atmStyle', { defaultValue: 'Digits shift right to left (ATM style)' })}</p>
                {errors.percentage && <p className="mt-1.5 px-1 text-xs font-bold text-mintcom-red">{errors.percentage}</p>}
              </div>

              {/* Manager Only Toggle */}
              <div className="bg-gray-50 dark:bg-black/20 p-5 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-white/5 transition-colors shadow-sm">
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{t('discounts.form.managerOnly')}</span>
                  <QuickInfo text={t('discounts.form.managerOnlyTip')} />
                </div>
                <Toggle
                  checked={adminOnly}
                  onChange={setAdminOnly}
                />
              </div>

            </form>
      </ModalBody>

      <ModalFooter>
        {isReactivationMode ? (
          <>
            <ModalCancelButton onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </ModalCancelButton>
            <ModalSubmitButton
              type="button"
              onClick={() => initialData && onReactivate?.(initialData.id)}
              loading={isSubmitting}
            >
              <RotateCcw size={16} />
              <span>{t('common.reactivate', { defaultValue: 'Reactivate' })}</span>
            </ModalSubmitButton>
          </>
        ) : (
          <>
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="flex-1 h-12 sm:h-14 border border-mintcom-red/20 text-mintcom-red font-black text-xs tracking-widest rounded-xl hover:bg-mintcom-red/5 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Trash2 size={16} />
                <span>{t('common.deactivate')}</span>
              </button>
            )}
            <ModalCancelButton onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </ModalCancelButton>
            <ModalSubmitButton form="discount-form" loading={isSubmitting}>
              {initialData ? t('common.save') : t('common.add')}
            </ModalSubmitButton>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}





