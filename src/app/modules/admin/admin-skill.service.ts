import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Skill,
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

  list(page = 1, size = 200, status?: 'published' | 'draft') {
    return this.http.get<SkillAdminPage>(`${this.API}/skills/admin`, {
      params: { page, size, ...(status ? { status } : {}) },
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
