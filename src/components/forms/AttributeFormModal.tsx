import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, MousePointerClick, CheckSquare, AlertCircle } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton, TextInput, Toggle, ErrorBanner } from '../ui';
import { QuickInfo } from '../QuickInfo';
import { formatInputPlaceholder } from '../../utils/textCase';
import { TEXT_INPUT_LIMITS } from '../../config/textLimits';

interface Attribute {
    id: string;
    name: string;
    inputType: 'SINGLE_SELECT' | 'MULTI_SELECT';
}

interface AttributeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, inputType: 'SINGLE_SELECT' | 'MULTI_SELECT', isRequired: boolean) => Promise<void>;
    onDelete?: (id: string) => void;
    initialData?: Attribute | null;
    isSubmitting?: boolean;
}

// Force HMR cache invalidation
export function AttributeFormModal({
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    initialData,
    isSubmitting = false,
}: AttributeFormModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [inputType, setInputType] = useState<'SINGLE_SELECT' | 'MULTI_SELECT'>('SINGLE_SELECT');
    const [isRequired, setIsRequired] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            if (initialData) {
                setName(initialData.name);
                setInputType(initialData.inputType);
                setIsRequired(false); // Assuming initialData doesn't have it yet based on interface, but defaulting to false
            } else {
                setName('');
                setInputType('SINGLE_SELECT');
                setIsRequired(false);
            }
        }
    }, [isOpen, initialData]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const errorBannerRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!name.trim()) {
            newErrors.name = t('attributes.errors.nameRequired');
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

        await onSubmit(name, inputType, isRequired);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalHeader
                title={initialData ? t('attributes.editAttribute') : t('attributes.newAttribute')}
                onClose={onClose}
            />

            <ModalBody>
                <form id="attribute-form" onSubmit={handleSubmit} className="space-y-8">
                            {/* Error Banner */}
                            {Object.keys(errors).length > 0 && (
                                <ErrorBanner ref={errorBannerRef} className="animate-pulse">
                                    {t('common.validationError')}
                                </ErrorBanner>
                            )}

                            {/* Name */}
                            <TextInput
                                label={<>{t('attributes.form.nameLabel')} <QuickInfo text={t('attributes.form.nameTip')} /></>}
                                required
                                name="attribute-name"
                                maxLength={TEXT_INPUT_LIMITS.ATTRIBUTE_NAME}
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                                placeholder={formatInputPlaceholder(t('attributes.form.namePlaceholder'), t('common.locale'))}
                                error={errors.name}
                            />

                            {/* Input Type Selection */}
                            <div className="space-y-2">
                                <label className="label-strong block flex items-center gap-1">
                                    {t('attributes.form.typeLabel')}
                                    <QuickInfo text={t('attributes.form.typeTip')} />
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setInputType('SINGLE_SELECT')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden group ${inputType === 'SINGLE_SELECT'
                                            ? 'bg-mintcom-green/10 border-mintcom-green'
                                            : 'bg-white dark:bg-zinc-900/60 border-stone-100 dark:border-zinc-800 hover:border-mintcom-green/30'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${inputType === 'SINGLE_SELECT' ? 'bg-mintcom-green text-black' : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'}`}>
                                            <MousePointerClick size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${inputType === 'SINGLE_SELECT' ? 'text-mintcom-green' : 'text-stone-900 dark:text-zinc-100'}`}>{t('attributes.form.single')}</p>
                                            <p className="text-xs font-medium text-stone-500 mt-1">{t('attributes.form.singleDesc')}</p>
                                        </div>
                                        {inputType === 'SINGLE_SELECT' && (
                                            <div className="absolute top-4 right-4 text-mintcom-green">
                                                <div className="w-2 h-2 rounded-full bg-mintcom-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setInputType('MULTI_SELECT')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden group ${inputType === 'MULTI_SELECT'
                                            ? 'bg-mintcom-green/10 border-mintcom-green'
                                            : 'bg-white dark:bg-zinc-900/60 border-stone-100 dark:border-zinc-800 hover:border-mintcom-green/30'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${inputType === 'MULTI_SELECT' ? 'bg-mintcom-green text-black' : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'}`}>
                                            <CheckSquare size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${inputType === 'MULTI_SELECT' ? 'text-mintcom-green' : 'text-stone-900 dark:text-zinc-100'}`}>{t('attributes.form.multiple')}</p>
                                            <p className="text-xs font-medium text-stone-500 mt-1">{t('attributes.form.multipleDesc')}</p>
                                        </div>
                                        {inputType === 'MULTI_SELECT' && (
                                            <div className="absolute top-4 right-4 text-mintcom-green">
                                                <div className="w-2 h-2 rounded-full bg-mintcom-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Required Toggle */}
                            <div className="flex items-center justify-between p-5 bg-stone-50 dark:bg-zinc-800 rounded-2xl border border-stone-200 dark:border-zinc-800">
                                <div>
                                    <p className="text-sm font-medium text-stone-900 dark:text-zinc-100">{t('attributes.form.requiredLabel')}</p>
                                    <p className="text-xs font-bold text-stone-500 mt-0.5">{t('attributes.form.requiredDesc')}</p>
                                </div>
                                <Toggle
                                    size="lg"
                                    checked={isRequired}
                                    onChange={() => setIsRequired(!isRequired)}
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl p-4 flex gap-3">
                                <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="label-strong font-sans text-blue-500 mb-1">{t('attributes.form.infoTitle')}</p>
                                    <p className="text-xs font-bold text-stone-500 leading-relaxed">
                                        {t('attributes.form.infoDesc')}
                                    </p>
                                </div>
                            </div>

                        </form>
            </ModalBody>

            <ModalFooter>
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(initialData.id)}
                        title={t('common.archive')}
                        className="w-14 h-14 flex items-center justify-center bg-white dark:bg-zinc-800 text-stone-400 hover:text-mintcom-red rounded-xl border border-stone-200 dark:border-zinc-800 transition-all shadow-sm group active:scale-90 shrink-0"
                    >
                        <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
                    </button>
                )}
                <ModalCancelButton onClick={onClose}>
                    {t('common.cancel')}
                </ModalCancelButton>
                <ModalSubmitButton form="attribute-form" loading={isSubmitting}>
                    {initialData ? t('common.save') : t('common.add')}
                </ModalSubmitButton>
            </ModalFooter>
        </Modal>
    );
}


