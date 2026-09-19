import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, User, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';
import { GoogleAuthButton } from './GoogleAuthButton';
import { Modal, ModalHeader, ModalBody } from './ui';
import { AppleAuthButton, type AppleAuthCredential } from './AppleAuthButton';

export type RestoreLocationAuthProvider = 'password' | 'google' | 'apple';

export interface RestoreLocationFormData {
    accountEmail: string;
    password: string;
    authProvider: RestoreLocationAuthProvider;
    credential?: string;
    identityToken?: string;
    nonce?: string;
    newLocationLoginId: string;
    newLocationPassword: string;
}

interface RestoreLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRestore: (data: RestoreLocationFormData) => Promise<void>;
    isRestoring: boolean;
    errorMessage?: string | null;
    /**
     * Owner's sign-in provider. Google/Apple owners never chose a password,
     * so the modal collects a federated identity token instead of one.
     */
    authProvider?: RestoreLocationAuthProvider;
}

const EMPTY_FORM: RestoreLocationFormData = {
    accountEmail: '',
    password: '',
    authProvider: 'password',
    newLocationLoginId: '',
    newLocationPassword: '',
};

export function RestoreLocationModal({
    isOpen,
    onClose,
    onRestore,
    isRestoring,
    errorMessage,
    authProvider = 'password',
}: RestoreLocationModalProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<RestoreLocationFormData>({ ...EMPTY_FORM, authProvider });
    const [providerError, setProviderError] = useState<string | null>(null);

    React.useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setFormData({ ...EMPTY_FORM, authProvider });
            setProviderError(null);
        }
    }, [isOpen, authProvider]);

    const handleGoogleSuccess = (credential: string) => {
        setProviderError(null);
        setFormData((current) => ({ ...current, credential }));
        setStep(2);
    };

    const handleAppleSuccess = (credential: AppleAuthCredential) => {
        setProviderError(null);
        setFormData((current) => ({
            ...current,
            identityToken: credential.identityToken,
            nonce: credential.nonce,
        }));
        setStep(2);
    };

    const handleProviderError = (message: string) => {
        setProviderError(message);
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onRestore(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={() => !isRestoring && onClose()} size="sm" closeOnBackdrop={!isRestoring}>
            <ModalHeader
                title={t('security.restore.title')}
                subtitle={t('security.restore.step', { current: step, total: 2 })}
                icon={<RefreshCw size={24} />}
                onClose={() => !isRestoring && onClose()}
                closeDisabled={isRestoring}
            />

            <ModalBody>
                <div>

                        {step === 1 ? (
                            authProvider === 'password' ? (
                            <form onSubmit={handleNext} className="space-y-6">
                                {errorMessage && (
                                    <div role="alert" className="p-4 bg-mintcom-red rounded-2xl border border-mintcom-red text-sm font-bold text-white">
                                        {errorMessage}
                                    </div>
                                )}
                                <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 mb-6">
                                    <div className="flex gap-3">
                                        <Shield className="text-blue-500 shrink-0" size={18} />
                                        <p className="text-xs font-bold text-blue-700 dark:text-blue-400 leading-relaxed">
                                            {t('security.restore.step1Desc')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-normal text-stone-500 dark:text-zinc-400  tracking-normal mb-2 ml-1">
                                            {formatInputLabel(t('security.restore.ownerEmail'), t('common.locale'))}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                maxLength={255}
                                                required
                                                type="email"
                                                value={formData.accountEmail}
                                                onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                                                placeholder={formatInputPlaceholder("owner@example.com", t('common.locale'))}
                                                className="w-full pl-12 pr-4 py-3.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-stone-500 dark:text-zinc-400  tracking-normal mb-2 ml-1">
                                            {formatInputLabel(t('security.restore.ownerPassword'), t('common.locale'))}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                maxLength={255}
                                                required
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder={formatInputPlaceholder("••••••••", t('common.locale'))}
                                                className="w-full pl-12 pr-4 py-3.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-mintcom-green text-black font-semibold text-sm rounded-lg hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors flex items-center justify-center gap-2"
                                >
                                    {t('common.next')}
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                            ) : (
                            <div className="space-y-6">
                                {(errorMessage || providerError) && (
                                    <div role="alert" className="p-4 bg-mintcom-red rounded-2xl border border-mintcom-red text-sm font-bold text-white">
                                        {providerError || errorMessage}
                                    </div>
                                )}
                                <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 mb-6">
                                    <div className="flex gap-3">
                                        <Shield className="text-blue-500 shrink-0" size={18} />
                                        <p className="text-xs font-bold text-blue-700 dark:text-blue-400 leading-relaxed">
                                            {t('security.restore.step1SocialDesc', {
                                                provider: authProvider === 'google' ? 'Google' : 'Apple',
                                                defaultValue: 'Continue with the same {{provider}} account to verify ownership.',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-normal text-stone-500 dark:text-zinc-400  tracking-normal mb-2 ml-1">
                                        {formatInputLabel(t('security.restore.ownerEmail'), t('common.locale'))}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors">
                                            <User size={18} />
                                        </div>
                                        <input
                                            maxLength={255}
                                            required
                                            type="email"
                                            value={formData.accountEmail}
                                            onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                                            placeholder={formatInputPlaceholder("owner@example.com", t('common.locale'))}
                                            className="w-full pl-12 pr-4 py-3.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                                        />
                                    </div>
                                </div>

                                {authProvider === 'google' ? (
                                    <GoogleAuthButton
                                        text="continue_with"
                                        disabled={isRestoring || !formData.accountEmail}
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleProviderError}
                                    />
                                ) : (
                                    <AppleAuthButton
                                        text="continue_with"
                                        disabled={isRestoring || !formData.accountEmail}
                                        onSuccess={handleAppleSuccess}
                                        onError={handleProviderError}
                                    />
                                )}
                            </div>
                            )
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {errorMessage && (
                                    <div role="alert" className="p-4 bg-mintcom-red rounded-2xl border border-mintcom-red text-sm font-bold text-white">
                                        {errorMessage}
                                    </div>
                                )}
                                <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10 mb-6">
                                    <div className="flex gap-3">
                                        <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                                            {t('security.restore.step2Desc')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-normal text-stone-500 dark:text-zinc-400  tracking-normal mb-2 ml-1">
                                            {formatInputLabel(t('security.restore.newLoginId'), t('common.locale'))}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                maxLength={255}
                                                required
                                                type="text"
                                                value={formData.newLocationLoginId}
                                                onChange={(e) => setFormData({ ...formData, newLocationLoginId: e.target.value })}
                                                placeholder={formatInputPlaceholder("E.g. shop_01", t('common.locale'))}
                                                className="w-full pl-12 pr-4 py-3.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-stone-500 dark:text-zinc-400  tracking-normal mb-2 ml-1">
                                            {formatInputLabel(t('security.restore.newPassword'), t('common.locale'))}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                maxLength={255}
                                                required
                                                type="password"
                                                value={formData.newLocationPassword}
                                                onChange={(e) => setFormData({ ...formData, newLocationPassword: e.target.value })}
                                                placeholder={formatInputPlaceholder("••••••••", t('common.locale'))}
                                                className="w-full pl-12 pr-4 py-3.5 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-4 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-stone-200 dark:hover:bg-zinc-800 transition-all"
                                    >
                                        {t('common.back')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isRestoring}
                                        className="flex-[2] py-2.5 bg-mintcom-green text-black font-semibold text-sm rounded-lg hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isRestoring ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : (
                                            t('security.restore.confirm')
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
            </ModalBody>
        </Modal>
    );
}
