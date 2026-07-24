'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { chatService } from '../../services/chat';
import { fileService } from '../../services/files';
import { useChatStore } from '../../store/useChatStore';
import { FileUploadQuota } from '../../types';

interface MessageInputProps {
  projectId?: number | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({ projectId }) => {
  const [text, setText] = useState('');
  const [quota, setQuota] = useState<FileUploadQuota | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { activeConversationId, addMessage, setIsGeneratingResponse, isGeneratingResponse, messages, setConversations, updateMessageContent, replaceMessage } = useChatStore();

  const fetchQuota = async () => {
    try {
      const res = await fileService.getQuota();
      if (res.success && res.data) {
        setQuota(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch upload quota', err);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const selectedFile = e.target.files[0];
    setUploadError(null);

    if (quota && quota.remaining_uploads <= 0) {
      setUploadError('Daily file upload limit reached (7 files/day max).');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fileService.uploadFile(selectedFile, projectId || null, activeConversationId || null);
      if (res.success && res.data) {
        setAttachedFile(selectedFile);
        fetchQuota();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to upload file.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !attachedFile) || !activeConversationId || isGeneratingResponse) return;

    const inputMessage = text.trim() || (attachedFile ? `[Attached File: ${attachedFile.name}]` : '');
    const isFirstMessage = messages.length === 0;
    setText('');
    setAttachedFile(null);
    setUploadError(null);
    setIsGeneratingResponse(true);

    // 1. Create temporary local message slots for user and assistant responses
    const tempUserMsgId = -1 * Math.floor(Math.random() * 1000000) - 1;
    const tempAssistantMsgId = tempUserMsgId - 1;

    const tempUserMsg = {
      id: tempUserMsgId,
      conversation_id: activeConversationId,
      role: 'user' as const,
      content: inputMessage,
      created_at: new Date().toISOString(),
    };

    const tempAssistantMsg = {
      id: tempAssistantMsgId,
      conversation_id: activeConversationId,
      role: 'assistant' as const,
      content: '',
      created_at: new Date().toISOString(),
    };

    // Instantly append messages to render state
    addMessage(tempUserMsg);
    addMessage(tempAssistantMsg);

    try {
      const token = localStorage.getItem('access_token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          project_id: projectId || null,
          conversation_id: activeConversationId,
          message: inputMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Streaming response failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader not available');
      }

      const decoder = new TextDecoder();
      let accumulatedResponseText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep the last incomplete line in buffer

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine.startsWith('data: ')) continue;
          
          const rawData = cleanLine.substring(6);
          if (rawData === '[DONE]') continue;

          try {
            const dataObj = JSON.parse(rawData);
            
            if (dataObj.event === 'user_message') {
              replaceMessage(tempUserMsgId, dataObj.message);
            } else if (dataObj.event === 'token') {
              accumulatedResponseText += dataObj.token;
              updateMessageContent(tempAssistantMsgId, accumulatedResponseText);
            } else if (dataObj.event === 'assistant_message') {
              replaceMessage(tempAssistantMsgId, dataObj.message);
            } else if (dataObj.event === 'error') {
              setUploadError(dataObj.message);
            }
          } catch (e) {
            // Catch parsing errors for incomplete lines
          }
        }
      }

      if (isFirstMessage) {
        const listRes = projectId
          ? await chatService.getProjectConversations(projectId)
          : await chatService.getUserConversations();
        if (listRes.success && listRes.data) {
          setConversations(listRes.data);
        }
      }

    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <form onSubmit={handleSend} className="relative mt-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.pptx,.xlsx,.py,.java,.js,.ts,.cpp,.c,.html,.css,.md,.csv,.txt,.json,.dat,.bin,.mp3,.wav,.mp4,.webm"
        onChange={handleFileSelect}
      />

      {uploadError && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {attachedFile && (
        <div className="mb-2 flex items-center justify-between p-2 rounded-xl bg-[#FFF7D6] dark:bg-amber-500/10 border border-[#FFF0A3] dark:border-amber-500/20 text-xs text-[#111827] dark:text-slate-100">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#F2C94C]" />
            <span className="font-medium truncate max-w-xs">{attachedFile.name}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            className="text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-100 p-0.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative rounded-2xl bg-[#F9FAFB] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 focus-within:border-[#F2C94C] focus-within:ring-1 focus-within:ring-[#F2C94C] transition-all p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything or attach a file (code, docs, video, audio, data)..."
          disabled={!activeConversationId || isGeneratingResponse}
          rows={2}
          className="w-full bg-transparent text-[#111827] dark:text-slate-100 placeholder-[#6B7280] dark:placeholder-slate-500 text-sm outline-none resize-none px-3 py-1.5 font-sans"
        />

        <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB] dark:border-slate-800 px-2">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || (quota ? quota.remaining_uploads <= 0 : false)}
              className="flex items-center space-x-1.5 text-xs text-[#6B7280] dark:text-slate-400 hover:text-[#F2C94C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Attach File (Code, Video, Audio, Docs, Binary)"
            >
              <Paperclip className="w-4 h-4" />
              <span>Attach</span>
            </button>

            {quota && (
              <span className="text-[11px] text-[#6B7280] dark:text-slate-400 font-mono">
                {quota.daily_uploaded_count}/7 uploads today
              </span>
            )}
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={(!text.trim() && !attachedFile) || !activeConversationId || isGeneratingResponse}
            isLoading={isGeneratingResponse}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        </div>
      </div>
    </form>
  );
};
