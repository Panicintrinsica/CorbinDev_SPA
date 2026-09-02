import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Skill,
  SkillAdminListParams,
  SkillAdminPage,
  SkillDraft,
  SkillTag,
} from '../../models/skill.model';

@Injectable({
  providedIn: 'root',
})
export class AdminSkillService {
  private http = inject(HttpClient);
  private API = environment.API;

  list(
    paramsOrPage: SkillAdminListParams | number = 1,
    size = 25,
    status?: 'published' | 'draft',
  ) {
    if (typeof paramsOrPage === 'number') {
      return this.http.get<SkillAdminPage>(`${this.API}/skills/admin`, {
        params: { page: paramsOrPage, size, ...(status ? { status } : {}) },
      });
    }

    const params = paramsOrPage;
    const httpParams: Record<string, string | number> = {};
    if (params.page !== undefined) httpParams['page'] = params.page;
    if (params.size !== undefined) httpParams['size'] = params.size;
    if (params.status) httpParams['status'] = params.status;
    if (params.group && params.group !== 'all') httpParams['group'] = params.group;
    if (params.category && params.category !== 'all') httpParams['group'] = params.category;
    if (params.search && params.search.trim()) httpParams['search'] = params.search.trim();
    if (params.name && params.name.trim()) httpParams['name'] = params.name.trim();

    return this.http.get<SkillAdminPage>(`${this.API}/skills/admin`, {
      params: httpParams,
    });
  }

  listIds() {
    return this.http.get<SkillTag[]>(`${this.API}/skills/admin/ids`);
  }

  get(id: string) {
    return this.http.get<Skill>(`${this.API}/skills/admin/${id}`);
  }

  create(draft: Partial<SkillDraft>) {
    return this.http.post<Skill>(`${this.API}/skills/admin`, draft);
  }

  update(id: string, draft: Partial<SkillDraft>) {
    return this.http.put<Skill>(`${this.API}/skills/admin/${id}`, draft);
  }

  delete(id: string) {
    return this.http.delete<{ deleted: string }>(`${this.API}/skills/admin/${id}`);
  }
}
