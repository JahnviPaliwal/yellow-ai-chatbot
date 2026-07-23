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
      className={`rounded-xl p-5 border border-[#E5E7EB] bg-[#F9FAFB] transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[#F2C94C] hover:bg-[#FFF7D6]/30 hover:shadow-sm' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
