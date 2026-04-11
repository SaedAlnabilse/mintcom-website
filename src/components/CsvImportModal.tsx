import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2,
    Loader2, Trash2, FileWarning, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

// Types
export interface CsvColumn {
    key: string;
    label: string;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean';
}

export interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
    createdCategories?: string[];
}

interface CsvImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    columns: CsvColumn[];
    sampleData: Record<string, string>[];
    sampleFileName: string;
    onImport: (rows: Record<string, string>[]) => Promise<ImportResult>;
    maxRows?: number;
}

// CSV Helpers
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                current += '"';
                i++; // skip escaped quote
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    result.push(current.trim());
    return result;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
    // Normalize line endings
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());

    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.every(v => !v.trim())) continue; // skip fully empty rows

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx]?.trim() || '';
        });
        rows.push(row);
    }

    return { headers, rows };
}

function generateCSV(columns: CsvColumn[], sampleData: Record<string, string>[]): string {
    const headers = columns.map(c => c.label);
    const rows = sampleData.map(row =>
        columns.map(c => {
            const val = row[c.key] || '';
            // Escape values containing commas or quotes
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        })
    );

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// Component
export function CsvImportModal({
    isOpen,
    onClose,
    title,
    description,
    columns,
    sampleData,
    sampleFileName,
    onImport,
    maxRows = 500,
}: CsvImportModalProps) {
    const { t } = useTranslation();
    useScrollLock(isOpen);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [showPreview, setShowPreview] = useState(true);
    const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [fileName, setFileName] = useState('');

    const resetState = useCallback(() => {
        setParsedData([]);
        setParseErrors([]);
        setIsImporting(false);
        setImportResult(null);
        setShowPreview(true);
        setStep('upload');
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleClose = () => {
        resetState();
        onClose();
    };
    // Column Matching
    const matchColumns = useCallback((csvHeaders: string[]): { mapping: Record<string, string>; errors: string[] } => {
        const mapping: Record<string, string> = {};
        const errors: string[] = [];

        for (const col of columns) {
            const key = col.key.toLowerCase();
            const label = col.label.toLowerCase().replace(/\s+/g, '_');

            // Try exact match first, then partial match
            let matchedHeader = csvHeaders.find(h => h === key);
            if (!matchedHeader) matchedHeader = csvHeaders.find(h => h === label);
            if (!matchedHeader) matchedHeader = csvHeaders.find(h => h.includes(key) || key.includes(h));
            if (!matchedHeader) matchedHeader = csvHeaders.find(h => h.includes(label) || label.includes(h));

            if (matchedHeader) {
                mapping[col.key] = matchedHeader;
            } else if (col.required) {
                errors.push(`Required column "${col.label}" not found in CSV. Expected header: "${col.key}" or "${col.label}"`);
            }
        }

        return { mapping, errors };
    }, [columns]);
    // File Processing
    const processFile = useCallback((file: File) => {
        setParseErrors([]);
        setFileName(file.name);

        if (!file.name.endsWith('.csv')) {
            setParseErrors(['Please upload a CSV file (.csv extension)']);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setParseErrors(['File size exceeds 5MB limit']);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                if (!text || !text.trim()) {
                    setParseErrors(['The file is empty']);
                    return;
                }

                const { headers, rows } = parseCSV(text);

                if (headers.length === 0) {
                    setParseErrors(['No headers found in the CSV file']);
                    return;
                }

                if (rows.length === 0) {
                    setParseErrors(['No data rows found in the CSV file']);
                    return;
                }

                if (rows.length > maxRows) {
                    setParseErrors([`CSV contains ${rows.length} rows. Maximum allowed is ${maxRows}. Please split into smaller files.`]);
                    return;
                }

                const { mapping, errors } = matchColumns(headers);

                if (errors.length > 0) {
                    setParseErrors(errors);
                    return;
                }

                // Map CSV data to expected format
                const mappedRows = rows.map(row => {
                    const mapped: Record<string, string> = {};
                    for (const col of columns) {
                        const csvHeader = mapping[col.key];
                        mapped[col.key] = csvHeader ? (row[csvHeader] || '') : '';
                    }
                    return mapped;
                });

                // Validate rows
                const validationErrors: string[] = [];
                const validRows: Record<string, string>[] = [];

                mappedRows.forEach((row, idx) => {
                    const rowNum = idx + 2; // +2 for header row + 0-indexing
                    const missingRequired = columns.filter(c => c.required && !row[c.key]?.trim());

                    if (missingRequired.length > 0) {
                        validationErrors.push(`Row ${rowNum}: Missing required field(s): ${missingRequired.map(c => c.label).join(', ')}`);
                    } else {
                        // Type validation
                        let hasError = false;
                        for (const col of columns) {
                            const val = row[col.key];
                            if (val && col.type === 'number') {
                                const num = Number(val);
                                if (isNaN(num) || num < 0) {
                                    validationErrors.push(`Row ${rowNum}: "${col.label}" must be a valid positive number, got "${val}"`);
                                    hasError = true;
                                }
                            }
                        }
                        if (!hasError) {
                            validRows.push(row);
                        }
                    }
                });

                if (validRows.length === 0) {
                    setParseErrors([
                        'No valid rows found after validation.',
                        ...validationErrors.slice(0, 10),
                        validationErrors.length > 10 ? `...and ${validationErrors.length - 10} more errors` : ''
                    ].filter(Boolean));
                    return;
                }

                setParsedData(validRows);

                if (validationErrors.length > 0) {
                    setParseErrors([
                        `${validRows.length} valid rows found, ${validationErrors.length} rows skipped due to errors:`,
                        ...validationErrors.slice(0, 5),
                        validationErrors.length > 5 ? `...and ${validationErrors.length - 5} more errors` : ''
                    ].filter(Boolean));
                }

                setStep('preview');
            } catch (err) {
                console.error('CSV parse error:', err);
                setParseErrors(['Failed to parse the CSV file. Please check the file format.']);
            }
        };

        reader.onerror = () => {
            setParseErrors(['Failed to read the file. Please try again.']);
        };

        reader.readAsText(file);
    }, [columns, maxRows, matchColumns]);
    // Drag & Drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) processFile(files[0]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) processFile(files[0]);
    };
    // Download Sample
    const downloadSample = () => {
        const csv = generateCSV(columns, sampleData);
        // Add BOM for Excel compatibility
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = sampleFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    // Import
    const handleImport = async () => {
        if (parsedData.length === 0) return;

        try {
            setIsImporting(true);
            const result = await onImport(parsedData);
            setImportResult(result);
            setStep('result');
        } catch (err: any) {
            console.error('Import error:', err);
            setImportResult({
                success: 0,
                failed: parsedData.length,
                errors: [err.message || 'An unexpected error occurred during import'],
            });
            setStep('result');
        } finally {
            setIsImporting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div
                dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                    className="bg-white dark:bg-[#1E293B] w-full sm:w-[95vw] sm:max-w-3xl rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-gray-200 dark:border-white/5"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Mobile drag handle */}
                    <div className="sm:hidden flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                                <FileSpreadsheet size={20} className="text-paymint-green" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{description}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        {/* Step 1: Upload */}
                        {step === 'upload' && (
                            <div className="space-y-5">
                                {/* Download Sample Button */}
                                <button
                                    onClick={downloadSample}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all group"
                                >
                                    <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                                    Download Sample CSV Template
                                </button>

                                {/* Format Info */}
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                    <div className="flex items-start gap-2 mb-3">
                                        <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            Your CSV file should have the following columns:
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {columns.map(col => (
                                            <span
                                                key={col.key}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${col.required
                                                    ? 'bg-paymint-green/10 text-paymint-green border border-paymint-green/20'
                                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10'
                                                    }`}
                                            >
                                                {col.label}
                                                {col.required && <span className="text-paymint-red text-[10px]">*</span>}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-[10px] text-gray-400 font-medium">
                                        <span className="text-paymint-red">*</span> = Required field. Max {maxRows} rows per import.
                                    </p>
                                </div>

                                {/* Drop Zone */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 ${dragOver
                                        ? 'border-paymint-green bg-paymint-green/5 scale-[1.02]'
                                        : 'border-gray-200 dark:border-white/10 hover:border-paymint-green/50 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all ${dragOver ? 'bg-paymint-green text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                                        }`}>
                                        <Upload size={28} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                        {dragOver ? 'Drop your CSV file here' : 'Click or drag & drop your CSV file'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Supports .csv files up to 5MB
                                    </p>
                                </div>

                                {/* Parse Errors */}
                                {parseErrors.length > 0 && (
                                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileWarning size={16} className="text-red-500" />
                                            <p className="text-sm font-bold text-red-600 dark:text-red-400">Issues found</p>
                                        </div>
                                        <ul className="space-y-1">
                                            {parseErrors.map((err, i) => (
                                                <li key={i} className="text-xs text-red-500 dark:text-red-400 flex items-start gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                                    {err}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Preview */}
                        {step === 'preview' && (
                            <div className="space-y-4">
                                {/* File Info */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-paymint-green/10 flex items-center justify-center">
                                            <FileSpreadsheet size={18} className="text-paymint-green" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{fileName}</p>
                                            <p className="text-xs text-gray-500">{parsedData.length} valid row(s) ready to import</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={resetState}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Remove file"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Warnings from validation */}
                                {parseErrors.length > 0 && (
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <AlertCircle size={14} className="text-amber-500" />
                                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Some rows were skipped</p>
                                        </div>
                                        <ul className="space-y-0.5">
                                            {parseErrors.map((err, i) => (
                                                <li key={i} className="text-[11px] text-amber-500 dark:text-amber-400">{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Data Preview Table */}
                                <div>
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
                                    >
                                        {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        {showPreview ? 'Hide' : 'Show'} Preview ({Math.min(parsedData.length, 10)} of {parsedData.length} rows)
                                    </button>

                                    <AnimatePresence>
                                        {showPreview && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="bg-gray-50 dark:bg-white/[0.02]">
                                                                    <th className="px-3 py-2.5 text-left font-black text-gray-400 tracking-widest w-10">#</th>
                                                                    {columns.map(col => (
                                                                        <th key={col.key} className="px-3 py-2.5 text-left font-black text-gray-400 tracking-widest whitespace-nowrap">
                                                                            {col.label}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                                {parsedData.slice(0, 10).map((row, idx) => (
                                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                                                        <td className="px-3 py-2 text-gray-400 font-mono">{idx + 1}</td>
                                                                        {columns.map(col => (
                                                                            <td key={col.key} className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[200px] truncate font-medium">
                                                                                {row[col.key] || <span className="text-gray-300 dark:text-gray-600 italic">empty</span>}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    {parsedData.length > 10 && (
                                                        <div className="px-3 py-2 bg-gray-50 dark:bg-white/[0.02] text-center text-[11px] text-gray-400 font-medium border-t border-gray-100 dark:border-white/5">
                                                            ...and {parsedData.length - 10} more row(s)
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Result */}
                        {step === 'result' && importResult && (
                            <div className="space-y-5">
                                {/* Result Summary */}
                                <div className={`p-6 rounded-2xl text-center ${importResult.failed === 0
                                    ? 'bg-paymint-green/10 dark:bg-paymint-green/ border border-paymint-green/20 dark:border-paymint-green/'
                                    : importResult.success === 0
                                        ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20'
                                        : 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20'
                                    }`}>
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${importResult.failed === 0
                                        ? 'bg-paymint-green/ text-paymint-green'
                                        : importResult.success === 0
                                            ? 'bg-red-500/10 text-red-500'
                                            : 'bg-amber-500/10 text-amber-500'
                                        }`}>
                                        {importResult.failed === 0 ? (
                                            <CheckCircle2 size={32} />
                                        ) : (
                                            <AlertCircle size={32} />
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                        {importResult.failed === 0
                                            ? 'Import Successful!'
                                            : importResult.success === 0
                                                ? 'Import Failed'
                                                : 'Partial Import'}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {importResult.success} imported successfully
                                        {importResult.failed > 0 && `, ${importResult.failed} failed`}
                                    </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl bg-paymint-green/10 dark:bg-paymint-green/ border border-paymint-green/20 dark:border-paymint-green/ text-center">
                                        <p className="text-2xl font-black text-paymint-green">{importResult.success}</p>
                                        <p className="text-xs font-bold text-paymint-green dark:text-paymint-green mt-1">Successful</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-center">
                                        <p className="text-2xl font-black text-red-500">{importResult.failed}</p>
                                        <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">Failed</p>
                                    </div>
                                </div>

                                {/* Created Categories */}
                                {importResult.createdCategories && importResult.createdCategories.length > 0 && (
                                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 size={14} className="text-blue-500" />
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                {importResult.createdCategories.length} new categor{importResult.createdCategories.length === 1 ? 'y' : 'ies'} auto-created:
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {importResult.createdCategories.map((cat, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-bold">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Error Details */}
                                {importResult.errors.length > 0 && (
                                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20">
                                        <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">Error details:</p>
                                        <ul className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                            {importResult.errors.map((err, i) => (
                                                <li key={i} className="text-[11px] text-red-500 dark:text-red-400 flex items-start gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                                    {err}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 bg-gray-50 dark:bg-black/20">
                        {step === 'upload' && (
                            <button
                                onClick={handleClose}
                                className="flex-1 h-12 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 font-bold text-sm hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                        )}

                        {step === 'preview' && (
                            <>
                                <button
                                    onClick={resetState}
                                    className="flex-1 h-12 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 font-bold text-sm hover:text-gray-900 dark:hover:text-white transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={isImporting || parsedData.length === 0}
                                    className="flex-[2] h-12 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-[#68B390] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            Import {parsedData.length} Row{parsedData.length !== 1 ? 's' : ''}
                                        </>
                                    )}
                                </button>
                            </>
                        )}

                        {step === 'result' && (
                            <button
                                onClick={handleClose}
                                className="flex-1 h-12 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-[#68B390] active:scale-[0.98] transition-all shadow-lg shadow-paymint-green/20"
                            >
                                Done
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}


