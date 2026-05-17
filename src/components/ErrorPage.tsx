
import { useRouteError, isRouteErrorResponse, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ErrorPage() {
    const { t } = useTranslation();
    const error = useRouteError();
    const navigate = useNavigate();

    let title = t('errors.unexpected.title');
    let message = t('errors.unexpected.message');
    let helpfulHint = "";

    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            title = t('errors.notFound.title');
            message = t('errors.notFound.message');
            helpfulHint = t('errors.notFound.hint');
        } else if (error.status === 500) {
            title = t('errors.serverError.title');
            message = t('errors.serverError.message');
        } else {
            title = t('errors.generic.title', { status: error.status });
            message = error.statusText || message;
        }
    } else if (error instanceof Error) {
        // Check for the dynamic import error specifically to give a better message
        // "Failed to fetch dynamically imported module" is the standard Vite error for chunk load failures
        if (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed')) {
            title = t('errors.updateAvailable.title');
            message = t('errors.updateAvailable.message');
            helpfulHint = t('errors.updateAvailable.hint');
        } else {
            message = error.message;
        }
    } else if (typeof error === 'string') {
        message = error;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-mintcom-dark flex items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="max-w-md w-full bg-white dark:bg-mintcom-surface rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-800"
            >
                <motion.div
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                    }}
                    className="w-20 h-20 bg-red-50 dark:bg-mintcom-red/10 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <AlertTriangle className="w-10 h-10 text-mintcom-red" />
                </motion.div>

                <h1 className="font-magilio text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
                    {title}
                </h1>

                <div className="space-y-2 mb-8">
                    <p className="text-sm text-gray-500">
                        {message}
                    </p>
                    {helpfulHint && (
                        <p className="text-sm text-gray-500">
                            {helpfulHint}
                        </p>
                    )}
                </div>

                <div className="flex flex-col space-y-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full flex items-center justify-center space-x-2 bg-mintcom-green hover:bg-mintcom-green/90 text-black text-base font-semibold font-outfit py-3 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                    >
                        <span>{t('common.reloadPage')}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 text-base font-semibold font-outfit py-3 px-4 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>{t('common.goBack')}</span>
                        </button>

                        <Link
                            to="/"
                            className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 text-base font-semibold font-outfit py-3 px-4 rounded-xl transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            <span>{t('common.home')}</span>
                        </Link>
                    </div>
                </div>

                {/* Technical details collapse for developers or further debugging */}
                {(error instanceof Error && !error.message.includes('dynamically imported')) && (
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <details className="group">
                            <summary className="flex items-center justify-center text-xs text-gray-400 dark:text-gray-600 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 transition-colors list-none">
                                <span>{t('common.showTechnicalDetails')}</span>
                                <span className="group-open:rotate-180 transition-transform ml-1">▼</span>
                            </summary>
                            <div className="mt-3 text-left bg-gray-50 dark:bg-mintcom-dark/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                                <pre className="text-xs text-red-500/80 font-mono whitespace-pre-wrap break-words">
                                    {error.stack || error.message}
                                </pre>
                            </div>
                        </details>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

