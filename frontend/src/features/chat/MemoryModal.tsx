'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, BrainCircuit, Calendar, MessageSquare } from 'lucide-react';
import { memoryService, MemoryItem } from '../../services/memories';
import { Button } from '../../components/ui/Button';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose }) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const res = await memoryService.getMemories();
      if (res.success && res.data) {
        setMemories(res.data);
      }
    } catch (err) {
      console.error('Failed to load memories', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen]);

  const handleDelete = async (memoryId: number) => {
    if (confirm('Are you sure you want to permanently delete this memory? The assistant will forget this information for the associated conversation.')) {
      try {
        const res = await memoryService.deleteMemory(memoryId);
        if (res.success) {
          setMemories((prev) => prev.filter((m) => m.id !== memoryId));
        }
      } catch (err) {
        alert('Failed to delete memory reference.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-fade-in text-[#111827] dark:text-slate-100 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <BrainCircuit className="w-5 h-5 text-[#F2C94C]" />
            <h3 className="font-bold text-sm">Saved AI Memories</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            The assistant automatically extracts preferences, facts, and info you instruct it to remember. All saved memories are listed below along with their associated chat thread.
          </p>

          {isLoading ? (
            <div className="space-y-2 py-4">
              <div className="h-14 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse" />
              <div className="h-14 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <BrainCircuit className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs font-semibold text-slate-400 italic">No saved memories yet.</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Tell the assistant inside any chat: "Remember that this project uses Python" to store a preference.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {memories.map((mem) => {
                const dateStr = new Date(mem.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <div
                    key={mem.id}
                    className="flex items-start justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-2 pr-4 flex-1">
                      <p className="font-medium leading-relaxed">{mem.content}</p>
                      
                      <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Saved {dateStr}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-[#FFF7D6] dark:bg-amber-500/10 text-[#111827] dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                          <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[150px]">{mem.conversation_title || 'General Chat'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(mem.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-950 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 shrink-0 align-self-start"
                      title="Forget memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </div>
  );
};
