'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, MessageSquare, Edit, BrainCircuit, ShieldCheck } from 'lucide-react';
import { AuthGuard } from '../../features/auth/AuthGuard';
import { useAuthStore } from '../../store/useAuthStore';
import { ConversationList } from '../../features/chat/ConversationList';
import { ChatWindow } from '../../features/chat/ChatWindow';
import { MessageInput } from '../../features/chat/MessageInput';
import { chatService } from '../../services/chat';
import { useChatStore } from '../../store/useChatStore';
import { SettingsModal } from '../../features/chat/SettingsModal';
import { MemoryModal } from '../../features/chat/MemoryModal';

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addConversation, setActiveConversationId, setMessages, conversations, setConversations, activeConversationId } = useChatStore();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await chatService.getUserConversations();
        if (res.success && res.data) {
          setConversations(res.data);
          if (res.data.length > 0) {
            if (!activeConversationId) {
              setActiveConversationId(res.data[0].id);
            }
          } else {
            const newRes = await chatService.createConversation("New Chat");
            if (newRes.success && newRes.data) {
              addConversation(newRes.data);
              setActiveConversationId(newRes.data.id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize user chat session', err);
      }
    };

    initChat();
  }, []);

  const handleStartNewChat = async () => {
    try {
      const title = `Chat #${conversations.length + 1}`;
      const res = await chatService.createConversation(title);
      if (res.success && res.data) {
        addConversation(res.data);
        setActiveConversationId(res.data.id);
        setMessages([]);
      }
    } catch (err) {
      alert('Failed to initialize chat.');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'JP';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white dark:bg-slate-950 flex h-screen overflow-hidden text-[#111827] dark:text-slate-100">
        {/* Two-Panel Layout */}

        {/* 1. Left Sidebar: Fixed Width (260px) */}
        <aside className="w-[260px] border-r border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col justify-between overflow-y-auto shrink-0 z-40 p-4">
          <div className="space-y-5">
            {/* Logo / M Icon */}
            <div className="flex items-center">
              <div className="w-9 h-9 bg-[#F2C94C] rounded-lg flex items-center justify-center font-bold text-black text-lg font-sans">
                M
              </div>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleStartNewChat}
              className="w-full flex items-center justify-center space-x-2 bg-[#F2C94C] hover:bg-[#e2b73a] text-[#111827] font-semibold py-3 px-4 rounded-xl shadow-sm transition-all text-sm"
            >
              <Edit className="w-4 h-4" />
              <span>New chat</span>
            </button>

            {/* Navigation Menu */}
            <nav className="space-y-1">
              <button
                onClick={() => router.push('/chat')}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#111827] bg-[#FFF7D6]/60 dark:bg-amber-500/10 dark:text-amber-400 transition-all text-left"
              >
                <MessageSquare className="w-4 h-4 text-[#F2C94C]" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setIsMemoryOpen(true)}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200 hover:bg-[#FFF7D6]/40 dark:hover:bg-slate-900 transition-all text-left"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Memory</span>
              </button>
              <button
                onClick={() => router.push('/projects')}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200 hover:bg-[#FFF7D6]/40 dark:hover:bg-slate-900 transition-all text-left"
              >
                <Folder className="w-4 h-4" />
                <span>Projects</span>
              </button>
            </nav>

            {/* Dynamic Conversation History */}
            <div className="space-y-2 pt-2 border-t border-[#E5E7EB] dark:border-slate-800">
              <ConversationList />
            </div>
          </div>

          {/* User Profile Footer */}
          <div
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-3 pt-3 border-t border-[#E5E7EB] dark:border-slate-800 cursor-pointer hover:bg-[#FFF7D6]/40 dark:hover:bg-slate-900 p-2 rounded-xl -mx-2 transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-[#FFF7D6] dark:bg-amber-500/10 border border-[#FFF0A3] dark:border-amber-500/20 flex items-center justify-center font-bold text-[#111827] dark:text-amber-400 text-xs shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#111827] dark:text-slate-200 truncate">{user?.name || 'Jave Pali'}</p>
              <p className="text-[10px] text-[#6B7280] dark:text-slate-500 font-medium">Free</p>
            </div>
          </div>
        </aside>

        {/* 2. Main Content Area: Takes the remaining width */}
        <main className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative">
          {/* Main Chat History (White background, lots of white space) */}
          <div className="flex-1 overflow-hidden relative">
            <ChatWindow projectId={null} />
          </div>

          {/* Bottom Message Input Composer */}
          <div className="p-6 bg-white dark:bg-slate-950 shrink-0 max-w-4xl mx-auto w-full">
            <MessageInput projectId={null} />
          </div>
        </main>

        {/* Modals */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <MemoryModal isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
      </div>
    </AuthGuard>
  );
}
