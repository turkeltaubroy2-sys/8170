import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className = '', ...props }: InputProps) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input 
        className={`form-input ${error ? 'error' : ''} ${className}`} 
        {...props} 
      />
      {error && <p className="login-error" style={{ marginTop: 4, fontSize: '0.8rem' }}>{error}</p>}
    </div>
  );
};
