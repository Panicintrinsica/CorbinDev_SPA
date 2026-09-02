import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Skill } from '../../../models/skill.model';
import { AdminSkillService } from '../admin-skill.service';
import { AuthService } from '../../../auth/auth.service';
import { NamedSkillLevel } from '../../../pipes/skill-named-level.pipe';

type Filter = 'all' | 'published' | 'draft';

@Component({
  selector: 'app-admin-skill-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButton,
    MatIconButton,
    MatIcon,
    NamedSkillLevel,
  ],
  templateUrl: './skill-list.component.html',
  styleUrl: './skill-list.component.scss',
})
export class AdminSkillListComponent {
  private skillsService = inject(AdminSkillService);
  private auth = inject(AuthService);

  readonly rows = signal<Skill[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal<Filter>('all');
  readonly group = signal<string>('all');
  readonly search = signal<string>('');
  readonly page = signal<number>(1);
  readonly size = signal<number>(10);
  readonly totalPages = signal<number>(1);
  readonly totalCount = signal<number>(0);
  readonly isFirstPage = signal<boolean>(true);
  readonly isLastPage = signal<boolean>(true);

  readonly groupOptions = [
    { id: 'all', label: 'All Groups' },
    { id: 'Language', label: 'Language' },
    { id: 'Framework', label: 'Framework' },
    { id: 'Database', label: 'Database' },
    { id: 'Technology', label: 'Technology' },
    { id: 'General', label: 'General' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'Other', label: 'Other' },
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

  setGroup(group: string): void {
    if (this.group() === group) return;
    this.group.set(group);
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

  onGroupClick(groupName?: string): void {
    if (!groupName) return;
    this.setGroup(groupName);
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
    const group = this.group();
    const search = this.search().trim();

    this.skillsService
      .list({
        page: this.page(),
        size: this.size(),
        status: filter === 'all' ? undefined : filter,
        group: group === 'all' ? undefined : group,
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
          this.error.set('Could not load skills.');
          this.loading.set(false);
        },
      });
  }

  remove(skill: Skill): void {
    const id = skill._id;
    if (!id) return;

    if (this.confirming() !== id) {
      this.confirming.set(id);
      return;
    }

    this.confirming.set(null);
    this.skillsService.delete(id).subscribe({
      next: () => {
        if (this.rows().length === 1 && this.page() > 1) {
          this.page.update((p) => p - 1);
        }
        this.load();
      },
      error: () => this.error.set(`Could not delete “${skill.name}”.`),
    });
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    location.assign('/admin/login');
  }
}
