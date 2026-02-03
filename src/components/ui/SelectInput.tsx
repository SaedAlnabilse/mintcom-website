import { SingleSelect } from '../SingleSelect';

// Re-exporting SingleSelect with standardized default styling
// This ensures that if we use SelectInput anywhere, it defaults to the "Paymint Standard" look.

interface Option {
  label: string;
  value: string;
}

interface SelectInputProps {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  allOptionLabel?: string;
  showAllOption?: boolean;
  disabled?: boolean;
}

export function SelectInput({
  className = "",
  ...props
}: SelectInputProps) {
  return (
    <SingleSelect
      {...props}
      className={`w-full ${className}`}
      buttonClassName="!h-12 !rounded-xl !bg-white dark:!bg-[#1E293B] !border-gray-200 dark:!border-white/10 !text-sm !font-bold shadow-sm hover:!border-paymint-green/50 transition-all"
    />
  );
}
