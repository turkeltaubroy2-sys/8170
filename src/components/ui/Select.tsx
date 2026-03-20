import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string; icon?: string }[];
}

export const Select = ({ label, options, className = '', ...props }: SelectProps) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className={`form-select ${className}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.icon && `${opt.icon} `}{opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
