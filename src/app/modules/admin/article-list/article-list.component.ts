import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Article } from '../../../models/article.model';
import { AdminArticleService } from '../admin-article.service';
import { AuthService } from '../../../auth/auth.service';
import { ArticleTypes } from '../../../constants/project.consts';

type Filter = 'all' | 'published' | 'draft';

/** The authoring index: every article, drafts included, with search, category filter, and pagination. */
@Component({
  selector: 'app-admin-article-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    FormsModule,
    MatButton,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss',
})
export class ArticleListComponent {
  private articles = inject(AdminArticleService);
  private auth = inject(AuthService);

  readonly rows = signal<Article[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal<Filter>('all');
  readonly category = signal<string>('all');
  readonly search = signal<string>('');
  readonly page = signal<number>(1);
  readonly size = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly totalCount = signal<number>(0);
  readonly isFirstPage = signal<boolean>(true);
  readonly isLastPage = signal<boolean>(true);

  readonly categoryOptions = [
    { id: 'all', label: 'All Categories' },
    ...ArticleTypes,
  ];

  /** Id of the row awaiting a second click to confirm deletion. */
  readonly confirming = signal<string | null>(null);

  constructor() {
    this.load();
  }

  setFilter(filter: Filter): void {
    if (this.filter() === filter) return;
    this.filter.set(filter);
    this.page.set(1);
    this.load();
  }

  setCategory(cat: string): void {
    if (this.category() === cat) return;
    this.category.set(cat);
    this.page.set(1);
    this.load();
  }

  onSearch(term?: string): void {
    if (term !== undefined) {
      this.search.set(term);
    }
    this.page.set(1);
    this.load();
  }

  clearSearch(): void {
    if (!this.search()) return;
    this.search.set('');
    this.page.set(1);
    this.load();
  }

  onTagClick(tag: string): void {
    this.search.set(tag);
    this.page.set(1);
    this.load();
  }

  goToPage(newPage: number): void {
    if (newPage < 1 || (newPage > this.totalPages() && this.totalPages() > 0) || newPage === this.page()) {
      return;
    }
    this.page.set(newPage);
    this.load();
  }

  goToPrev(): void {
    if (!this.isFirstPage()) {
      this.goToPage(this.page() - 1);
    }
  }

  goToNext(): void {
    if (!this.isLastPage()) {
      this.goToPage(this.page() + 1);
    }
  }

  setSize(newSize: number): void {
    if (this.size() === newSize) return;
    this.size.set(newSize);
    this.page.set(1);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const filter = this.filter();
    const category = this.category();
    const search = this.search().trim();

    this.articles
      .list({
        page: this.page(),
        size: this.size(),
        status: filter === 'all' ? undefined : filter,
        category: category === 'all' ? undefined : category,
        search: search || undefined,
      })
      .subscribe({
        next: (response) => {
          this.rows.set(response.data);
          this.totalPages.set(response.meta.totalPages || 1);
          this.totalCount.set(response.meta.totalCount || 0);
          this.isFirstPage.set(response.meta.isFirstPage ?? response.meta.page <= 1);
          this.isLastPage.set(
            response.meta.isLastPage ?? response.meta.page >= (response.meta.totalPages || 1),
          );
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load articles.');
          this.loading.set(false);
        },
      });
  }

  /**
   * Deletes on the second click. A confirmation step rather than a dialog: the
   * cost of the mistake is a lost article, and the row itself is the clearest
   * possible statement of what is about to go.
   */
  remove(article: Article): void {
    if (this.confirming() !== article._id) {
      this.confirming.set(article._id ?? null);
      return;
    }

    this.confirming.set(null);
    this.articles.delete(article._id!).subscribe({
      next: () => {
        if (this.rows().length === 1 && this.page() > 1) {
          this.page.update((p) => p - 1);
        }
        this.load();
      },
      error: () => this.error.set(`Could not delete “${article.title}”.`),
    });
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    location.assign('/admin/login');
  }
}
