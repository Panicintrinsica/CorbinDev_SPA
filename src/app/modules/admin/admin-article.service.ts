import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Article,
  ArticleAdminPage,
  ArticleDraft,
} from '../../models/article.model';

/**
 * Authoring calls, all under `/articles/admin` and therefore all requiring
 * `articles:write`. Kept apart from `BlogService` because that one is the public
 * read surface and has no business knowing drafts exist.
 */
@Injectable({
  providedIn: 'root',
})
export class AdminArticleService {
  private http = inject(HttpClient);
  private API = environment.API;

  /** Every article including drafts. `status` narrows to one or the other. */
  list(page = 1, size = 25, status?: 'published' | 'draft') {
    return this.http.get<ArticleAdminPage>(`${this.API}/articles/admin`, {
      params: { page, size, ...(status ? { status } : {}) },
    });
  }

  /** One article with its full block body, published or not. */
  get(id: string) {
    return this.http.get<Article>(`${this.API}/articles/admin/${id}`);
  }

  create(draft: ArticleDraft) {
    return this.http.post<Article>(`${this.API}/articles/admin`, draft);
  }

  update(id: string, draft: Partial<ArticleDraft>) {
    return this.http.put<Article>(`${this.API}/articles/admin/${id}`, draft);
  }

  delete(id: string) {
    return this.http.delete<{ deleted: string }>(`${this.API}/articles/admin/${id}`);
  }
}
