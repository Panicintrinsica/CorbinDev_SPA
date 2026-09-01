import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type EditorJS from '@editorjs/editorjs';
import type { OutputData, ToolConstructable } from '@editorjs/editorjs';
import { MediaService } from '../../../../services/media.service';

/**
 * The Editor.js authoring surface.
 *
 * Two constraints shape this component:
 *
 *  - The app renders on the server. Editor.js reaches for `document` the moment
 *    it is constructed, so both the library and every tool are pulled in through
 *    dynamic imports inside `afterNextRender`, which only ever runs in a browser.
 *    The server bundle therefore never loads them at all.
 *  - The app is zoneless. Editor.js mutates the DOM outside Angular's knowledge,
 *    which is fine because nothing in the template depends on it; state that
 *    Angular does render lives in signals updated from the callbacks.
 *
 * Images upload as they are inserted and the block records the returned URL —
 * never the file itself. The old dashboard editor inlined them as base64, which
 * is what the API now rejects outright.
 */
@Component({
  selector: 'app-editor',
  standalone: true,
  template: `
    <div class="editor-shell">
      @if (!ready()) {
        <div class="editor-loading">Loading editor…</div>
      }
      @if (uploadError(); as message) {
        <div class="editor-error" role="alert">{{ message }}</div>
      }
      <div #host class="editorjs-host"></div>
    </div>
  `,
  styleUrl: './editor.component.scss',
})
export class EditorComponent {
  /**
   * The document to load. Applied when it arrives, which for an existing article
   * is after the fetch resolves and therefore after the editor has been built.
   */
  content = input<OutputData | undefined>();
  placeholder = input<string>('Tell the story…');

  changed = output<OutputData>();

  readonly ready = signal(false);
  readonly uploadError = signal<string | null>(null);

  private host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private media = inject(MediaService);
  private editor: EditorJS | null = null;

  /** The document last pushed into the editor, so an echo does not re-render it. */
  private rendered: OutputData | undefined;

  constructor() {
    afterNextRender(() => void this.initialize());

    // Renders `content` once the editor exists. Guarded on identity rather than
    // value: `changed` emits a new object on every keystroke, and re-rendering
    // the editor from its own output would fight the caret for the cursor.
    effect(() => {
      const incoming = this.content();
      if (!this.ready() || !this.editor || !incoming || incoming === this.rendered) {
        return;
      }
      this.rendered = incoming;
      void this.editor.render(incoming);
    });

    inject(DestroyRef).onDestroy(() => {
      // `destroy` is absent until the instance finishes initialising, so a page
      // navigated away from mid-load does not throw on the way out.
      this.editor?.destroy?.();
      this.editor = null;
    });
  }

  /** The current document. The editor is the source of truth while it is open. */
  async save(): Promise<OutputData | null> {
    if (!this.editor) return null;
    return this.editor.save();
  }

  private async initialize(): Promise<void> {
    const [
      { default: EditorConstructor },
      { default: Header },
      { default: List },
      { default: ImageTool },
      { default: CodeTool },
      { default: InlineCode },
      { default: Quote },
      { default: Delimiter },
      { default: Table },
      { default: Marker },
      { default: Underline },
    ] = await Promise.all([
      import('@editorjs/editorjs'),
      import('@editorjs/header'),
      import('@editorjs/list'),
      import('@editorjs/image'),
      import('@editorjs/code'),
      import('@editorjs/inline-code'),
      import('@editorjs/quote'),
      import('@editorjs/delimiter'),
      import('@editorjs/table'),
      import('@editorjs/marker'),
      import('@editorjs/underline'),
    ]);

    const initial = this.content();
    this.rendered = initial;

    this.editor = new EditorConstructor({
      holder: this.host().nativeElement,
      placeholder: this.placeholder(),
      data: initial,
      tools: {
        header: {
          class: Header,
          inlineToolbar: true,
          config: {
            placeholder: 'Section heading',
            // h1 is the article title, so the body starts at h2. The API clamps
            // to the same range; matching it here means the editor never shows a
            // level that would be silently rewritten on save.
            levels: [2, 3, 4, 5, 6],
            defaultLevel: 2,
          },
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: { defaultStyle: 'unordered' },
        },
        image: {
          class: ImageTool,
          config: {
            uploader: {
              uploadByFile: (file: File) => this.uploadByFile(file),
              // Deliberately unavailable: fetching a caller-supplied URL server
              // side is an SSRF primitive, so the API offers no such endpoint.
              uploadByUrl: () => {
                const message = 'Paste-by-URL is disabled — upload the file instead.';
                this.uploadError.set(message);
                return Promise.reject(new Error(message));
              },
            },
          },
        },
        code: { class: CodeTool, config: { placeholder: 'Code' } },
        inlineCode: InlineCode,
        marker: Marker,
        underline: Underline,
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Quote',
            captionPlaceholder: 'Attribution',
          },
        },
        delimiter: Delimiter,
        table: {
          // @editorjs/table types its own constructor as requiring `config`, which
          // makes the class fail Editor.js' own BlockToolConstructable check. The
          // tool works; only its published typings are wrong.
          class: Table as unknown as ToolConstructable,
          inlineToolbar: true,
          config: { rows: 2, cols: 3 },
        },
      },
      onReady: () => this.ready.set(true),
      onChange: async (api) => {
        const data = await api.saver.save();
        // Recorded before emitting so the effect above recognises the round-trip
        // and leaves the live editor alone.
        this.rendered = data;
        this.changed.emit(data);
      },
    });
  }

  private async uploadByFile(file: File) {
    this.uploadError.set(null);
    try {
      const uploaded = await this.media.upload(file);
      return {
        success: 1,
        file: {
          url: uploaded.url,
          // Carried into the block so the published article can reserve layout
          // space for the image before it loads.
          width: uploaded.width,
          height: uploaded.height,
        },
      };
    } catch (error: unknown) {
      this.uploadError.set(messageFor(error));
      return { success: 0 };
    }
  }
}

/** Prefers the API's own explanation (size, format) over a generic HTTP failure. */
function messageFor(error: unknown): string {
  const body = (error as { error?: { error?: string } })?.error;
  if (body?.error) return body.error;
  if (error instanceof Error && error.message) return error.message;
  return 'Upload failed';
}
