import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full bg-[#F9FAFB] dark:bg-slate-950 text-[#111827] dark:text-slate-100 placeholder-[#6B7280] dark:placeholder-slate-500 text-sm rounded-xl border border-[#E5E7EB] dark:border-slate-800 focus:border-[#F2C94C] dark:focus:border-[#F2C94C] focus:ring-1 focus:ring-[#F2C94C] transition-all duration-150 outline-none px-3.5 py-2.5 resize-none ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
