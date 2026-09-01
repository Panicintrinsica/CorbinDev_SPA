import type { OutputData } from '@editorjs/editorjs';
import { SkillTag } from './skill.model';

export interface ProjectCard {
  _id?: string;
  uri: string;
  name: string;
  category: string;
  platform: string;
  link?: string;
  linkType?: string;
  blurb: string;
  thumbnail?: string;
  isFeatured: boolean;
  isPublished: boolean;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

export interface Project extends ProjectCard {
  content?: OutputData;
  details?: string;
  client?: string;
  role?: string;
  skills: SkillTag[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectDraft {
  name: string;
  uri?: string;
  category: string;
  platform: string;
  link?: string;
  linkType?: string;
  blurb?: string;
  content?: OutputData;
  details?: string;
  client?: string;
  role?: string;
  skills: string[];
  startDate?: string;
  endDate?: string;
  thumbnail?: string;
  isCurrent: boolean;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface ProjectAdminPage {
  data: Project[];
  meta: {
    size: number;
    page: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface ProjectLink {
  uri: string;
  name: string;
  category: string;
}

export function emptyProject(): Project {
  return {
    uri: '',
    name: '',
    category: '',
    platform: '',
    blurb: '',
    skills: [],
    isCurrent: false,
    isFeatured: false,
    isPublished: false,
  };
}

