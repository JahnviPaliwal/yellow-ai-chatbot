import { create } from 'zustand';
import { Conversation, Message } from '../types';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Message[];
  isGeneratingResponse: boolean;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: number | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setIsGeneratingResponse: (status: boolean) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Conversation) => void;
  removeConversation: (id: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isGeneratingResponse: false,
  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setIsGeneratingResponse: (status) => set({ isGeneratingResponse: status }),
  addConversation: (conversation) => set((state) => ({ conversations: [conversation, ...state.conversations] })),
  updateConversation: (conversation) =>
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === conversation.id ? conversation : c)),
    })),
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
    })),
}));
