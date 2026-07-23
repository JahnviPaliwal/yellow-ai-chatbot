'use client';

import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Save, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth';
import { fileService } from '../../services/files';
import { FileUploadQuota } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useRouter } from 'next/navigation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user, login, logout } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [quota, setQuota] = useState<FileUploadQuota | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Load current theme from HTML class
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    // Fetch quota details
    const fetchQuota = async () => {
      try {
        const res = await fileService.getQuota();
        if (res.success && res.data) {
          setQuota(res.data);
        }
      } catch (err) {
        console.error('Failed to load quota', err);
      }
    };
    fetchQuota();
  }, [isOpen]);

  const handleToggleTheme = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSuccessMsg(false);
    try {
      const res = await authService.updateMe(name);
      if (res.success && res.data) {
        // Update user store
        const token = localStorage.getItem('access_token') || '';
        login(token, res.data);
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      }
    } catch (err) {
      alert('Failed to update profile name.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-fade-in text-[#111827] dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm">Settings</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Name & Email */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Profile Details</h4>
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 text-sm rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 outline-none cursor-not-allowed"
              />
            </div>
            
            <div className="flex items-center justify-between">
              {successMsg && (
                <span className="flex items-center text-xs text-emerald-600 font-semibold space-x-1 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Profile updated</span>
                </span>
              )}
              <Button
                size="sm"
                onClick={handleSaveProfile}
                isLoading={isSaving}
                className="ml-auto"
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Profile
              </Button>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Theme Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Interface Theme</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleTheme('light')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'border-[#F2C94C] bg-[#FFF7D6]/40 text-[#111827] font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <Sun className="w-4 h-4 text-[#F2C94C]" />
                <span>Light Theme</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleTheme('dark')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'border-[#F2C94C] bg-[#FFF7D6]/20 text-[#F2C94C] font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Dark Theme</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Quota details */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">File Upload Quota</h4>
            {quota ? (
              <div className="flex items-center justify-between text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                <span className="text-slate-500">Daily upload usage:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                  {quota.remaining_uploads} / 7 remaining today
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Loading quota...</p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              logout();
              onClose();
              router.push('/login');
            }}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Logout
          </Button>
        </div>

      </div>
    </div>
  );
};
