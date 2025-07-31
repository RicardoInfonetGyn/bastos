import React from 'react';
import { AlertCircle } from 'lucide-react';

const Input = ({ label, type = 'text', icon: Icon, error, ...props }) => {
  return (
    <div className="mb-3"> {/* Reduzido o espaçamento vertical entre inputs */}
      {label && (
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3  items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          className={`w-full px-3 py-2 text-sm rounded-md
            border ${Icon ? 'pl-10' : ''}
            bg-white transition duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          `}
          {...props}
        />
      </div>
      {error && (
        <div className="items-center gap-1 text-red-600 text-xs mt-1">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Input;
