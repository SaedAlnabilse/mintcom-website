import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QuickInfo } from './QuickInfo';
import { formatInputLabel, formatInputPlaceholder } from '../utils/textCase';
import { GoogleAuthButton } from './GoogleAuthButton';
import { AppleAuthButton, type AppleAuthCredential } from './AppleAuthButton';
import {
    requestStepUpChallenge,
    sendStepUpCode,
    verifyStepUp,
    type StepUpAction,
    type StepUpChallenge,
    type StepUpMethod
} from '../services/stepUp';

interface StepUpVerifierProps {
    /** The high-impact action this proof will authorise. */
    action: StepUpAction;
    /** Record being acted on. Omit for account-level actions. */
    targetId?: string;
    /** Called with a single-use reauth token once the owner has proven presence. */
    onVerified: (reauthToken: string) => void | Promise<void>;
    onError?: (message: string) => void;
    /** Label for the confirm button on the methods that collect a value. */
    submitLabel: string;
    /** Tone of the confirm button — destructive actions get the red variant. */
    tone?: 'danger' | 'primary';
    disabled?: boolean;
    /** Blocks verification until the surrounding form is complete. */
    canSubmit?: boolean;
}

/**
 * Collects a fresh proof that the owner is present, using whichever methods the
 * server says this account can actually produce.
 *
 * The old flow always demanded the account password. Owners who signed up with
 * Google or Apple never chose one, so that gate was unanswerable for them. Here
 * the server decides: password when one exists, the linked provider, and an
 * emailed one-time code which is always offered so nobody is left stranded.
 */
export function StepUpVerifier({
    action,
    targetId,
    onVerified,
    onError,
    submitLabel,
    tone = 'danger',
    disabled = false,
    canSubmit = true
}: StepUpVerifierProps) {
    const { t } = useTranslation();
    const { account } = useAuth();

    const [challenge, setChallenge] = useState<StepUpChallenge | null>(null);
    const [activeMethod, setActiveMethod] = useState<StepUpMethod | null>(null);
    const [isPreparing, setIsPreparing] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [codeSentTo, setCodeSentTo] = useState<string | null>(null);

    const fail = useCallback(
        (err: unknown) => {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message || t('security.verificationFailed');
            onError?.(message);
        },
        [onError, t]
    );

    // Challenges are short-lived and single-use, so one is minted per mount.
    useEffect(() => {
        let cancelled = false;
        setIsPreparing(true);

        requestStepUpChallenge(action, targetId)
            .then((next) => {
                if (cancelled) return;
                setChallenge(next);
                setActiveMethod(next.methods[0] ?? null);
            })
            .catch(() => {
                if (cancelled) return;
                onError?.(
                    t('security.stepUp.challengeFailed', 'Could not start verification. Please try again.')
                );
            })
            .finally(() => {
                if (!cancelled) setIsPreparing(false);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action, targetId]);

    const complete = useCallback(
        async (token: string) => {
            await onVerified(token);
        },
        [onVerified]
    );

    const runVerify = useCallback(
        async (payload: Parameters<typeof verifyStepUp>[1]) => {
            if (!challenge) return;
            try {
                setIsSubmitting(true);
                const token = await verifyStepUp(challenge.challengeId, payload);
                await complete(token);
            } catch (err) {
                fail(err);
            } finally {
                setIsSubmitting(false);
            }
        },
        [challenge, complete, fail]
    );

    const requestCode = useCallback(async () => {
        if (!challenge) return;
        try {
            setIsSubmitting(true);
            const { email } = await sendStepUpCode(challenge.challengeId);
            setCodeSentTo(email);
            setActiveMethod('email-otp');
        } catch (err) {
            fail(err);
        } finally {
            setIsSubmitting(false);
        }
    }, [challenge, fail]);

    const methodLabel = (method: StepUpMethod) => {
        switch (method) {
            case 'password':
                return t('security.stepUp.usePassword', 'Use my password');
            case 'google':
                return t('security.stepUp.useGoogle', 'Verify with Google');
            case 'apple':
                return t('security.stepUp.useApple', 'Verify with Apple');
            case 'email-otp':
                return t('security.stepUp.useEmail', 'Email me a code instead');
        }
    };

    const chooseMethod = (method: StepUpMethod) => {
        if (method === 'email-otp' && !codeSentTo) {
            void requestCode();
            return;
        }
        setActiveMethod(method);
    };

    if (isPreparing) {
        return (
            <div className="flex items-center justify-center gap-3 py-10 text-stone-400">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm font-bold">
                    {t('security.stepUp.preparing', 'Preparing verification…')}
                </span>
            </div>
        );
    }

    if (!challenge) return null;

    const alternatives = challenge.methods.filter((m) => m !== activeMethod);
    const busy = disabled || isSubmitting;
    const confirmClass =
        tone === 'danger'
            ? 'bg-mintcom-red text-white shadow-mintcom-red/20'
            : 'bg-mintcom-green text-black shadow-mintcom-green/20';

    const confirmButton = (onClick: () => void, enabled: boolean) => (
        <button
            type="button"
            onClick={onClick}
            disabled={busy || !enabled || !canSubmit}
            className={`w-full py-4 rounded-xl font-black text-[11px] tracking-[0.15em] uppercase hover:brightness-110 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 active:scale-95 ${confirmClass}`}
        >
            {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} strokeWidth={3} />
            ) : (
                <>
                    <ShieldCheck size={20} strokeWidth={2.5} />
                    {submitLabel}
                </>
            )}
        </button>
    );

    return (
        <div className="space-y-5">
            {activeMethod === 'password' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                            <label className="text-[10px] font-normal text-stone-400 tracking-[0.2em] block">
                                {formatInputLabel(t('security.passwordLabel'), t('common.locale'))}
                            </label>
                            <QuickInfo text={t('security.masterKeyInfo.description')} />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={18} />
                            <input
                                maxLength={255}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                disabled={busy}
                                className="w-full pl-12 pr-12 py-4 bg-stone-50 dark:bg-black/20 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/30 transition-all shadow-sm"
                                placeholder={formatInputPlaceholder('********', t('common.locale'))}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={busy}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    {confirmButton(
                        () =>
                            void runVerify({
                                method: 'password',
                                password,
                                email: account?.email
                            }),
                        password.length > 0
                    )}
                </div>
            )}

            {activeMethod === 'email-otp' && (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100/50 dark:border-blue-500/20 flex items-start gap-3">
                        <Mail className="text-blue-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-[13px] leading-relaxed font-bold text-blue-600/80 dark:text-blue-400/70">
                            {codeSentTo
                                ? t('security.stepUp.codeSent', {
                                      email: codeSentTo,
                                      defaultValue: 'We sent a 6-digit code to {{email}}.'
                                  })
                                : t('security.stepUp.codePending', 'Request a code to continue.')}
                        </p>
                    </div>

                    {codeSentTo ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-normal text-stone-400 tracking-[0.2em] px-1 block">
                                    {formatInputLabel(
                                        t('security.stepUp.codeLabel', 'Verification code'),
                                        t('common.locale')
                                    )}
                                </label>
                                <input
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    autoFocus
                                    disabled={busy}
                                    className="w-full px-5 py-4 bg-stone-50 dark:bg-black/20 border border-stone-200 dark:border-zinc-800 rounded-xl text-center text-2xl font-black tracking-[0.5em] text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-mintcom-green/30 transition-all"
                                    placeholder="000000"
                                />
                                <button
                                    type="button"
                                    onClick={() => void requestCode()}
                                    disabled={busy}
                                    className="text-[11px] font-black text-mintcom-green hover:underline px-1"
                                >
                                    {t('security.stepUp.resendCode', 'Send a new code')}
                                </button>
                            </div>
                            {confirmButton(
                                () => void runVerify({ method: 'email-otp', otp }),
                                otp.length === 6
                            )}
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void requestCode()}
                            disabled={busy}
                            className="w-full py-4 bg-mintcom-green text-black rounded-xl text-sm font-black transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Mail size={18} strokeWidth={3} />
                            {t('security.stepUp.sendCode', 'Send me a code')}
                        </button>
                    )}
                </div>
            )}

            {activeMethod === 'google' && (
                <div className="space-y-3">
                    <p className="text-sm font-bold text-stone-500 dark:text-zinc-400 leading-relaxed">
                        {t('security.stepUp.googleHint', 'Sign in with Google again to confirm it is really you.')}
                    </p>
                    <GoogleAuthButton
                        onSuccess={(credential) => void runVerify({ method: 'google', credential })}
                        onError={(message) => onError?.(message)}
                        text="continue_with"
                        disabled={busy || !canSubmit}
                        nonce={challenge.nonce}
                        forceReauth
                    />
                </div>
            )}

            {activeMethod === 'apple' && (
                <div className="space-y-3">
                    <p className="text-sm font-bold text-stone-500 dark:text-zinc-400 leading-relaxed">
                        {t('security.stepUp.appleHint', 'Sign in with Apple again to confirm it is really you.')}
                    </p>
                    <AppleAuthButton
                        onSuccess={(credential: AppleAuthCredential) =>
                            void runVerify({
                                method: 'apple',
                                identityToken: credential.identityToken,
                                nonce: credential.nonce
                            })
                        }
                        onError={(message) => onError?.(message)}
                        text="continue_with"
                        disabled={busy || !canSubmit}
                        nonce={challenge.nonce}
                    />
                </div>
            )}

            {alternatives.length > 0 && (
                <div className="pt-4 border-t border-stone-100 dark:border-zinc-800 space-y-2">
                    <p className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">
                        {t('security.stepUp.otherWays', 'Another way to verify')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {alternatives.map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => chooseMethod(method)}
                                disabled={busy}
                                className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-[12px] font-black text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {methodLabel(method)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
