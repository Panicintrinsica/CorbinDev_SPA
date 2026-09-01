import { Component, computed, inject, signal, viewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { NgSelectComponent } from '@ng-select/ng-select';
import type { OutputData } from '@editorjs/editorjs';
import { Project, ProjectDraft } from '../../../models/project.model';
import { SkillTag } from '../../../models/skill.model';
import { AdminProjectService } from '../admin-project.service';
import { AdminSkillService } from '../admin-skill.service';
import { EditorComponent } from '../components/editor/editor.component';
import { UiBlocksComponent } from '../../blog/components/ui-blocks/ui-blocks.component';
import { TagComponent } from '../../ui/ui-tag/tag.component';

@Component({
  selector: 'app-admin-project-editor',
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
    NgSelectComponent,
    EditorComponent,
    UiBlocksComponent,
    TagComponent,
  ],
  templateUrl: './project-editor.component.html',
  styleUrl: './project-editor.component.scss',
})
export class ProjectEditorComponent implements OnInit {
  private projects = inject(AdminProjectService);
  private skillsService = inject(AdminSkillService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private editor = viewChild(EditorComponent);

  readonly id = signal<string | null>(null);
  readonly name = signal('');
  readonly category = signal('personal');
  readonly platform = signal('Web');
  readonly role = signal('');
  readonly client = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly isCurrent = signal(false);
  readonly link = signal('');
  readonly linkType = signal('');
  readonly thumbnail = signal('');
  readonly blurb = signal('');
  readonly isFeatured = signal(false);
  readonly isPublished = signal(false);
  readonly selectedSkillIds = signal<string[]>([]);
  readonly availableSkills = signal<SkillTag[]>([]);
  readonly content = signal<OutputData | undefined>(undefined);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly error = signal<string | null>(null);
  readonly savedAt = signal<Date | null>(null);
  readonly previewing = signal(false);
  readonly permalink = signal<string | null>(null);

  readonly isNew = computed(() => this.id() === null);

  readonly categories = [
    { value: 'personal', label: 'Personal' },
    { value: 'professional', label: 'Professional' },
    { value: 'openSource', label: 'Open Source' },
    { value: 'academic', label: 'Academic' },
  ];

  readonly platforms = ['Web', 'Mobile', 'Desktop', 'CLI', 'Backend', 'API', 'Other'];

  readonly previewSkills = computed(() => {
    const idSet = new Set(this.selectedSkillIds());
    return this.availableSkills().filter((s) => s._id && idSet.has(s._id));
  });

  ngOnInit(): void {
    this.loadSkills();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.load(id);
  }

  private loadSkills(): void {
    this.skillsService.listIds().subscribe({
      next: (skills) => {
        this.availableSkills.set(skills);
      },
      error: () => {
        console.warn('Could not load skills list');
      },
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.projects.get(id).subscribe({
      next: (project) => {
        this.apply(project);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load that project.');
        this.loading.set(false);
      },
    });
  }

  private apply(project: Project): void {
    this.id.set(project._id ?? null);
    this.name.set(project.name ?? '');
    this.category.set(project.category ?? 'personal');
    this.platform.set(project.platform ?? 'Web');
    this.role.set(project.role ?? '');
    this.client.set(project.client ?? '');
    this.startDate.set(project.startDate ?? '');
    this.endDate.set(project.endDate ?? '');
    this.isCurrent.set(project.isCurrent ?? false);
    this.link.set(project.link ?? '');
    this.linkType.set(project.linkType ?? '');
    this.thumbnail.set(project.thumbnail ?? '');
    this.blurb.set(project.blurb ?? '');
    this.isFeatured.set(project.isFeatured ?? false);
    this.isPublished.set(project.isPublished ?? false);
    this.content.set(project.content);

    const skillIds: string[] = [];
    if (Array.isArray(project.skills)) {
      for (const s of project.skills) {
        if (typeof s === 'string') {
          skillIds.push(s);
        } else if (s && s._id) {
          skillIds.push(s._id);
          if (!this.availableSkills().some((existing) => existing._id === s._id)) {
            this.availableSkills.update((list) => [...list, s]);
          }
        }
      }
    }
    this.selectedSkillIds.set(skillIds);
    this.permalink.set(`/project/${project.uri}`);
    this.dirty.set(false);
  }

  /**
   * If the skill does not exist, creates it immediately in the database
   * and returns the newly created tag to ng-select.
   */
  addSkillTag = (name: string): Promise<SkillTag> => {
    const trimmed = name.trim();
    return new Promise((resolve) => {
      this.skillsService
        .create({
          name: trimmed,
          group: 'General',
          level: 0,
          isFeatured: false,
          isPublished: true,
        })
        .subscribe({
          next: (created) => {
            const tag: SkillTag = {
              _id: created._id,
              name: created.name,
              group: created.group,
              isFeatured: created.isFeatured,
              isPublished: created.isPublished,
            };
            this.availableSkills.update((skills) => [...skills, tag]);
            this.touch();
            resolve(tag);
          },
          error: () => {
            const fallback: SkillTag = { name: trimmed };
            resolve(fallback);
          },
        });
    });
  };

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
      this.error.set('A project needs a name.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const draft: ProjectDraft = {
      name,
      category: this.category(),
      platform: this.platform(),
      role: (this.role() ?? '').trim() || undefined,
      client: (this.client() ?? '').trim() || undefined,
      startDate: this.startDate() || undefined,
      endDate: this.endDate() || undefined,
      isCurrent: this.isCurrent(),
      link: (this.link() ?? '').trim() || undefined,
      linkType: (this.linkType() ?? '').trim() || undefined,
      thumbnail: (this.thumbnail() ?? '').trim() || undefined,
      blurb: (this.blurb() ?? '').trim() || undefined,
      skills: this.selectedSkillIds(),
      content: body ?? undefined,
      isFeatured: this.isFeatured(),
      isPublished: publish ?? this.isPublished(),
    };

    const id = this.id();
    const request = id
      ? this.projects.update(id, draft)
      : this.projects.create(draft);

    request.subscribe({
      next: (project) => {
        this.apply(project);
        this.savedAt.set(new Date());
        this.saving.set(false);

        if (!id && project._id) {
          void this.router.navigate(['/admin/projects', project._id], {
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
  if (status === 403) return 'This account cannot edit projects.';
  if (status === 0) return 'Could not reach the API.';
  return 'Saving failed.';
}
