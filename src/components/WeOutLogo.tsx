import React from 'react';

interface WeOutLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light' | 'purple';
  className?: string;
}

// Colours from the brand image: deep black bg, vivid purple script
const PURPLE = '#7C3AED'; // violet-600 equivalent

export default function WeOutLogo({ size = 'md', variant = 'dark', className = '' }: WeOutLogoProps) {
  const color = variant === 'light' ? '#ffffff' : variant === 'purple' ? PURPLE : PURPLE;

  const sizes = {
    sm: { width: 72,  height: 24,  fontSize: 22 },
    md: { width: 100, height: 34,  fontSize: 30 },
    lg: { width: 160, height: 54,  fontSize: 48 },
  };

  const { width, height, fontSize } = sizes[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-label="weOut"
      role="img"
    >
      <text
        x="2"
        y={height - 4}
        fontFamily="'Georgia', 'Times New Roman', serif"
        fontSize={fontSize}
        fontStyle="italic"
        fontWeight="700"
        fill={color}
        letterSpacing="-1"
      >
        we
        <tspan fontWeight="900" fontStyle="italic">Out</tspan>
      </text>
    </svg>
  );
}
