import { Component, signal, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { Project } from '../../../models/project.model';
import { ContentService } from '../../../services/content.service';
import { MatDialog } from '@angular/material/dialog';
import { ProjectCardComponent } from '../components/ui-project-card/project-card.component';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import {
  ProjectCategories,
  ProjectPlatforms,
} from '../../../constants/project.consts';
import { ProjectService } from '../project.service';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-project-list',
  imports: [
    MatButton,
    AsyncPipe,
    ProjectCardComponent,
    MatChipListbox,
    MatChipOption,
    FormsModule
],
  templateUrl: './project-list-page.component.html',
  styleUrl: './project-list-page.component.scss',
  standalone: true,
})
export class ProjectListPageComponent {
  @ViewChild('platformList') categoryList!: MatChipListbox;
  @ViewChild('groupList') groupList!: MatChipListbox;

  project$: Observable<Project[]>;

  resultSet = signal<Project[]>([]);
  filteredProjects = signal<Project[]>([]);

  platformOptions = ProjectPlatforms;
  categoryOptions = ProjectCategories;

  selectedPlatforms = new Set<string>();
  selectedCategories = new Set<string>();

  searchTerm: string = '';

  constructor(
    public dialog: MatDialog,
    private server: ContentService,
    private projectService: ProjectService,
    private meta: Meta,
    private title: Title,
  ) {
    this.title.setTitle('Corbin.dev | Projects');
    this.meta.addTags([
      {
        name: 'description',
        content: 'Full project portfolio for Emrys Corbin',
      },
    ]);

    this.project$ = this.projectService.fetchPublicProjects().pipe(
      tap((result) => {
        this.resultSet.set(result);
        this.filteredProjects.set(result);
      }),
    );
  }

  selectPlatforms(filterKey: string) {
    if (this.selectedPlatforms.has(filterKey)) {
      this.selectedPlatforms.delete(filterKey);
    } else {
      this.selectedPlatforms.add(filterKey);
    }
    this.updateList();
  }

  selectCategories(filterKey: string) {
    if (this.selectedCategories.has(filterKey)) {
      this.selectedCategories.delete(filterKey);
    } else {
      this.selectedCategories.add(filterKey);
    }
    this.updateList();
  }

  updateList() {
    let newResults: Project[] = this.resultSet();

    if (this.selectedPlatforms.size != 0) {
      newResults = this.filterByPlatform(
        newResults,
        Array.from(this.selectedPlatforms.keys()),
      );
    }

    if (this.selectedCategories.size != 0) {
      newResults = this.filterByCategory(
        newResults,
        Array.from(this.selectedCategories.keys()),
      );
    }

    if (this.searchTerm && this.searchTerm.length > 3) {
      newResults = this.filterByName(newResults, this.searchTerm);
    }

    this.filteredProjects.set(newResults);
  }

  filterByName(array: Project[], searchString: string) {
    searchString = searchString.toLowerCase();
    return array.filter(
      (project) =>
        project.name.toLowerCase().includes(searchString) ||
        project.blurb.toLowerCase().includes(searchString),
    );
  }

  filterByCategory(array: Project[], selectedFilters: string[]) {
    return array.filter((project) =>
      selectedFilters.includes(project.category),
    );
  }

  filterByPlatform(array: Project[], selectedFilters: string[]) {
    return array.filter((project) =>
      selectedFilters.includes(project.platform),
    );
  }

  resetFilters() {
    this.categoryList._chips.forEach((chip) => {
      chip.deselect();
    });
    this.groupList._chips.forEach((chip) => {
      chip.deselect();
    });
    this.searchTerm = '';
    this.updateList();
  }

  updateTerm($event: string) {
    this.searchTerm = $event;
    this.updateList();
  }
}
