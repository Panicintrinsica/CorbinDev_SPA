import { Routes } from '@angular/router';
import { HomeComponent } from './modules/home/home.component';
import { ArticlePageComponent } from './modules/blog/article-page/article-page.component';
import { BiographyComponent } from './modules/biography/biography.component';
import { ProjectListPageComponent } from './modules/projects/project-list-page/project-list-page.component';
import { ProjectPageComponent } from './modules/projects/project-page/project-page.component';
import { BlogComponent } from './modules/blog/blog.component';
import { BlogSearchResultsComponent } from './modules/blog/blog-search-results/blog-search-results.component';
import { requirePermission } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { animation: 'Home' } },
  { path: 'blog', component: BlogComponent, data: { animation: 'Blog' } },
  {
    path: 'blog/search',
    component: BlogSearchResultsComponent,
    data: { animation: 'Article' },
  },

  {
    path: 'blog/a/:date/:uri',
    component: ArticlePageComponent,
    data: { animation: 'Article' },
  },

  { path: 'bio', component: BiographyComponent, data: { animation: 'Bio' } },
  {
    path: 'projects',
    component: ProjectListPageComponent,
    data: { animation: 'Projects' },
  },
  {
    path: 'project/:slug',
    component: ProjectPageComponent,
    data: { animation: 'Project' },
  },

  // --- Authoring -------------------------------------------------------------
  // Lazily loaded so a reader never downloads Editor.js, which is by some margin
  // the heaviest thing in the app and of no use to anyone but the author.
  {
    path: 'admin',
    redirectTo: 'admin/articles',
    pathMatch: 'full',
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./modules/admin/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin/articles',
    canActivate: [requirePermission('articles:write')],
    loadComponent: () =>
      import('./modules/admin/article-list/article-list.component').then(
        (m) => m.ArticleListComponent,
      ),
  },
  // Ahead of ':id', which would otherwise swallow 'new'.
  {
    path: 'admin/articles/new',
    canActivate: [requirePermission('articles:write')],
    loadComponent: () =>
      import('./modules/admin/article-editor/article-editor.component').then(
        (m) => m.ArticleEditorComponent,
      ),
  },
  {
    path: 'admin/articles/:id',
    canActivate: [requirePermission('articles:write')],
    loadComponent: () =>
      import('./modules/admin/article-editor/article-editor.component').then(
        (m) => m.ArticleEditorComponent,
      ),
  },
  {
    path: 'admin/projects',
    canActivate: [requirePermission('projects:write')],
    loadComponent: () =>
      import('./modules/admin/project-list/project-list.component').then(
        (m) => m.ProjectListComponent,
      ),
  },
  {
    path: 'admin/projects/new',
    canActivate: [requirePermission('projects:write')],
    loadComponent: () =>
      import('./modules/admin/project-editor/project-editor.component').then(
        (m) => m.ProjectEditorComponent,
      ),
  },
  {
    path: 'admin/projects/:id',
    canActivate: [requirePermission('projects:write')],
    loadComponent: () =>
      import('./modules/admin/project-editor/project-editor.component').then(
        (m) => m.ProjectEditorComponent,
      ),
  },
  {
    path: 'admin/skills',
    canActivate: [requirePermission('skills:write')],
    loadComponent: () =>
      import('./modules/admin/skill-list/skill-list.component').then(
        (m) => m.AdminSkillListComponent,
      ),
  },
  {
    path: 'admin/skills/new',
    canActivate: [requirePermission('skills:write')],
    loadComponent: () =>
      import('./modules/admin/skill-editor/skill-editor.component').then(
        (m) => m.AdminSkillEditorComponent,
      ),
  },
  {
    path: 'admin/skills/:id',
    canActivate: [requirePermission('skills:write')],
    loadComponent: () =>
      import('./modules/admin/skill-editor/skill-editor.component').then(
        (m) => m.AdminSkillEditorComponent,
      ),
  },
];
