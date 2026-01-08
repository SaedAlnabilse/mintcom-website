import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  theme?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'full'
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-paymint-green rounded-lg flex items-center justify-center shadow-lg shadow-paymint-green/20 shrink-0">
        <span className="text-black font-black text-lg">P</span>
      </div>
      {variant === 'full' && (
        <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
          Pay<span className="text-paymint-green">Mint</span>
        </span>
      )}
    </div>
  );
};