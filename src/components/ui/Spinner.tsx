import React from 'react';

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  trackOpacity?: number;
  strokeWidth?: number;
}

/**
 * Final Optimized Spinner.
 * Focuses on compositor-thread animations (rotation) to avoid lag.
 * High resolution is maintained via SVG vector nature and geometricPrecision on larger screens.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 32,
  color = '#7CC39F',
  className = '',
  trackOpacity = 0.15,
  strokeWidth = 3.5,
}) => {
  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ 
        width: size, 
        height: size,
        animation: 'paymint-spin 0.8s linear infinite',
        willChange: 'transform'
      }}
    >
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full"
        style={{ shapeRendering: 'auto' }}
        aria-hidden="true"
      >
        {/* Background Track */}
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth - 0.5}
          strokeOpacity={trackOpacity}
        />
        {/* Main Arc - Fixed length for maximum smoothness */}
        <path
          d="M20 4 A 16 16 0 0 1 36 20"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

