import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'font-semibold rounded-lg transition duration-200 ease-in-out';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-orange-700 disabled:bg-gray-400',
    secondary: 'bg-secondary text-white hover:bg-blue-900 disabled:bg-gray-400',
    danger: 'bg-error text-white hover:bg-red-600 disabled:bg-gray-400',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
