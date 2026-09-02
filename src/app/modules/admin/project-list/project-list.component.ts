import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Project } from '../../../models/project.model';
import { AdminProjectService } from '../admin-project.service';
import { AuthService } from '../../../auth/auth.service';
import { ProjectCategories } from '../../../constants/project.consts';

type Filter = 'all' | 'published' | 'draft';

@Component({
  selector: 'app-admin-project-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    FormsModule,
    MatButton,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent {
  private projects = inject(AdminProjectService);
  private auth = inject(AuthService);

  readonly rows = signal<Project[]>([]);
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
    ...ProjectCategories,
  ];

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

  onSkillClick(skillName: string): void {
    this.search.set(skillName);
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

    this.projects
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
          this.error.set('Could not load projects.');
          this.loading.set(false);
        },
      });
  }

  remove(project: Project): void {
    const id = project._id;
    if (!id) return;

    if (this.confirming() !== id) {
      this.confirming.set(id);
      return;
    }

    this.confirming.set(null);
    this.projects.delete(id).subscribe({
      next: () => {
        if (this.rows().length === 1 && this.page() > 1) {
          this.page.update((p) => p - 1);
        }
        this.load();
      },
      error: () => this.error.set(`Could not delete “${project.name}”.`),
    });
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    location.assign('/admin/login');
  }
}
