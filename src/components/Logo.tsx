import React from 'react';
import { useTranslation } from 'react-i18next';

// Import SVG logos (vector graphics - infinitely scalable, tiny file size)
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';
import PaymintLeafIcon from '../assets/small-logo.svg';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  theme?: 'auto' | 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

// Explicit dimensions for responsive images (prevents CLS)
const sizeConfig = {
  sm: { height: 24, width: 96 },
  md: { height: 32, width: 128 },
  lg: { height: 40, width: 160 },
};

const iconSizeConfig = {
  sm: { height: 24, width: 24 },
  md: { height: 32, width: 32 },
  lg: { height: 40, width: 40 },
};

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'full',
  theme = 'auto',
  size = 'md'
}) => {
  const { t } = useTranslation();
  const dimensions = sizeConfig[size];
  const iconDimensions = iconSizeConfig[size];

  // For icon variant, show only the leaf logo
  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src={PaymintLeafIcon}
          alt={t('brand.name')}
          width={iconDimensions.width}
          height={iconDimensions.height}
          loading="lazy"
          decoding="async"
          className="object-contain"
          style={{ width: iconDimensions.width, height: iconDimensions.height }}
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
          alt={t('brand.name')}
          width={dimensions.width}
          height={dimensions.height}
          loading="lazy"
          decoding="async"
          className="object-contain"
          style={{ height: dimensions.height, width: 'auto' }}
        />
      </div>
    );
  }

  if (theme === 'dark') {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={PaymintLogoWhite}
          alt={t('brand.name')}
          width={dimensions.width}
          height={dimensions.height}
          loading="lazy"
          decoding="async"
          className="object-contain"
          style={{ height: dimensions.height, width: 'auto' }}
        />
      </div>
    );
  }

  // Auto theme - show appropriate logo based on system theme
  return (
    <div className={`flex items-center ${className}`}>
      {/* Light mode logo */}
      <img
        src={PaymintLogoGreen}
        alt={t('brand.name')}
        width={dimensions.width}
        height={dimensions.height}
        loading="lazy"
        decoding="async"
        className="object-contain dark:hidden"
        style={{ height: dimensions.height, width: 'auto' }}
      />
      {/* Dark mode logo */}
      <img
        src={PaymintLogoWhite}
        alt={t('brand.name')}
        width={dimensions.width}
        height={dimensions.height}
        loading="lazy"
        decoding="async"
        className="object-contain hidden dark:block"
        style={{ height: dimensions.height, width: 'auto' }}
      />
    </div>
  );
};

// Export the SVG imports for use in other components
export { PaymintLogoGreen, PaymintLogoWhite, PaymintLeafIcon };
