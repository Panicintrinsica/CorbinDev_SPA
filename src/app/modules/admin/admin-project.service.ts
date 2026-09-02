import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Project,
  ProjectAdminListParams,
  ProjectAdminPage,
  ProjectDraft,
} from '../../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class AdminProjectService {
  private http = inject(HttpClient);
  private API = environment.API;

  list(
    paramsOrPage: ProjectAdminListParams | number = 1,
    size = 25,
    status?: 'published' | 'draft',
  ) {
    if (typeof paramsOrPage === 'number') {
      return this.http.get<ProjectAdminPage>(`${this.API}/projects/admin`, {
        params: { page: paramsOrPage, size, ...(status ? { status } : {}) },
      });
    }

    const params = paramsOrPage;
    const httpParams: Record<string, string | number> = {};
    if (params.page !== undefined) httpParams['page'] = params.page;
    if (params.size !== undefined) httpParams['size'] = params.size;
    if (params.status) httpParams['status'] = params.status;
    if (params.category && params.category !== 'all') httpParams['category'] = params.category;
    if (params.platform && params.platform !== 'all') httpParams['platform'] = params.platform;
    if (params.search && params.search.trim()) httpParams['search'] = params.search.trim();
    if (params.name && params.name.trim()) httpParams['name'] = params.name.trim();

    return this.http.get<ProjectAdminPage>(`${this.API}/projects/admin`, {
      params: httpParams,
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
