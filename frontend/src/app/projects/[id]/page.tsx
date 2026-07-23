'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, FileText, Settings, BrainCircuit, Cog, Edit, Plus, Sparkles, X } from 'lucide-react';
import { AuthGuard } from '../../../features/auth/AuthGuard';
import { projectService } from '../../../services/projects';
import { chatService } from '../../../services/chat';
import { useProjectStore } from '../../../store/useProjectStore';
import { useChatStore } from '../../../store/useChatStore';
import { PromptEditor } from '../../../features/prompts/PromptEditor';
import { FileUploader } from '../../../features/files/FileUploader';
import { FileList } from '../../../features/files/FileList';
import { ConversationList } from '../../../features/chat/ConversationList';
import { ChatWindow } from '../../../features/chat/ChatWindow';
import { MessageInput } from '../../../features/chat/MessageInput';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { SettingsModal } from '../../../features/chat/SettingsModal';
import { MemoryModal } from '../../../features/chat/MemoryModal';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const { currentProject, setCurrentProject } = useProjectStore();
  const { conversations, setConversations, addConversation, setActiveConversationId, setMessages, activeConversationId } = useChatStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectDetails = async () => {
      setIsLoading(true);
      try {
        const res = await projectService.getProject(projectId);
        if (res.success && res.data) {
          setCurrentProject(res.data);
        }

        // Fetch project-specific conversations
        const convRes = await chatService.getProjectConversations(projectId);
        if (convRes.success && convRes.data) {
          setConversations(convRes.data);
          if (convRes.data.length > 0) {
            // Find existing conversation ID or set the first one
            if (!activeConversationId || !convRes.data.some(c => c.id === activeConversationId)) {
              setActiveConversationId(convRes.data[0].id);
            }
          } else {
            // Auto create a fresh project chat if none exist
            const title = `Project Chat #1`;
            const newRes = await chatService.createConversation(title, projectId);
            if (newRes.success && newRes.data) {
              addConversation(newRes.data);
              setActiveConversationId(newRes.data.id);
              setMessages([]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load project details', err);
        router.push('/projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId, setCurrentProject, router]);

  const handleCreateNewProjectChat = async () => {
    try {
      const projChats = conversations.filter(c => c.project_id === projectId);
      const title = `Project Chat #${projChats.length + 1}`;
      const res = await chatService.createConversation(title, projectId);
      if (res.success && res.data) {
        addConversation(res.data);
        setActiveConversationId(res.data.id);
        setMessages([]);
      }
    } catch (err) {
      alert('Failed to create new project chat.');
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-white p-6 flex flex-col space-y-6">
          <Skeleton className="h-12 w-64 bg-[#F9FAFB]" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            <Skeleton className="lg:col-span-4 h-[600px] bg-[#F9FAFB]" />
            <Skeleton className="lg:col-span-8 h-[600px] bg-[#F9FAFB]" />
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!currentProject) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col h-screen overflow-hidden text-[#111827] dark:text-slate-100">
        {/* Header */}
        <header className="border-b border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-3 shrink-0 flex items-center justify-between z-40">
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/projects')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Projects
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/chat')}
              leftIcon={<MessageSquare className="w-4 h-4 text-[#F2C94C]" />}
            >
              Go to Chat
            </Button>
            <div className="h-4 w-px bg-[#E5E7EB] dark:bg-slate-800" />
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-[#111827] dark:text-slate-150">{currentProject.name}</h1>
              <Badge variant="amber">Active Project</Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMemoryOpen(true)}
              leftIcon={<BrainCircuit className="w-4 h-4 text-[#F2C94C]" />}
            >
              Memory
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              leftIcon={<Cog className="w-4 h-4 text-[#6B7280]" />}
            >
              Settings
            </Button>
          </div>
        </header>

        {/* Split Layout Container */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Panel Sidebar: Handles project specific chats and buttons */}
          <aside className="lg:col-span-4 border-r border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex flex-col justify-between overflow-y-auto z-40">
            <div className="space-y-5">
              {/* New project chat Button */}
              <button
                onClick={handleCreateNewProjectChat}
                className="w-full flex items-center justify-center space-x-2 bg-[#F2C94C] hover:bg-[#e2b73a] text-[#111827] font-semibold py-3 px-4 rounded-xl shadow-sm transition-all text-xs"
              >
                <Edit className="w-4 h-4" />
                <span>New project chat</span>
              </button>

              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[#6B7280] dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider px-3">
                  <Settings className="w-3 h-3 text-[#F2C94C]" />
                  <span>Project Specifications</span>
                </div>
                <p className="text-xs text-[#6B7280] dark:text-slate-400 leading-relaxed pt-1 px-3">
                  {currentProject.description || 'No description configured.'}
                </p>
              </div>

              {/* Dynamic Project Specific Conversations List */}
              <div className="space-y-2 pt-3 border-t border-[#E5E7EB] dark:border-slate-800">
                <h4 className="text-[10px] font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-wider px-3">
                  Project Chats
                </h4>
                <ConversationList projectId={projectId} />
              </div>
            </div>

            {/* Bottom Actions: Converted specifications and knowledge base areas into buttons */}
            <div className="space-y-2 pt-4 border-t border-[#E5E7EB] dark:border-slate-800">
              <button
                onClick={() => setIsFilesModalOpen(true)}
                className="flex items-center justify-center space-x-2 w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 text-xs font-semibold text-[#111827] dark:text-slate-200 hover:bg-[#FFF7D6]/20 transition-all text-left bg-[#F9FAFB] dark:bg-slate-900"
              >
                <FileText className="w-4 h-4 text-[#F2C94C]" />
                <span>Attach Files</span>
              </button>

              <button
                onClick={() => setIsPromptModalOpen(true)}
                className="flex items-center justify-center space-x-2 w-full p-2.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 text-xs font-semibold text-[#111827] dark:text-slate-200 hover:bg-[#FFF7D6]/20 transition-all text-left bg-[#F9FAFB] dark:bg-slate-900"
              >
                <Sparkles className="w-4 h-4 text-[#F2C94C]" />
                <span>Attach Extra Prompt</span>
              </button>
            </div>
          </aside>

          {/* Right Panel: Clean main chat stream */}
          <main className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative">
            {/* Main Interactive Chat Window */}
            <div className="flex-1 overflow-hidden relative">
              <ChatWindow projectId={projectId} />
            </div>

            {/* Message Input Form */}
            <div className="p-4 border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
              <MessageInput projectId={projectId} />
            </div>
          </main>
        </div>

        {/* Modal Tool: Attach Files */}
        {isFilesModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-fade-in text-[#111827] dark:text-slate-100 flex flex-col max-h-[80vh]">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#F2C94C]" />
                  <h3 className="font-bold text-sm">Project Knowledge Base Files</h3>
                </div>
                <button
                  onClick={() => setIsFilesModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <FileUploader projectId={projectId} />
                <FileList projectId={projectId} />
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button size="sm" onClick={() => setIsFilesModalOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tool: Attach Extra Prompt */}
        {isPromptModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-xl animate-fade-in text-[#111827] dark:text-slate-100 flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#F2C94C]" />
                  <h3 className="font-bold text-sm">System Instructions Prompt</h3>
                </div>
                <button
                  onClick={() => setIsPromptModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <PromptEditor projectId={projectId} />
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button size="sm" onClick={() => setIsPromptModalOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <MemoryModal isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
      </div>
    </AuthGuard>
  );
}
