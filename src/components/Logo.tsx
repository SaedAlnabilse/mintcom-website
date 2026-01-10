import React from 'react';

// Import actual Paymint logos
import PaymintLogoGreen from '../assets/Green Full Logo.png';
import PaymintLogoWhite from '../assets/White Green Full Logo.png';
import PaymintLeafIcon from '../assets/Samll-Logo-removebg-preview.png';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  theme?: 'auto' | 'dark' | 'light'; // 'auto' uses system theme
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'full',
  theme = 'auto',
  size = 'md'
}) => {
  // Size classes for the logo
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };

  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  // For icon variant, show only the SVG leaf logo
  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src={PaymintLeafIcon}
          alt="PayMint"
          className={`${iconSizeClasses[size]} object-contain`}
        />
      </div>
    );
  }

  // For full variant, show the full logo with theme support
  if (theme === 'light') {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={PaymintLogoGreen}
          alt="PayMint"
          className={`${sizeClasses[size]} w-auto object-contain`}
        />
      </div>
    );
  }

  if (theme === 'dark') {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={PaymintLogoWhite}
          alt="PayMint"
          className={`${sizeClasses[size]} w-auto object-contain`}
        />
      </div>
    );
  }

  // Auto theme - show appropriate logo based on system theme
  return (
    <div className={`flex items-center ${className}`}>
      {/* Light mode logo - shows green text */}
      <img
        src={PaymintLogoGreen}
        alt="PayMint"
        className={`${sizeClasses[size]} w-auto object-contain dark:hidden`}
      />
      {/* Dark mode logo - shows white text with green leaf */}
      <img
        src={PaymintLogoWhite}
        alt="PayMint"
        className={`${sizeClasses[size]} w-auto object-contain hidden dark:block`}
      />
    </div>
  );
};