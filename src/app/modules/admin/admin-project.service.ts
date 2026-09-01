import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Project,
  ProjectAdminPage,
  ProjectDraft,
} from '../../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class AdminProjectService {
  private http = inject(HttpClient);
  private API = environment.API;

  list(page = 1, size = 100, status?: 'published' | 'draft') {
    return this.http.get<ProjectAdminPage>(`${this.API}/projects/admin`, {
      params: { page, size, ...(status ? { status } : {}) },
    });
  }

  get(id: string) {
    return this.http.get<Project>(`${this.API}/projects/admin/${id}`);
  }

  create(draft: ProjectDraft) {
    return this.http.post<Project>(`${this.API}/projects/admin`, draft);
  }

  update(id: string, draft: Partial<ProjectDraft>) {
    return this.http.put<Project>(`${this.API}/projects/admin/${id}`, draft);
  }

  delete(id: string) {
    return this.http.delete<{ deleted: string }>(`${this.API}/projects/admin/${id}`);
  }
}
