import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-5 border border-[#E5E7EB] dark:border-slate-800 bg-[#F9FAFB] dark:bg-slate-900 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[#F2C94C] dark:hover:border-[#F2C94C] hover:bg-[#FFF7D6]/30 dark:hover:bg-slate-900/60 hover:shadow-sm' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
