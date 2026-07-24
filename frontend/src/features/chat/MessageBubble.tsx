'use client';

import React from 'react';
import { User, Bot } from 'lucide-react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const parseInlineMarkdown = (text: string) => {
    // Match bold **text** and inline `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-[#111827] dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded font-mono text-xs text-rose-600 dark:text-rose-400 border border-[#E5E7EB] dark:border-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Check if line is a bullet point starting with '*' or '-'
      const bulletMatch = line.match(/^(\s*)([\*\-])\s+(.*)$/);
      if (bulletMatch) {
        const textPart = bulletMatch[3];
        return (
          <div key={idx} className="flex items-start space-x-2 my-1 pl-2 text-[#111827] dark:text-slate-100">
            <span className="text-[#F2C94C] shrink-0 mt-1.5">•</span>
            <span className="flex-1">{parseInlineMarkdown(textPart)}</span>
          </div>
        );
      }

      // Check if line is a header
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-bold uppercase tracking-wider mt-3 mb-1 text-[#111827] dark:text-slate-100">
            {parseInlineMarkdown(line.substring(4))}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-sm font-bold mt-4 mb-1.5 text-[#111827] dark:text-slate-100">
            {parseInlineMarkdown(line.substring(3))}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-base font-bold mt-4 mb-2 text-[#111827] dark:text-slate-100">
            {parseInlineMarkdown(line.substring(2))}
          </h2>
        );
      }

      return (
        <p key={idx} className="min-h-[1.25rem] text-[#111827] dark:text-slate-100">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  return (
    <div className={`flex items-start space-x-3.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''} animate-fade-in`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
          isUser
            ? 'bg-[#F9FAFB] dark:bg-slate-900 text-[#6B7280] dark:text-slate-400 border-[#E5E7EB] dark:border-slate-800'
            : 'bg-[#FFF7D6] dark:bg-amber-500/10 text-[#F2C94C] dark:text-amber-450 border-[#FFF0A3] dark:border-amber-500/20 shadow-sm'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4.5 h-4.5 font-bold" />}
      </div>

      <div className={`max-w-2xl space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center space-x-2 text-[10px] text-[#6B7280] dark:text-slate-400 px-1">
          <span className="font-semibold">{isUser ? 'You' : 'Assistant'}</span>
          <span>•</span>
          <span>{formattedTime}</span>
        </div>

        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm border ${
            isUser
              ? 'bg-[#FFF7D6] dark:bg-amber-500/10 text-[#111827] dark:text-slate-100 border-[#FFF0A3] dark:border-amber-550/20 rounded-tr-none'
              : 'bg-[#F9FAFB] dark:bg-slate-900 text-[#111827] dark:text-slate-100 border-[#E5E7EB] dark:border-slate-850 rounded-tl-none'
          }`}
        >
          {renderMarkdown(message.content)}
        </div>
      </div>
    </div>
  );
};
