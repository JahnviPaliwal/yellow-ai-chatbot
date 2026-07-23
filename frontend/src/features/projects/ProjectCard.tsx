'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Folder, ArrowRight, Calendar, Trash2 } from 'lucide-react';
import { Project } from '../../types';
import { Card } from '../../components/ui/Card';
import { projectService } from '../../services/projects';

interface ProjectCardProps {
  project: Project;
  onDeleted?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDeleted }) => {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      try {
        await projectService.deleteProject(project.id);
        if (onDeleted) onDeleted();
      } catch (err) {
        alert('Failed to delete project.');
      }
    }
  };

  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card
      onClick={() => router.push(`/projects/${project.id}`)}
      className="group relative flex flex-col justify-between h-48 hover:border-[#F2C94C]"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#FFF7D6] text-[#F2C94C] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#FFF0A3]">
            <Folder className="w-5 h-5" />
          </div>
          <button
            onClick={handleDelete}
            className="text-[#6B7280] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white border border-[#E5E7EB]"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-base font-semibold text-[#111827] group-hover:text-[#F2C94C] transition-colors line-clamp-1">
          {project.name}
        </h3>
        <p className="text-xs text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB] text-xs text-[#6B7280]">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
        <span className="flex items-center space-x-1 text-[#F2C94C] font-semibold group-hover:translate-x-0.5 transition-transform">
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Card>
  );
};
