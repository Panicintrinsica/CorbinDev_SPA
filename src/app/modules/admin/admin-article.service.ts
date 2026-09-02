import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Article,
  ArticleAdminListParams,
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

  /** Every article including drafts, with pagination, category filter and search. */
  list(
    paramsOrPage: ArticleAdminListParams | number = 1,
    size = 25,
    status?: 'published' | 'draft',
  ) {
    if (typeof paramsOrPage === 'number') {
      return this.http.get<ArticleAdminPage>(`${this.API}/articles/admin`, {
        params: { page: paramsOrPage, size, ...(status ? { status } : {}) },
      });
    }

    const params = paramsOrPage;
    const httpParams: Record<string, string | number> = {};
    if (params.page !== undefined) httpParams['page'] = params.page;
    if (params.size !== undefined) httpParams['size'] = params.size;
    if (params.status) httpParams['status'] = params.status;
    if (params.category && params.category !== 'all') httpParams['category'] = params.category;
    if (params.search && params.search.trim()) httpParams['search'] = params.search.trim();
    if (params.tag && params.tag.trim()) httpParams['tag'] = params.tag.trim();
    if (params.title && params.title.trim()) httpParams['title'] = params.title.trim();

    return this.http.get<ArticleAdminPage>(`${this.API}/articles/admin`, {
      params: httpParams,
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
