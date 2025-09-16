import React, { useState, useEffect } from 'react';
import type { ToastType } from '../../types';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setVisible(true);
    
    // Set a timer to close the toast
    const timer = setTimeout(() => {
      setVisible(false);
      // Give time for the fade-out animation before calling onClose
      const closeTimer = setTimeout(onClose, 300);
      return () => clearTimeout(closeTimer);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "max-w-sm w-full rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out flex items-center";
  const visibilityClasses = visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10";
  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  return (
    <div role="alert" className={`${baseClasses} ${visibilityClasses} ${typeClasses[type]}`}>
        <div className="p-4 flex-1 font-medium">{message}</div>
         <button onClick={onClose} className="ml-4 mr-2 p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
         </button>
    </div>
  );
};

export default Toast;
