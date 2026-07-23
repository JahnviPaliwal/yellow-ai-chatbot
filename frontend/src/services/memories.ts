import { apiClient } from './api';
import { APIResponse } from '../types';

export interface MemoryItem {
  id: number;
  user_id: number;
  conversation_id: number;
  content: string;
  created_at: string;
  conversation_title?: string;
}

export const memoryService = {
  async getMemories(conversationId?: number): Promise<APIResponse<MemoryItem[]>> {
    const res = await apiClient.get('/memories', {
      params: conversationId ? { conversation_id: conversationId } : undefined,
    });
    return res.data;
  },

  async saveMemory(content: string, conversationId: number): Promise<APIResponse<MemoryItem>> {
    const res = await apiClient.post('/memories', {
      content,
      conversation_id: conversationId,
    });
    return res.data;
  },

  async deleteMemory(memoryId: number): Promise<APIResponse<null>> {
    const res = await apiClient.delete(`/memories/${memoryId}`);
    return res.data;
  },
};
