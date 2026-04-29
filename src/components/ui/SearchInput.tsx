import React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatInputPlaceholder } from '../../utils/textCase';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder,
  className = "",
  ...props
}: SearchInputProps) {
  const { t } = useTranslation();
  const defaultPlaceholder = formatInputPlaceholder(placeholder || t('common.search'), t('common.locale'));

  return (
    <div className={`relative group ${className}`}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10 transition-colors">
        <Search size={18} strokeWidth={2.5} />
      </div>
      <input maxLength={255}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={formatInputPlaceholder(defaultPlaceholder, t('common.locale'))}
        className="w-full h-12 pl-11 pr-10 py-3 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-normal text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all shadow-sm"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t('common.clearSearch', 'Clear search')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <X size={12} strokeWidth={2.75} />
        </button>
      )}
    </div>
  );
}

