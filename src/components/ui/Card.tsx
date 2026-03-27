import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Card = ({ children, title, subtitle, className = '', style, ...props }: CardProps) => {
  return (
    <div className={`card ${className}`} style={style} {...props}>
      {(title || subtitle) && (
        <div className="section-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
