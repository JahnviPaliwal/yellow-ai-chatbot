import { apiClient } from './api';
import { APIResponse, FileMetadata, FileUploadQuota } from '../types';

export const fileService = {
  async getQuota(): Promise<APIResponse<FileUploadQuota>> {
    const res = await apiClient.get('/files/quota');
    return res.data;
  },

  async getFiles(projectId: number): Promise<APIResponse<FileMetadata[]>> {
    const res = await apiClient.get(`/projects/${projectId}/files`);
    return res.data;
  },

  async uploadFile(file: File, projectId?: number | null, conversationId?: number | null): Promise<APIResponse<FileMetadata>> {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('project_id', projectId.toString());
    if (conversationId) formData.append('conversation_id', conversationId.toString());

    const res = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};
