import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-[#F9FAFB] text-[#111827] placeholder-[#6B7280] text-sm rounded-xl border border-[#E5E7EB] focus:border-[#F2C94C] focus:ring-1 focus:ring-[#F2C94C] transition-all duration-150 outline-none ${
              leftIcon ? 'pl-10' : 'px-3.5'
            } py-2.5 ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
