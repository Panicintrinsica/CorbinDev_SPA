import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Article, ArticlePage, emptyArticle } from '../../models/article.model';
import { HttpClient } from '@angular/common/http';
import { ViewportScroller } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private API = environment.API;
  private _article = signal<Article>(emptyArticle());
  private _articlePage = signal<Article[]>([]);
  private _searchResults = signal<Article[]>([]);
  private _isLastPage = signal(false);
  private _isFirstPage = signal(true);
  private _currentPage = signal(1);
  private _totalPages = signal(1);

  get currentPage() {
    return this._currentPage;
  }
  get totalPages() {
    return this._totalPages;
  }

  get article() {
    return this._article;
  }
  get articlePage() {
    return this._articlePage;
  }
  get isLastPage() {
    return this._isLastPage;
  }
  get isFirstPage() {
    return this._isFirstPage;
  }

  get searchResults() {
    return this._searchResults;
  }

  constructor(
    private http: HttpClient,
    private viewportScroller: ViewportScroller,
    private router: Router,
  ) {}

  fetchArticle(date: string, selector: string) {
    return this.http
      .get<Article>(`${this.API}/articles`, {
        params: { date: date, uri: selector },
      })
      .subscribe({
        next: (article) => this._article.set(article),
        // A missing or unpublished article is a 404 now rather than a null body.
        // Resetting is what keeps the previously-read article from lingering on
        // screen under the new URL.
        error: () => this._article.set(emptyArticle()),
      });
  }

  fetchPage(size: number, page: number = 1, scroll: boolean = false) {
    const storedFilters = sessionStorage.getItem('blogFilters');
    let filters;

    if (storedFilters) {
      filters = JSON.parse(storedFilters);
    }

    // Prepare the query object for the backend
    const params: any = {
      size: size || 5,
      categories: filters || [],
      page: page || 1,
    };

    // Make the request to the backend
    this.http
      .get<ArticlePage>(`${this.API}/articles/page`, { params })
      .subscribe({
        next: (result) => {
          this._articlePage.set(result.data);
          this._isFirstPage.set(result.meta.isFirstPage);
          this._isLastPage.set(result.meta.isLastPage);

          // Store current page and total pages to manage pagination state
          this._currentPage.set(result.meta.page);
          this._totalPages.set(result.meta.totalPages);

          if (scroll) this.viewportScroller.scrollToPosition([0, 0]);
        },
        error: (error) => {
          console.error(error);
        },
      });
  }

  searchArticles(query: string, navigate: boolean = true) {
    this.http
      .post<ArticlePage>(`${this.API}/articles/search`, { query })
      .subscribe({
        next: (result) => {
          this._searchResults.set(result.data);
          console.log(result);
        },
        error: (error) => {
          console.error(error);
        },
      });

    if (navigate) {
      this.router.navigateByUrl('blog/search');
    }
  }
}
