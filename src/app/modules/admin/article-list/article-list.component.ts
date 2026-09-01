import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Article } from '../../../models/article.model';
import { AdminArticleService } from '../admin-article.service';
import { AuthService } from '../../../auth/auth.service';

type Filter = 'all' | 'published' | 'draft';

/** The authoring index: every article, drafts included, with the way in to each. */
@Component({
  selector: 'app-admin-article-list',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButton, MatIconButton, MatIcon],
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
  /** Id of the row awaiting a second click to confirm deletion. */
  readonly confirming = signal<string | null>(null);

  constructor() {
    this.load();
  }

  setFilter(filter: Filter): void {
    this.filter.set(filter);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const filter = this.filter();
    this.articles.list(1, 100, filter === 'all' ? undefined : filter).subscribe({
      next: (page) => {
        this.rows.set(page.data);
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
      next: () => this.rows.update((rows) => rows.filter((row) => row._id !== article._id)),
      error: () => this.error.set(`Could not delete “${article.title}”.`),
    });
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    location.assign('/admin/login');
  }
}
