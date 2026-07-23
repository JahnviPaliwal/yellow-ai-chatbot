import { apiClient } from './api';
import { APIResponse, Prompt } from '../types';

export const promptService = {
  async getPrompt(projectId: number): Promise<APIResponse<Prompt>> {
    const res = await apiClient.get(`/projects/${projectId}/prompt`);
    return res.data;
  },

  async updatePrompt(projectId: number, content: string): Promise<APIResponse<Prompt>> {
    const res = await apiClient.put(`/projects/${projectId}/prompt`, { content });
    return res.data;
  },
};
