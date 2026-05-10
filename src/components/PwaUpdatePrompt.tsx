import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[10000] flex w-[calc(100vw-40px)] max-w-sm items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
    >
      <RefreshCw className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2D7A55]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">New PayMint version ready</p>
        <p className="mt-1 text-sm text-slate-600">
          Update now to reload the latest cached app version.
        </p>
        <button
          type="button"
          className="mt-3 rounded-md bg-[#2D7A55] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#236244] focus:outline-none focus:ring-2 focus:ring-[#7CC39F] focus:ring-offset-2"
          onClick={() => void updateServiceWorker(true)}
        >
          Update and reload
        </button>
      </div>
      <button
        type="button"
        aria-label="Dismiss update prompt"
        className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7CC39F]"
        onClick={() => setNeedRefresh(false)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
