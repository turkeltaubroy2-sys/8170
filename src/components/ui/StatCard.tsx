import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const StatCard = ({ label, value, icon, color, loading, className = '', style }: StatCardProps) => {
  return (
    <div className={`stat-card ${className}`} style={style}>
      {icon && (
        <div className="stat-icon" style={color ? { background: `${color}22` } : undefined}>
          {icon}
        </div>
      )}
      <div className="stat-info">
        <h3 style={color ? { color } : undefined}>{loading ? '—' : value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
};
