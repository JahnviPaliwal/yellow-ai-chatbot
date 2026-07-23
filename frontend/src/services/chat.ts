import { apiClient } from './api';
import { APIResponse, ChatResponseData, Conversation, ConversationDetail } from '../types';

export const chatService = {
  async getUserConversations(): Promise<APIResponse<Conversation[]>> {
    const res = await apiClient.get('/conversations');
    return res.data;
  },

  async getProjectConversations(projectId: number): Promise<APIResponse<Conversation[]>> {
    const res = await apiClient.get(`/projects/${projectId}/conversations`);
    return res.data;
  },

  async createConversation(title?: string, projectId?: number | null): Promise<APIResponse<Conversation>> {
    const res = await apiClient.post('/conversations', { title, project_id: projectId });
    return res.data;
  },

  async getConversationDetail(conversationId: number): Promise<APIResponse<ConversationDetail>> {
    const res = await apiClient.get(`/conversations/${conversationId}`);
    return res.data;
  },

  async sendMessage(conversationId: number, message: string, projectId?: number | null): Promise<APIResponse<ChatResponseData>> {
    const res = await apiClient.post('/chat', {
      project_id: projectId || null,
      conversation_id: conversationId,
      message,
    });
    return res.data;
  },

  async deleteConversation(conversationId: number): Promise<APIResponse<null>> {
    const res = await apiClient.delete(`/conversations/${conversationId}`);
    return res.data;
  },

  async togglePinConversation(conversationId: number): Promise<APIResponse<Conversation>> {
    const res = await apiClient.put(`/conversations/${conversationId}/pin`);
    return res.data;
  },
};
