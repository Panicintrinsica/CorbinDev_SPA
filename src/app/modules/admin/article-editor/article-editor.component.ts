import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import type { OutputData } from '@editorjs/editorjs';
import { Article, ArticleDraft } from '../../../models/article.model';
import { AdminArticleService } from '../admin-article.service';
import { EditorComponent } from '../components/editor/editor.component';
import { UiBlocksComponent } from '../../blog/components/ui-blocks/ui-blocks.component';

/**
 * Writes an article, new or existing.
 *
 * The editor owns the body while the page is open — `save()` asks it for the
 * current document rather than tracking every keystroke into a signal, because
 * Editor.js already holds that state and mirroring it would only introduce a way
 * for the two to disagree.
 *
 * The preview renders through the same `ui-blocks` component the published
 * article uses, so what an author checks against is the real thing rather than
 * an approximation of it.
 */
@Component({
  selector: 'app-admin-article-editor',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButton,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatSlideToggle,
    EditorComponent,
    UiBlocksComponent,
  ],
  templateUrl: './article-editor.component.html',
  styleUrl: './article-editor.component.scss',
})
export class ArticleEditorComponent {
  private articles = inject(AdminArticleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private editor = viewChild(EditorComponent);

  readonly id = signal<string | null>(null);
  readonly title = signal('');
  readonly category = signal('');
  readonly tagsText = signal('');
  readonly excerpt = signal('');
  readonly isPublished = signal(false);
  readonly content = signal<OutputData | undefined>(undefined);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly error = signal<string | null>(null);
  readonly savedAt = signal<Date | null>(null);
  readonly previewing = signal(false);
  /** Set once saved, so the published article can be linked to directly. */
  readonly permalink = signal<string | null>(null);

  readonly isNew = computed(() => this.id() === null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.load(id);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.articles.get(id).subscribe({
      next: (article) => {
        this.apply(article);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load that article.');
        this.loading.set(false);
      },
    });
  }

  private apply(article: Article): void {
    this.id.set(article._id ?? null);
    this.title.set(article.title ?? '');
    this.category.set(article.category ?? '');
    this.tagsText.set(article.tags?.join(', ') ?? '');
    this.excerpt.set(article.excerpt ?? '');
    this.isPublished.set(article.isPublished ?? false);
    this.content.set(article.content);
    this.permalink.set(`/blog/a/${article.date}/${article.uri}`);
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

  /**
   * Saves, optionally flipping the published flag in the same request.
   *
   * `publish` is passed explicitly rather than read off the toggle so that
   * "Save draft" and "Publish" are two unambiguous actions rather than one
   * action whose effect depends on a switch elsewhere on the page.
   */
  async save(publish?: boolean): Promise<void> {
    if (this.saving()) return;

    const body = await this.editor()?.save();
    if (!body || body.blocks.length === 0) {
      this.error.set('An article needs at least one block of content.');
      return;
    }
    const title = (this.title() ?? '').trim();
    if (!title) {
      this.error.set('An article needs a title.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const excerpt = (this.excerpt() ?? '').trim();
    const category = (this.category() ?? '').trim();
    const tags = (this.tagsText() ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const draft: ArticleDraft = {
      title,
      content: body,
      // Sent empty when the author has not written one, which tells the API to
      // derive it from the leading prose instead.
      excerpt: excerpt || undefined,
      category,
      tags,
      isPublished: publish ?? this.isPublished(),
    };

    const id = this.id();
    const request = id
      ? this.articles.update(id, draft)
      : this.articles.create(draft);

    request.subscribe({
      next: (article) => {
        this.apply(article);
        this.savedAt.set(new Date());
        this.saving.set(false);

        // A newly created article moves to its own URL so a reload returns to the
        // article rather than to a blank composer.
        if (!id && article._id) {
          void this.router.navigate(['/admin/articles', article._id], {
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

/**
 * The API's block validation returns a specific, actionable message — which block
 * and what is wrong with it — so it is shown verbatim rather than replaced with a
 * generic failure.
 */
function describe(error: unknown): string {
  const status = (error as { status?: number })?.status;
  const body = (error as { error?: { error?: string } })?.error;

  if (body?.error) return body.error;
  if (status === 403) return 'This account cannot edit articles.';
  if (status === 0) return 'Could not reach the API.';
  return 'Saving failed.';
}
