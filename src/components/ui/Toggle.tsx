import { forwardRef, type InputHTMLAttributes, type ReactNode, type ChangeEventHandler } from 'react';

export type ToggleSize = 'sm' | 'md' | 'lg';

const SIZES = {
  sm: {
    track: 'w-10 h-6',
    knob: 'after:top-[2px] after:left-[2px] after:h-5 after:w-5',
    translate: 'peer-checked:after:translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    knob: 'after:top-[2px] after:left-[2px] after:h-5 after:w-5',
    translate: 'peer-checked:after:translate-x-5',
  },
  lg: {
    track: 'w-12 h-7',
    knob: 'after:top-[2px] after:left-[2px] after:h-6 after:w-6',
    translate: 'peer-checked:after:translate-x-5',
  },
} as const;

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  checked?: boolean;
  onChange?: ((checked: boolean) => void) | ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  label?: ReactNode;
  size?: ToggleSize;
  className?: string;
}

/**
 * Shared toggle switch.
 * Supports standard sizes ('sm' | 'md' | 'lg') matching Mintcom design tokens.
 * Compatible with controlled boolean state as well as react-hook-form register.
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  {
    checked,
    onChange,
    disabled = false,
    label,
    size = 'md',
    className = '',
    id,
    ...restInputProps
  },
  ref,
) {
  const sizeConfig = SIZES[size] || SIZES.md;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!onChange) return;
    // If registered via react-hook-form (provides name without explicit checked prop):
    if (restInputProps.name && checked === undefined) {
      (onChange as ChangeEventHandler<HTMLInputElement>)(e);
    } else {
      (onChange as (checked: boolean) => void)(e.target.checked);
    }
  };

  return (
    <label
      className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`.trim()}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only peer"
        {...restInputProps}
      />
      <div
        className={`${sizeConfig.track} bg-stone-200 dark:bg-zinc-800 rounded-full peer peer-checked:bg-mintcom-green after:content-[''] after:absolute ${sizeConfig.knob} after:bg-white after:rounded-full after:transition-all ${sizeConfig.translate} shadow-sm transition-colors peer-disabled:opacity-60`}
      />
      {label && <span className="ml-3 text-sm font-medium text-stone-900 dark:text-zinc-100">{label}</span>}
    </label>
  );
});
