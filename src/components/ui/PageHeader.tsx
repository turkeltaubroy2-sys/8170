import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, badge, actions }: PageHeaderProps) => {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {actions}
        {badge && <span className="header-badge">{badge}</span>}
      </div>
    </div>
  );
};
