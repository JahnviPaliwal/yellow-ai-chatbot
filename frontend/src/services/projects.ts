import { apiClient } from './api';
import { APIResponse, Project } from '../types';

export const projectService = {
  async getProjects(): Promise<APIResponse<Project[]>> {
    const res = await apiClient.get('/projects');
    return res.data;
  },

  async getProject(id: number): Promise<APIResponse<Project>> {
    const res = await apiClient.get(`/projects/${id}`);
    return res.data;
  },

  async createProject(data: { name: string; description?: string }): Promise<APIResponse<Project>> {
    const res = await apiClient.post('/projects', data);
    return res.data;
  },

  async updateProject(id: number, data: { name?: string; description?: string }): Promise<APIResponse<Project>> {
    const res = await apiClient.put(`/projects/${id}`, data);
    return res.data;
  },

  async deleteProject(id: number): Promise<APIResponse<null>> {
    const res = await apiClient.delete(`/projects/${id}`);
    return res.data;
  },
};
