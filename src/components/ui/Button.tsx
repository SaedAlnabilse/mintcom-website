import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Shared button standard.
 *
 * Primary / md (the default) is THE standard header action (green CTA).
 * Secondary/ghost follow the support system (rounded-xl, stone). The full
 * w-full CTA block lives in `theme.greenCtaButtonClass` for pages that need
 * it. To restyle buttons site-wide, edit those tokens, not this file.
 *
 * Rules for the standard:
 * - radius is always `rounded-xl` (12px, never rounded-2xl / pill)
 * - weight is `font-semibold` (never font-bold / font-black)
 * - hover darkens via opacity (`hover:bg-mintcom-green/90`)
 * - no shadows, no scale transforms on the md tier
 * - layout tokens (`w-full`, `justify-center`, responsive padding) may be
 *   appended via className, but the visual tokens above stay untouched.
 */
const baseClass =
  'inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/40 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

const variantClasses: Record<ButtonVariant, string> = {
  // Colors only — layout (flex, width, padding) comes from sizeClasses below,
  // so this stays composable. Full-block CTA lives in theme.greenCtaButtonClass.
  primary:
    'bg-mintcom-green text-black hover:bg-mintcom-green/90 active:bg-mintcom-green/80',
  secondary:
    'bg-white dark:bg-zinc-900/60 text-stone-700 dark:text-zinc-200 border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800',
  danger:
    'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20',
  ghost:
    'bg-transparent text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-xl text-xs',
  md: 'px-4 py-2.5 rounded-xl text-sm',
  lg: 'px-6 py-3.5 rounded-xl text-base',
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
