import { useState } from 'react';
import { Database, Play, CheckCircle, AlertCircle, Loader2, Terminal, Trash2 } from 'lucide-react';
import { DemoDataGenerator } from '../utils/demo-data-generator';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export function DemoDataGeneratorComponent() {
  const { currentEstablishment, account } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<'cafe' | 'restaurant' | 'retail'>('cafe');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleGenerate = async (clearFirst: boolean = false) => {
    if (!currentEstablishment) {
      setError("No establishment selected");
      return;
    }

    const confirmMessage = clearFirst
      ? "⚠️ Warning: This will Delete All Existing Data (Products, Customers, Staff, etc.) and replace it with demo data. Sales history cannot be deleted. Are you sure?"
      : "This will add sample data to your establishment. Are you sure?";

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setLogs([]);
    setIsComplete(false);
    setError(null);

    const generator = new DemoDataGenerator(
      currentEstablishment.id,
      account?.id,
      addLog,
      setProgress
    );

    try {
      if (clearFirst) {
        await generator.clearAll();
      }
      await generator.generateAll(selectedType);
      setIsComplete(true);
      addLog("Done! You can now explore the dashboard.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      addLog("Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Demo Data Generator</h3>
          <p className="text-sm text-gray-500 font-medium">Populate your account with realistic sample data</p>
        </div>
      </div>

      <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          This tool will generate:
          <ul className="list-disc list-inside mt-2 ml-2 space-y-1 font-bold text-gray-600 dark:text-gray-400">
            <li>Product Categories & Items</li>
            <li>Staff Members</li>
            <li>Customers</li>
            <li>Historical Sales Data (Orders)</li>
          </ul>
        </p>

        <div className="mt-6 mb-6">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wide mb-2">
            Select Business Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['cafe', 'restaurant', 'retail'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type as any)}
                disabled={isGenerating}
                className={`
                  py-3 px-4 rounded-xl border-2 font-bold text-sm capitalize transition-all
                  ${selectedType === type
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10'}
                `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
          <button
            onClick={() => handleGenerate(false)}
            disabled={isGenerating || isComplete}
            className={`
              w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg
              ${isComplete
                ? 'bg-green-500 text-white shadow-green-500/20 cursor-default'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-600/20'}
              disabled:opacity-50 disabled:scale-100 disabled:shadow-none
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : isComplete ? (
              <>
                <CheckCircle size={18} />
                Data Generated
              </>
            ) : (
              <>
                <Play size={18} />
                Add Demo Data
              </>
            )}
          </button>

          <button
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50"
          >
            <Trash2 size={18} />
            Reset & Generate
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(isGenerating || logs.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Progress Bar */}
            <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Terminal Logs */}
            <div className="bg-gray-900 text-gray-200 p-4 rounded-xl font-mono text-xs max-h-60 overflow-y-auto border border-gray-800 shadow-inner custom-scrollbar">
              <div className="flex items-center gap-2 mb-3 text-gray-500 border-b border-gray-800 pb-2">
                <Terminal size={12} />
                <span className="tracking-widest font-bold">System Log</span>
              </div>
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="break-all">
                    <span className="text-gray-500 mr-2">{log.split(']')[0]}]</span>
                    <span className={log.toLowerCase().includes('error') || log.toLowerCase().includes('failed') ? 'text-red-400' : 'text-green-400'}>
                      {log.split(']')[1]}
                    </span>
                  </div>
                ))}
                {isGenerating && (
                  <div className="animate-pulse text-indigo-400">_</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle size={20} />
          <span className="font-bold text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
