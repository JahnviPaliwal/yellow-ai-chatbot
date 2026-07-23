'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Folder, Plus, ShieldCheck, Edit, BrainCircuit } from 'lucide-react';
import { AuthGuard } from '../../features/auth/AuthGuard';
import { useAuthStore } from '../../store/useAuthStore';
import { projectService } from '../../services/projects';
import { Project } from '../../types';
import { ProjectCard } from '../../features/projects/ProjectCard';
import { CreateProjectModal } from '../../features/projects/CreateProjectModal';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useChatStore } from '../../store/useChatStore';
import { chatService } from '../../services/chat';
import { SettingsModal } from '../../features/chat/SettingsModal';
import { MemoryModal } from '../../features/chat/MemoryModal';

export default function ProjectsDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setConversations, conversations, addConversation, setActiveConversationId, setMessages } = useChatStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await projectService.getProjects();
      if (res.success && res.data) {
        setProjects(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    
    const fetchHistory = async () => {
      try {
        const res = await chatService.getUserConversations();
        if (res.success && res.data) {
          setConversations(res.data);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    };
    fetchHistory();
  }, []);

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleStartNewChat = async () => {
    try {
      const title = `Chat #${conversations.length + 1}`;
      const res = await chatService.createConversation(title);
      if (res.success && res.data) {
        addConversation(res.data);
        setActiveConversationId(res.data.id);
        setMessages([]);
        router.push('/chat');
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
        {/* Left Sidebar: Fixed Width (260px) */}
        <aside className="w-[260px] border-r border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col justify-between overflow-y-auto shrink-0 z-40 p-4">
          <div className="space-y-5">
            {/* Logo */}
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
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#6B7280] dark:text-slate-400 hover:text-[#111827] hover:bg-[#FFF7D6]/40 transition-all text-left"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setIsMemoryOpen(true)}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#6B7280] dark:text-slate-400 hover:text-[#111827] hover:bg-[#FFF7D6]/40 transition-all text-left"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Memory</span>
              </button>
              <button
                onClick={() => router.push('/projects')}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#111827] bg-[#FFF7D6] dark:bg-amber-500/10 dark:text-amber-400 transition-all text-left"
              >
                <Folder className="w-4 h-4 text-[#F2C94C]" />
                <span>Projects</span>
              </button>
            </nav>

            <div className="pt-3 border-t border-[#E5E7EB] dark:border-slate-800 text-[11px] text-[#6B7280] dark:text-slate-500 space-y-1 font-mono">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quota: 7 files/day</span>
              </div>
            </div>
          </div>

          {/* User Profile Footer */}
          <div
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-3 pt-3 border-t border-[#E5E7EB] dark:border-slate-800 cursor-pointer hover:bg-[#FFF7D6]/40 dark:hover:bg-slate-905 p-2 rounded-xl -mx-2 transition-all"
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

        {/* Right Area: Projects Content Dashboard */}
        <main className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto p-8">
          <div className="max-w-5xl w-full mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#111827] dark:text-slate-100 tracking-tight">Your Projects</h1>
                <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1">
                  Create and manage isolated AI workspaces with custom system prompts & file context
                </p>
              </div>

              <Button
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Project
              </Button>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Skeleton className="h-48 bg-[#F9FAFB] dark:bg-slate-900" />
                <Skeleton className="h-48 bg-[#F9FAFB] dark:bg-slate-900" />
                <Skeleton className="h-48 bg-[#F9FAFB] dark:bg-slate-900" />
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                icon={Folder}
                title="No Projects Found"
                description="Get started by creating your first AI project to configure system prompts and initiate conversations."
                actionLabel="Create Project"
                onAction={() => setIsModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onDeleted={fetchProjects}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProjectCreated={handleProjectCreated}
        />

        {/* Modals */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <MemoryModal isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
      </div>
    </AuthGuard>
  );
}
