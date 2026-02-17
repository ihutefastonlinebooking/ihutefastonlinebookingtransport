import React from 'react';

export const Alert = ({ 
  variant = 'info', 
  title, 
  message, 
  onClose,
  className = ''
}) => {
  const variants = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  return (
    <div className={`border-l-4 p-4 mb-4 ${variants[variant]} ${className}`}>
      {title && <p className="font-bold">{title}</p>}
      <p>{message}</p>
      {onClose && (
        <button 
          onClick={onClose}
          className="mt-2 underline hover:no-underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

export const Toast = ({ 
  variant = 'info', 
  message, 
  duration = 3000 
}) => {
  const [show, setShow] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!show) return null;

  const variants = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    warning: 'bg-warning text-white',
    info: 'bg-secondary text-white',
  };

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${variants[variant]}`}>
      {message}
    </div>
  );
};

export default { Alert, Toast };
