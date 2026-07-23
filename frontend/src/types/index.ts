export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: number;
  project_id: number;
  content: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  project_id?: number | null;
  project_name?: string | null;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface FileMetadata {
  id: number;
  user_id: number;
  project_id?: number | null;
  conversation_id?: number | null;
  filename: string;
  provider_file_id: string;
  file_type?: string | null;
  uploaded_at: string;
}

export interface FileUploadQuota {
  daily_uploaded_count: number;
  daily_limit: number;
  remaining_uploads: number;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ChatSendPayload {
  project_id?: number | null;
  conversation_id: number;
  message: string;
}

export interface ChatResponseData {
  user_message: Message;
  assistant_message: Message;
}
