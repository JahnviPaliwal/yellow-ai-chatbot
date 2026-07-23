import { create } from 'zustand';
import { Project, Prompt, FileMetadata } from '../types';

interface ProjectState {
  currentProject: Project | null;
  currentPrompt: Prompt | null;
  projectFiles: FileMetadata[];
  setCurrentProject: (project: Project | null) => void;
  setCurrentPrompt: (prompt: Prompt | null) => void;
  setProjectFiles: (files: FileMetadata[]) => void;
  addProjectFile: (file: FileMetadata) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  currentPrompt: null,
  projectFiles: [],
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
  setProjectFiles: (files) => set({ projectFiles: files }),
  addProjectFile: (file) => set((state) => ({ projectFiles: [file, ...state.projectFiles] })),
}));
