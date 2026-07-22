import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SkillDialogComponent } from '../../skills/skill-dialog/skill-dialog.component';
import { MatAnchor, MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';
import { GoBackDirective } from '../../../directives/go-back.directive';
import { SkillListAnim } from '../../../animations/list.anim';
import { TagComponent } from '../../ui/ui-tag/tag.component';
import { ProjectService } from '../project.service';
import { Meta, Title } from '@angular/platform-browser';
import { SkillTag } from '../../../models/skill.model';

@Component({
  selector: 'app-project',
  animations: [SkillListAnim],
  imports: [
    MatButton,
    MatAnchor,
    MarkdownComponent,
    DatePipe,
    GoBackDirective,
    TagComponent,
  ],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss',
  standalone: true,
})
export class ProjectPageComponent {
  projectService = inject(ProjectService);

  project = this.projectService.projectDetails;
  skills = signal<SkillTag[]>([]);

  constructor(
    route: ActivatedRoute,
    public dialog: MatDialog,
    private meta: Meta,
    private title: Title,
  ) {
    route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.projectService.fetchProjectByURI(slug);
      }
    });

    effect(() => {
      const currentProj = this.project();
      if (currentProj.name) {
        this.title.setTitle(`Corbin.dev - ${currentProj.name}`);
        this.meta.addTags([
          {
            name: 'description',
            content: currentProj.blurb,
          },
        ]);
        this.skills.set(currentProj.skills || []);
      }
    });
  }

  viewSkill(id: string) {
    this.dialog.open(SkillDialogComponent, {
      data: id,
      autoFocus: false,
      width: '100%',
      maxWidth: '600px',
    });
  }
}
