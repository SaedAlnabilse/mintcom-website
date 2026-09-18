import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Award, Check } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton, ErrorBanner } from '../ui';
import { CustomSelect } from '../CustomSelect';
import { formatInputPlaceholder, formatInputLabel } from '../../utils/textCase';

interface Category {
  id: string;
  name: string;
}

interface Reward {
  id?: string;
  type: 'DISCOUNT' | 'FREE_ITEM';
  pointsRequired: number;
  discountPercentage?: number;
  freeCategoryId?: string;
  freeCategoryName?: string;
}

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Reward>) => void;
  initialData?: Partial<Reward>;
  categories: Category[];
}

export function RewardFormModal({ isOpen, onClose, onSave, initialData, categories }: RewardFormModalProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<'DISCOUNT' | 'FREE_ITEM'>('DISCOUNT');
  const [pointsRequired, setPointsRequired] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [freeCategoryId, setFreeCategoryId] = useState('');
  const [freeCategoryName, setFreeCategoryName] = useState('');

  const resetForm = () => {
    setType('DISCOUNT');
    setPointsRequired('');
    setDiscountPercentage('');
    setFreeCategoryId('');
    setFreeCategoryName('');
  };

  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.type) {
        setTimeout(() => setType(initialData.type as 'DISCOUNT' | 'FREE_ITEM'), 0);
      }
      setTimeout(() => {
        setPointsRequired(initialData.pointsRequired !== undefined ? initialData.pointsRequired.toLocaleString(t('common.locale'), { useGrouping: false }) : '');
        setDiscountPercentage(initialData.discountPercentage !== undefined ? initialData.discountPercentage.toLocaleString(t('common.locale'), { useGrouping: false }) : '');
        setFreeCategoryId(initialData.freeCategoryId || '');
        setFreeCategoryName(initialData.freeCategoryName || '');
      }, 0);
    } else if (isOpen) {
      setTimeout(() => resetForm(), 0);
    }
  }, [initialData, isOpen, t]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const formatATM = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length > 19) return null;
    const cents = parseInt(digits || '0', 10);
    if (cents === 0) return '';
    return (cents / 100).toFixed(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!pointsRequired || parseFloat(pointsRequired) <= 0) {
      newErrors.pointsRequired = t('rewards.errors.pointsRequired');
    }

    if (type === 'DISCOUNT') {
      if (!discountPercentage || parseFloat(discountPercentage) <= 0 || parseFloat(discountPercentage) > 100) {
        newErrors.discountPercentage = t('rewards.errors.percentageRequired');
      }
    } else {
      if (!freeCategoryId) {
        newErrors.freeCategoryId = t('rewards.errors.categoryRequired');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first field that has an error
      setTimeout(() => {
        const firstErrorField = scrollRef.current?.querySelector('.border-mintcom-red, .ring-mintcom-red\\/20');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    setErrors({});
    onSave({
      type,
      pointsRequired: Number(pointsRequired),
      discountPercentage: discountPercentage ? Number(discountPercentage) : undefined,
      freeCategoryId,
      freeCategoryName
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        title={initialData ? t('rewards.editReward') : t('rewards.newReward')}
        icon={<Award size={22} strokeWidth={2.5} />}
        onClose={onClose}
      />

      <ModalBody className="p-4 sm:p-6">
        <form id="reward-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Error Banner */}
            {Object.keys(errors).length > 0 && (
              <ErrorBanner ref={errorBannerRef} className="animate-pulse mb-2">
                {t('common.validationError')}
              </ErrorBanner>
            )}

            {/* Reward Type */}
            <div className="space-y-2">
              <label className="label-strong block">{formatInputLabel(t('rewards.form.typeLabel'), t('common.locale'))}</label>
              <div className="flex p-1 bg-stone-50 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-zinc-800 relative isolate">
                <button
                  type="button"
                  onClick={() => setType('DISCOUNT')}
                  className={`relative flex-1 py-3 rounded-lg font-sans font-bold text-xs tracking-widest transition-all duration-300 z-10 ${type === 'DISCOUNT' ? 'text-black' : 'text-stone-500 hover:text-stone-900 dark:hover:text-zinc-100'
                    }`}
                >
                  {type === 'DISCOUNT' && (
                    <motion.div layoutId="active-reward-type" className="absolute inset-0 bg-mintcom-green rounded-lg -z-10 shadow-sm" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                  )}
                  {t('rewards.form.valueOff')}
                </button>
                <button
                  type="button"
                  onClick={() => setType('FREE_ITEM')}
                  className={`relative flex-1 py-3 rounded-lg font-sans font-bold text-xs tracking-widest transition-all duration-300 z-10 ${type === 'FREE_ITEM' ? 'text-black' : 'text-stone-500 hover:text-stone-900 dark:hover:text-zinc-100'
                    }`}
                >
                  {type === 'FREE_ITEM' && (
                    <motion.div layoutId="active-reward-type" className="absolute inset-0 bg-mintcom-green rounded-lg -z-10 shadow-sm" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                  )}
                  {t('rewards.form.freeItem')}
                </button>
              </div>
            </div>

            {/* Points Required */}
            <div className="space-y-2">
              <label className="label-strong block">{formatInputLabel(t('rewards.form.pointsCostLabel'), t('common.locale'))}</label>
              <div className="relative group">
                <input
                  maxLength={255}
                  type="number"
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  value={pointsRequired}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length > 19) return;
                    if (val === '' || Number(val) >= 0) {                      setPointsRequired(val);
                      if (errors.pointsRequired) setErrors({ ...errors, pointsRequired: '' });
                    }
                  }}
                  className={`w-full px-5 py-4 bg-stone-50 dark:bg-black/20 border ${errors.pointsRequired ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl pr-16 text-sm font-bold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all group-hover:border-mintcom-green/50 shadow-sm`}
                  placeholder={formatInputPlaceholder(t('rewards.form.pointsCostPlaceholder'), t('common.locale'))}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-mintcom-green">
                  <Award size={20} strokeWidth={2.5} />
                </div>
              </div>
              {errors.pointsRequired && <p className="mt-1 px-1 text-xs font-bold text-mintcom-red">{errors.pointsRequired}</p>}
            </div>

            {/* Dynamic Fields - Height Stabilized */}
            <div className="min-h-[90px]">
              {type === 'DISCOUNT' ? (
                <motion.div key="discount" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <label className="label-strong block">{formatInputLabel(t('rewards.form.discountPercentageLabel'), t('common.locale'))}</label>
                  <div className="relative group">
                    <input maxLength={255}
                      type="text"
                      inputMode="decimal"
                      value={discountPercentage}
                      onChange={(e) => {
                        const formatted = formatATM(e.target.value);
                        if (formatted !== null) {
                          setDiscountPercentage(formatted);
                          if (errors.discountPercentage) setErrors({ ...errors, discountPercentage: '' });
                        }
                      }}
                      className={`w-full px-5 py-3.5 bg-stone-50 dark:bg-black/20 border ${errors.discountPercentage ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl pr-16 text-sm font-bold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all group-hover:border-mintcom-green/50 shadow-sm`}
                      placeholder={formatInputPlaceholder(t('common.zero'), t('common.locale'))}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-lg group-focus-within:text-mintcom-green transition-colors">{t('common.percent')}</div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-mintcom-green tracking-widest px-1">{t('attributes.form.atmStyle', { defaultValue: 'Digits shift right to left (ATM style)' })}</p>
                  {errors.discountPercentage && <p className="mt-1 px-1 text-xs font-bold text-mintcom-red">{errors.discountPercentage}</p>}
                </motion.div>
              ) : (
                <motion.div key="category" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <label className="label-strong block flex items-center justify-between gap-1">
                    <span>{t('rewards.form.categoryLabel')}</span>
                    {errors.freeCategoryId && <span className="text-mintcom-red normal-case tracking-normal font-bold text-[10px]">{errors.freeCategoryId}</span>}
                  </label>
                  <div className={errors.freeCategoryId ? 'ring-2 ring-mintcom-red/20 rounded-2xl' : ''}>
                    <CustomSelect
                      value={freeCategoryId}
                      onChange={(val) => {
                        const stringVal = String(val);
                        setFreeCategoryId(stringVal);
                        const cat = categories.find(c => c.id === stringVal);
                        setFreeCategoryName(cat ? cat.name : '');
                        if (errors.freeCategoryId) setErrors({ ...errors, freeCategoryId: '' });
                      }}
                      options={[
                        { label: t('rewards.form.selectCategory'), value: '' },
                        ...categories.map(c => ({ label: c.name, value: c.id }))
                      ]}
                      placeholder={formatInputPlaceholder(t('rewards.form.selectCategory'), t('common.locale'))}
                      direction="up"
                    />
                  </div>
                </motion.div>
              )}
            </div>

          </form>
      </ModalBody>

      <ModalFooter>
        <ModalCancelButton onClick={onClose}>
          {t('common.cancel')}
        </ModalCancelButton>
        <ModalSubmitButton form="reward-form">
          <Check size={18} strokeWidth={3} />
          {initialData ? t('common.save') : t('common.add')}
        </ModalSubmitButton>
      </ModalFooter>
    </Modal>
  );
}


