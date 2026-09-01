import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import type { OutputBlockData, OutputData } from '@editorjs/editorjs';
import { BlockListComponent } from './block-list.component';
import { resolveMediaUrl } from '../../../../services/media.service';

/**
 * Renders an Editor.js document.
 *
 * Block data reaches the browser already sanitized — the API runs every write
 * through an inline-HTML allow-list before storing it — so the inline formatting
 * inside a paragraph is bound with `innerHTML`. Angular's own sanitizer still
 * runs over it, which is the second of the two locks rather than the only one.
 *
 * Everything here renders identically under SSR. The only browser-only behaviour
 * is syntax highlighting, which is an enhancement applied after hydration.
 */
@Component({
  selector: 'ui-blocks',
  standalone: true,
  imports: [BlockListComponent],
  templateUrl: './ui-blocks.component.html',
})
export class UiBlocksComponent {
  content = input<OutputData | undefined>();

  blocks = computed<OutputBlockData[]>(() => this.content()?.blocks ?? []);

  private host = inject(ElementRef<HTMLElement>);

  constructor() {
    // Prism is loaded as a global script (see angular.json), so it exists on the
    // client and not on the server. Re-runs whenever the rendered blocks change,
    // which is what makes it work for an article navigated to rather than landed
    // on, and for the editor's live preview.
    afterRenderEffect(() => {
      this.blocks();
      const prism = (globalThis as unknown as { Prism?: PrismLike }).Prism;
      prism?.highlightAllUnder?.(this.host.nativeElement);
    });
  }

  /** Resolves a stored image URL against the API origin when it is relative. */
  mediaUrl(url: string): string {
    return resolveMediaUrl(url);
  }

  /**
   * Alt text for an image block.
   *
   * Editor.js has no alt field, only a caption, and the caption may carry inline
   * markup. Stripping it to plain text is better than an empty alt, and an
   * uncaptioned decorative image correctly ends up with `alt=""`.
   */
  altText(caption: string | undefined): string {
    return (caption ?? '').replace(/<[^>]*>/g, '').trim();
  }

  /** Table rows below the header row, when the block declares one. */
  bodyRows(block: OutputBlockData): string[][] {
    const rows: string[][] = block.data.content ?? [];
    return block.data.withHeadings ? rows.slice(1) : rows;
  }

  headerRow(block: OutputBlockData): string[] {
    return block.data.content?.[0] ?? [];
  }

  /** Prism's class convention; `none` leaves a block unhighlighted but still styled. */
  languageClass(block: OutputBlockData): string {
    return `language-${block.data.language || 'none'}`;
  }
}

interface PrismLike {
  highlightAllUnder?: (element: Element) => void;
}
