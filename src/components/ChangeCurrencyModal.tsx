import { useTranslation } from 'react-i18next';
import { Landmark, Lightbulb } from 'lucide-react';
import { Modal, ModalBody, ModalCloseButton } from './ui';

export interface ChangeCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromCurrency: string;
  toCurrency: string;
  isSubmitting?: boolean;
}

export function ChangeCurrencyModal({
  isOpen,
  onClose,
  onConfirm,
  fromCurrency,
  toCurrency,
  isSubmitting = false,
}: ChangeCurrencyModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalCloseButton onClose={onClose} autoPositionAbsolute />

      <ModalBody>
        <div className="relative pt-2">
              <div className="flex flex-col items-center text-center">
                {/* Minimal Green Icon */}
                <div className="w-12 h-12 rounded-2xl bg-mintcom-green/10 border border-mintcom-green/20 text-mintcom-green flex items-center justify-center mb-4 shrink-0 shadow-sm">
                  <Landmark className="w-6 h-6" />
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {t('settings.confirm.changeCurrencyTitle', { defaultValue: 'Change System Currency' })}
                </h3>

                {/* Content */}
                <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                  <p>
                    {t('settings.confirm.changeCurrencyLead', {
                      from: fromCurrency,
                      to: toCurrency,
                      defaultValue: `You are about to change the account currency from "${fromCurrency}" to "${toCurrency}".`,
                    })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('settings.confirm.changeCurrencyScope', {
                      defaultValue:
                        'This change will apply to all locations associated with this account and may affect both past and future transactions.',
                    })}
                  </p>
                </div>

                {/* Minimal Tip Callout */}
                <div className="w-full mt-4 p-3.5 rounded-xl bg-mintcom-green/5 border border-mintcom-green/20 text-left flex items-start gap-2.5">
                  <Lightbulb size={16} className="text-mintcom-green shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {t('common.tip', { defaultValue: 'Tip' })}:{' '}
                    </span>
                    {t('settings.confirm.changeCurrencyTip', {
                      defaultValue:
                        'If you operate a location that uses a different currency, we recommend creating a separate account for that location.',
                    }).replace(/^(Tip|نصيحة|提示)[:：]\s*/i, '')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 sm:px-6 py-3 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-transparent transition-all duration-200 active:scale-95 touch-target disabled:opacity-50"
                >
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                  }}
                  disabled={isSubmitting}
                  className="px-4 sm:px-6 py-3 rounded-xl text-sm font-bold bg-mintcom-green hover:bg-[#6ec29a] text-black transition-all duration-200 active:scale-95 shadow-sm hover:shadow touch-target disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    t('common.continue', { defaultValue: 'Continue' })
                  )}
                </button>
              </div>
            </div>
      </ModalBody>
    </Modal>
  );
}
