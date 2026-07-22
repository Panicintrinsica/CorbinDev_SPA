import { Component, computed, signal } from '@angular/core';
import { Skill } from '../../../models/skill.model';
import { ContentService } from '../../../services/content.service';
import { SkillDialogComponent } from '../skill-dialog/skill-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { SkillSearchPipe } from '../../../pipes/skill-search.pipe';
import { TagComponent } from '../../ui/ui-tag/tag.component';

@Component({
  selector: 'ui-skill-list',
  imports: [MatSlideToggle, FormsModule, SkillSearchPipe, TagComponent],
  templateUrl: './skill-list.component.html',
  styleUrl: './skill-list.component.scss',
  standalone: true,
})
export class SkillListComponent {
  sortSkills = signal(false);
  searchInput = signal('');
  skills = signal<Skill[]>([]);

  // Filtered Computed Signals
  frontend = computed(() =>
    this.skills().filter((skill) => skill.group === 'frontend'),
  );
  backend = computed(() =>
    this.skills().filter((skill) => skill.group === 'backend'),
  );
  general = computed(() =>
    this.skills().filter((skill) => skill.group === 'general'),
  );
  other = computed(() =>
    this.skills().filter(
      (skill) => !['frontend', 'backend', 'general'].includes(skill.group),
    ),
  );

  constructor(
    private server: ContentService,
    public dialog: MatDialog,
  ) {
    this.server.getDisplayedSkills().subscribe((skills) => {
      this.skills.set(skills);
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
