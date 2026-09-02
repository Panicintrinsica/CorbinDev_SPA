import type { OutputData } from '@editorjs/editorjs';

export interface SkillTag {
  _id?: string;
  name: string;
  group?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface Skill extends SkillTag {
  _id?: string;
  notes?: string | OutputData;
  content?: OutputData;
  acquired?: string;
  proficiency?: string;
  level: number;
  logo?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillDraft {
  name: string;
  acquired?: string;
  proficiency?: string;
  level: number;
  logo?: string;
  link?: string;
  group: string;
  notes?: string | OutputData;
  content?: OutputData;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface SkillAdminPage {
  data: Skill[];
  meta: {
    size: number;
    page: number;
    totalPages: number;
    totalCount: number;
    isFirstPage?: boolean;
    isLastPage?: boolean;
  };
}

export interface SkillAdminListParams {
  page?: number;
  size?: number;
  status?: 'published' | 'draft';
  group?: string;
  category?: string;
  search?: string;
  name?: string;
}

export function emptySkill(): Skill {
  return {
    name: '',
    group: 'General',
    level: 0,
    isFeatured: false,
    isPublished: true,
  };
}

