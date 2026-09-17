import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Shared button standard — modelled on the Add-ons "New Group" action.
 *
 * Primary / md (the default) is THE standard header action:
 *   flex items-center gap-2 px-4 py-2.5 rounded-lg bg-mintcom-green
 *   text-black font-semibold text-sm
 *   hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors
 *
 * Rules for the standard:
 * - radius is always `rounded-lg` (never rounded-xl / rounded-2xl / pill)
 * - weight is `font-semibold` (never font-bold / font-black)
 * - hover darkens via opacity (`hover:bg-mintcom-green/90`), never `#5fa888`
 * - no shadows, no scale transforms on the md tier
 * - layout tokens (`w-full`, `justify-center`, responsive padding) may be
 *   appended via className, but the visual tokens above stay untouched.
 */
const baseClass =
  'inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/40 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-mintcom-green text-black hover:bg-mintcom-green/90 active:bg-mintcom-green/80',
  secondary:
    'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10',
  danger:
    'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20',
  ghost:
    'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-lg text-xs',
  md: 'px-4 py-2.5 rounded-lg text-sm',
  lg: 'px-6 py-3.5 rounded-lg text-base',
};

/** The canonical primary header-action class as a plain string (for non-Button usages). */
export const primaryActionClass = `${baseClass} ${variantClasses.primary} ${sizeClasses.md}`;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...rest}
    />
  ),
);

Button.displayName = 'Button';

export default Button;
