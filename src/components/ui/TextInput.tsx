import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';

const BASE_INPUT =
  'w-full bg-gray-50 dark:bg-black/20 border rounded-2xl px-5 py-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all shadow-sm';

function inputBorder(hasError: boolean) {
  return hasError
    ? 'border-mintcom-red ring-2 ring-mintcom-red/20'
    : 'border-gray-200 dark:border-white/10';
}

interface FieldWrapperProps {
  label?: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

function FieldWrapper({ label, required, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="label-strong block flex items-center gap-1">
          {label} {required && <span className="text-mintcom-red">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 px-1 text-xs font-medium text-gray-400">{hint}</p>}
      {error && <p className="mt-1.5 px-1 text-xs font-bold text-mintcom-red">{error}</p>}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  fontBold?: boolean;
}

/**
 * Shared text input (5/5 of the UI kit).
 * Same gray surface, radius, focus ring and red error state everywhere.
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, required, error, hint, fontBold = false, className = '', ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <input
        ref={ref}
        className={`${BASE_INPUT} ${fontBold ? 'font-bold' : 'font-medium'} ${inputBorder(!!error)} ${className}`.trim()}
        {...props}
      />
    </FieldWrapper>
  );
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
}

/** Shared textarea — same surface as TextInput. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, required, error, hint, className = '', ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} required={required} error={error} hint={hint}>
      <textarea
        ref={ref}
        className={`${BASE_INPUT} font-medium resize-none ${inputBorder(!!error)} ${className}`.trim()}
        {...props}
      />
    </FieldWrapper>
  );
});
