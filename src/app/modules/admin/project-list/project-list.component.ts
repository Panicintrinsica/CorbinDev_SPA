import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Project } from '../../../models/project.model';
import { AdminProjectService } from '../admin-project.service';
import { AuthService } from '../../../auth/auth.service';

type Filter = 'all' | 'published' | 'draft';

@Component({
  selector: 'app-admin-project-list',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButton, MatIconButton, MatIcon],
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
    this.projects.list(1, 100, filter === 'all' ? undefined : filter).subscribe({
      next: (page) => {
        this.rows.set(page.data);
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
      next: () => this.rows.update((rows) => rows.filter((row) => row._id !== id)),
      error: () => this.error.set(`Could not delete “${project.name}”.`),
    });
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    location.assign('/admin/login');
  }
}
