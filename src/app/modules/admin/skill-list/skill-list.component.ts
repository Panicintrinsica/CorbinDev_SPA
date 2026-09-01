import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink, MatButton, MatIconButton, MatIcon, NamedSkillLevel],
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
    this.skillsService.list(1, 200, filter === 'all' ? undefined : filter).subscribe({
      next: (page) => {
        this.rows.set(page.data);
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
      next: () => this.rows.update((rows) => rows.filter((row) => row._id !== id)),
      error: () => this.error.set(`Could not delete “${skill.name}”.`),
    });
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
    location.assign('/admin/login');
  }
}
