import { Component, computed, inject, signal, viewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import type { OutputData } from '@editorjs/editorjs';
import { Skill, SkillDraft } from '../../../models/skill.model';
import { AdminSkillService } from '../admin-skill.service';
import { EditorComponent } from '../components/editor/editor.component';
import { UiBlocksComponent } from '../../blog/components/ui-blocks/ui-blocks.component';
import { TagComponent } from '../../ui/ui-tag/tag.component';
import { NamedSkillLevel } from '../../../pipes/skill-named-level.pipe';

@Component({
  selector: 'app-admin-skill-editor',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButton,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatSelect,
    MatOption,
    MatSlideToggle,
    EditorComponent,
    UiBlocksComponent,
    TagComponent,
    NamedSkillLevel,
  ],
  templateUrl: './skill-editor.component.html',
  styleUrl: './skill-editor.component.scss',
})
export class AdminSkillEditorComponent implements OnInit {
  private skillsService = inject(AdminSkillService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private editor = viewChild(EditorComponent);

  readonly id = signal<string | null>(null);
  readonly name = signal('');
  readonly group = signal('General');
  readonly acquired = signal('');
  readonly proficiency = signal('Intermediate');
  readonly level = signal(50);
  readonly link = signal('');
  readonly logo = signal('');
  readonly isFeatured = signal(false);
  readonly isPublished = signal(true);
  readonly content = signal<OutputData | undefined>(undefined);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly error = signal<string | null>(null);
  readonly savedAt = signal<Date | null>(null);
  readonly previewing = signal(false);

  readonly isNew = computed(() => this.id() === null);

  readonly groups = [
    'Language',
    'Framework',
    'Database',
    'Technology',
    'General',
    'frontend',
    'backend',
    'Other',
  ];

  readonly proficiencies = ['General', 'Intermediate', 'Advanced', 'Expert'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.load(id);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.skillsService.get(id).subscribe({
      next: (skill) => {
        this.apply(skill);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load that skill.');
        this.loading.set(false);
      },
    });
  }

  private apply(skill: Skill): void {
    this.id.set(skill._id ?? null);
    this.name.set(skill.name ?? '');
    this.group.set(skill.group ?? 'General');
    this.acquired.set(skill.acquired ?? '');
    this.proficiency.set(skill.proficiency ?? 'Intermediate');
    this.level.set(skill.level ?? 0);
    this.link.set(skill.link ?? '');
    this.logo.set(skill.logo ?? '');
    this.isFeatured.set(skill.isFeatured ?? false);
    this.isPublished.set(skill.isPublished ?? true);

    const doc = (typeof skill.content === 'object' && skill.content)
      ? skill.content
      : (typeof skill.notes === 'object' && skill.notes)
        ? (skill.notes as OutputData)
        : undefined;

    this.content.set(doc);
    this.dirty.set(false);
  }

  onContentChange(data: OutputData): void {
    this.content.set(data);
    this.dirty.set(true);
  }

  touch(): void {
    this.dirty.set(true);
  }

  togglePreview(): void {
    this.previewing.update((showing) => !showing);
  }

  async save(publish?: boolean): Promise<void> {
    if (this.saving()) return;

    const body = await this.editor()?.save();
    const name = (this.name() ?? '').trim();
    if (!name) {
      this.error.set('A skill needs a name.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const draft: Partial<SkillDraft> = {
      name,
      group: this.group(),
      acquired: this.acquired() || undefined,
      proficiency: this.proficiency() || undefined,
      level: Number(this.level()) || 0,
      link: (this.link() ?? '').trim() || undefined,
      logo: (this.logo() ?? '').trim() || undefined,
      content: body ?? undefined,
      notes: body ?? undefined,
      isFeatured: this.isFeatured(),
      isPublished: publish ?? this.isPublished(),
    };

    const id = this.id();
    const request = id
      ? this.skillsService.update(id, draft)
      : this.skillsService.create(draft);

    request.subscribe({
      next: (skill) => {
        this.apply(skill);
        this.savedAt.set(new Date());
        this.saving.set(false);

        if (!id && skill._id) {
          void this.router.navigate(['/admin/skills', skill._id], {
            replaceUrl: true,
          });
        }
      },
      error: (error: unknown) => {
        this.error.set(describe(error));
        this.saving.set(false);
      },
    });
  }
}

function describe(error: unknown): string {
  const status = (error as { status?: number })?.status;
  const body = (error as { error?: { error?: string } })?.error;

  if (body?.error) return body.error;
  if (status === 403) return 'This account cannot edit skills.';
  if (status === 0) return 'Could not reach the API.';
  return 'Saving failed.';
}
