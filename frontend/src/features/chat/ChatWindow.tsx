'use client';

import React, { useEffect, useRef } from 'react';
import { MessageSquare, Bot } from 'lucide-react';
import { chatService } from '../../services/chat';
import { useChatStore } from '../../store/useChatStore';
import { MessageBubble } from './MessageBubble';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';

interface ChatWindowProps {
  projectId?: number | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ projectId }) => {
  const {
    activeConversationId,
    messages,
    setMessages,
    isGeneratingResponse,
  } = useChatStore();

  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeConversationId) return;

    const fetchDetail = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await chatService.getConversationDetail(activeConversationId);
        if (res.success && res.data) {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error('Failed to load conversation history', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchDetail();
  }, [activeConversationId, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGeneratingResponse]);

  if (!activeConversationId) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-white">
        <EmptyState
          icon={MessageSquare}
          title="No Conversation Selected"
          description="Click 'New Chat' or select a conversation from your history list to start chatting."
        />
      </div>
    );
  }

  if (isLoadingHistory) {
    return (
      <div className="p-6 space-y-4 bg-white">
        <Skeleton className="h-16 w-3/4 bg-[#E5E7EB]" />
        <Skeleton className="h-20 w-1/2 ml-auto bg-[#E5E7EB]" />
        <Skeleton className="h-16 w-2/3 bg-[#E5E7EB]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6B7280] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF7D6] flex items-center justify-center text-[#F2C94C] shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#111827]">Conversation Initialized</p>
            <p className="text-xs max-w-sm">
              Type a message or attach a file below to start chatting. OpenAI and Groq AI models will respond dynamically.
            </p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {isGeneratingResponse && (
          <div className="flex items-center space-x-3 text-xs text-[#6B7280] animate-fade-in p-2">
            <Spinner size="sm" />
            <span className="font-medium">Formulating response...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
