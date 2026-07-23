'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { fileService } from '../../services/files';
import { useProjectStore } from '../../store/useProjectStore';

interface FileUploaderProps {
  projectId: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ projectId }) => {
  const { addProjectFile } = useProjectStore();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await fileService.uploadFile(file, projectId);
      if (res.success && res.data) {
        addProjectFile(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
      />
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-[#F2C94C] bg-[#FFF7D6]/35'
            : 'border-[#E5E7EB] hover:border-[#F2C94C] bg-[#F9FAFB] hover:bg-[#FFF7D6]/20'
        }`}
      >
        <UploadCloud className="w-6 h-6 text-[#F2C94C] mx-auto mb-1.5" />
        <p className="text-xs font-semibold text-[#111827]">
          {isUploading ? 'Uploading & Registering Provider File...' : 'Upload Supporting File'}
        </p>
        <p className="text-[10px] text-[#6B7280] mt-0.5">
          Drag & drop or click to attach document
        </p>
      </div>
    </div>
  );
};
