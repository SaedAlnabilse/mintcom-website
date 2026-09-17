import { SingleSelect } from '../SingleSelect';

// Re-exporting SingleSelect with standardized default styling
// This ensures that if we use SelectInput anywhere, it defaults to the "Mintcom Standard" look.

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
  subtitle?: string;
  group?: string;
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
  searchable?: boolean;
  showSearch?: boolean;
  buttonClassName?: string;
}

export function SelectInput({
  className = "",
  buttonClassName = "",
  ...props
}: SelectInputProps) {
  return (
    <SingleSelect
      {...props}
      className={`w-full ${className}`}
      buttonClassName={`!h-12 !rounded-lg !bg-white dark:!bg-[#1E293B] !border-gray-200 dark:!border-white/10 !text-sm !font-normal hover:!border-mintcom-green/50 transition-colors ${buttonClassName}`}
    />
  );
}

