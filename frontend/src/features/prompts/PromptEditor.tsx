'use client';

import React, { useState, useEffect } from 'react';
import { Save, Check, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { promptService } from '../../services/prompts';
import { useProjectStore } from '../../store/useProjectStore';

interface PromptEditorProps {
  projectId: number;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ projectId }) => {
  const { currentPrompt, setCurrentPrompt } = useProjectStore();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await promptService.getPrompt(projectId);
        if (res.success && res.data) {
          setCurrentPrompt(res.data);
          setContent(res.data.content);
        }
      } catch (err) {
        console.error('Failed to load system prompt', err);
      }
    };
    fetchPrompt();
  }, [projectId, setCurrentPrompt]);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const res = await promptService.updatePrompt(projectId, content);
      if (res.success && res.data) {
        setCurrentPrompt(res.data);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to save system prompt.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#F9FAFB] dark:bg-slate-900 rounded-xl p-4 border border-[#E5E7EB] dark:border-slate-800 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#F2C94C]" />
          <h4 className="text-xs font-semibold text-[#111827] dark:text-slate-200 uppercase tracking-wider">
            Active System Prompt
          </h4>
        </div>
        {savedSuccess && (
          <span className="flex items-center text-xs text-emerald-600 font-semibold space-x-1 animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
          </span>
        )}
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter custom instructions for the AI model... (e.g. You are a senior technical writer. Maintain a concise tone.)"
        rows={5}
        className="font-mono text-xs leading-relaxed"
      />

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        >
          {savedSuccess ? 'Saved' : 'Save System Prompt'}
        </Button>
      </div>
    </div>
  );
};
