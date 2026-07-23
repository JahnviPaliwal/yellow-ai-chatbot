'use client';

import React, { useEffect } from 'react';
import { FileText, Database, ShieldCheck } from 'lucide-react';
import { fileService } from '../../services/files';
import { useProjectStore } from '../../store/useProjectStore';

interface FileListProps {
  projectId: number;
}

export const FileList: React.FC<FileListProps> = ({ projectId }) => {
  const { projectFiles, setProjectFiles } = useProjectStore();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fileService.getFiles(projectId);
        if (res.success && res.data) {
          setProjectFiles(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch project files', err);
      }
    };
    fetchFiles();
  }, [projectId, setProjectFiles]);

  if (projectFiles.length === 0) {
    return (
      <div className="py-3 text-center text-xs text-[#6B7280] italic">
        No files uploaded to this project yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projectFiles.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <FileText className="w-4 h-4 text-[#F2C94C] shrink-0" />
            <div className="min-w-0">
              <p className="text-[#111827] font-semibold truncate">{file.filename}</p>
              <div className="flex items-center space-x-1.5 text-[10px] text-[#6B7280] font-mono mt-0.5">
                <Database className="w-3 h-3 text-[#6B7280]" />
                <span>{file.provider_file_id}</span>
              </div>
            </div>
          </div>
          <span title="Provider Synced" className="shrink-0 ml-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </span>
        </div>
      ))}
    </div>
  );
};
