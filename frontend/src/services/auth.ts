import { apiClient } from './api';
import { APIResponse, AuthToken, User } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string }): Promise<APIResponse<User>> {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<APIResponse<AuthToken>> {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },

  async getMe(): Promise<APIResponse<User>> {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async updateMe(name: string): Promise<APIResponse<User>> {
    const res = await apiClient.put('/auth/me', { name });
    return res.data;
  },
};
