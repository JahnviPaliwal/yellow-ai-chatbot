'use client';

import React, { useEffect } from 'react';
import { MessageSquare, Folder, Pin, Trash2 } from 'lucide-react';
import { chatService } from '../../services/chat';
import { useChatStore } from '../../store/useChatStore';
import { Conversation } from '../../types';

interface ConversationListProps {
  projectId?: number | null;
}

export const ConversationList: React.FC<ConversationListProps> = ({ projectId }) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    setConversations,
    updateConversation,
    removeConversation,
  } = useChatStore();

  const fetchConversations = async () => {
    try {
      const res = projectId
        ? await chatService.getProjectConversations(projectId)
        : await chatService.getUserConversations();

      if (res.success && res.data) {
        setConversations(res.data);
        if (res.data.length > 0 && !activeConversationId) {
          setActiveConversationId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [projectId]);

  const handleTogglePin = async (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    try {
      const res = await chatService.togglePinConversation(conv.id);
      if (res.success && res.data) {
        updateConversation(res.data);
      }
    } catch (err) {
      alert('Failed to update pin state.');
    }
  };

  const handleDeleteConv = async (e: React.MouseEvent, convId: number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this chat thread?')) {
      try {
        const res = await chatService.deleteConversation(convId);
        if (res.success) {
          removeConversation(convId);
          if (activeConversationId === convId) {
            setActiveConversationId(null);
          }
        }
      } catch (err) {
        alert('Failed to delete conversation.');
      }
    }
  };

  const pinnedConversations = conversations.filter((c) => c.is_pinned);
  const recentConversations = conversations.filter((c) => !c.is_pinned);

  const renderConvItem = (conv: Conversation) => {
    const isActive = conv.id === activeConversationId;
    const hasProject = !!conv.project_id;

    return (
      <div
        key={conv.id}
        onClick={() => setActiveConversationId(conv.id)}
        className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
          isActive
            ? 'bg-[#FFF7D6] dark:bg-amber-500/10 text-[#111827] dark:text-amber-400 shadow-sm font-semibold'
            : 'text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200 hover:bg-[#FFF7D6]/40 dark:hover:bg-slate-900'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
          {hasProject ? (
            <Folder className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#F2C94C]' : 'text-[#6B7280] dark:text-slate-400'}`} />
          ) : (
            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#F2C94C]' : 'text-[#6B7280] dark:text-slate-400'}`} />
          )}
          <span className="truncate">{conv.title}</span>
        </div>

        <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => handleTogglePin(e, conv)}
            className={`p-1 rounded-md hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-[#E5E7EB] transition-all ${
              conv.is_pinned ? 'text-[#F2C94C]' : 'text-slate-400 hover:text-[#F2C94C]'
            }`}
            title={conv.is_pinned ? 'Unpin chat' : 'Pin chat'}
          >
            <Pin className="w-3 h-3 fill-current" />
          </button>
          <button
            onClick={(e) => handleDeleteConv(e, conv.id)}
            className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-[#E5E7EB] text-slate-400 hover:text-rose-500 transition-all"
            title="Delete chat"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
      {/* Pinned Sub-section */}
      {pinnedConversations.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1 px-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            <Pin className="w-2.5 h-2.5 fill-current text-[#F2C94C]" />
            <span>Pinned</span>
          </div>
          <div className="space-y-0.5">{pinnedConversations.map(renderConvItem)}</div>
        </div>
      )}

      {/* Recent Sub-section */}
      <div className="space-y-1.5">
        {pinnedConversations.length > 0 && (
          <div className="px-3 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            <span>Recent</span>
          </div>
        )}
        <div className="space-y-0.5">
          {recentConversations.length === 0 && pinnedConversations.length === 0 ? (
            <p className="text-xs text-[#6B7280] italic px-2 py-1.5">No chats created yet.</p>
          ) : (
            recentConversations.map(renderConvItem)
          )}
        </div>
      </div>
    </div>
  );
};
