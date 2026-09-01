import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { OutputData } from '@editorjs/editorjs';
import { UiBlocksComponent } from './ui-blocks.component';
import { environment } from '../../../../../environments/environment';

describe('UiBlocksComponent', () => {
  let fixture: ComponentFixture<UiBlocksComponent>;
  let host: HTMLElement;

  const render = (blocks: OutputData['blocks']) => {
    fixture.componentRef.setInput('content', { time: 1, version: '2.31.0', blocks });
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiBlocksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiBlocksComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('renders nothing when there is no content', () => {
    expect(host.textContent?.trim()).toBe('');
  });

  it('renders a paragraph and keeps its inline formatting', () => {
    render([{ type: 'paragraph', data: { text: 'plain <b>bold</b>' } }]);

    const paragraph = host.querySelector('p.block-paragraph');
    expect(paragraph?.querySelector('b')?.textContent).toBe('bold');
  });

  it('maps a header level to the matching tag', () => {
    render([{ type: 'header', data: { text: 'Section', level: 3 } }]);
    expect(host.querySelector('h3.block-header')?.textContent).toBe('Section');
  });

  it('falls back to h2 for a header with no usable level', () => {
    render([{ type: 'header', data: { text: 'Section' } }]);
    expect(host.querySelector('h2.block-header')).toBeTruthy();
  });

  it('renders nested lists', () => {
    render([
      {
        type: 'list',
        data: {
          style: 'unordered',
          items: [{ content: 'outer', items: [{ content: 'inner', items: [] }] }],
        },
      },
    ]);

    expect(host.querySelectorAll('ul').length).toBe(2);
    expect(host.textContent).toContain('inner');
  });

  it('renders an ordered list as an ol', () => {
    render([
      { type: 'list', data: { style: 'ordered', items: [{ content: 'one', items: [] }] } },
    ]);
    expect(host.querySelector('ol')).toBeTruthy();
  });

  it('carries image dimensions onto the img so layout is reserved', () => {
    render([
      {
        type: 'image',
        data: {
          file: { url: 'https://api.example/media/2026/08/a.webp', width: 800, height: 600 },
          caption: 'A <i>cat</i>',
        },
      },
    ]);

    const image = host.querySelector('img')!;
    expect(image.getAttribute('width')).toBe('800');
    expect(image.getAttribute('height')).toBe('600');
    expect(image.getAttribute('loading')).toBe('lazy');
    // Alt text is the caption stripped of its markup.
    expect(image.getAttribute('alt')).toBe('A cat');
    expect(host.querySelector('figcaption')?.textContent).toBe('A cat');
  });

  it('resolves a site-relative image URL against the API origin', () => {
    render([{ type: 'image', data: { file: { url: '/media/2026/08/a.webp' } } }]);

    expect(host.querySelector('img')?.getAttribute('src')).toBe(
      `${environment.API}/media/2026/08/a.webp`,
    );
  });

  it('renders code as text rather than markup', () => {
    render([{ type: 'code', data: { code: '<script>alert(1)</script>', language: 'ts' } }]);

    const code = host.querySelector('pre.block-code code')!;
    expect(code.classList).toContain('language-ts');
    expect(code.textContent).toBe('<script>alert(1)</script>');
    expect(code.querySelector('script')).toBeNull();
  });

  it('renders a table, splitting off the heading row when there is one', () => {
    render([
      {
        type: 'table',
        data: {
          withHeadings: true,
          content: [
            ['A', 'B'],
            ['1', '2'],
          ],
        },
      },
    ]);

    expect(host.querySelectorAll('thead th').length).toBe(2);
    expect(host.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('treats every row as body when the table declares no headings', () => {
    render([
      { type: 'table', data: { withHeadings: false, content: [['A'], ['B']] } },
    ]);

    expect(host.querySelector('thead')).toBeNull();
    expect(host.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('renders quotes and delimiters', () => {
    render([
      { type: 'quote', data: { text: 'Said it', caption: 'Someone', alignment: 'left' } },
      { type: 'delimiter', data: {} },
    ]);

    expect(host.querySelector('blockquote p')?.textContent).toBe('Said it');
    expect(host.querySelector('blockquote cite')?.textContent).toBe('Someone');
    expect(host.querySelector('hr.block-delimiter')).toBeTruthy();
  });

  it('skips a block type it does not know rather than failing the article', () => {
    render([
      { type: 'somethingNew', data: { text: 'x' } },
      { type: 'paragraph', data: { text: 'still here' } },
    ]);

    expect(host.textContent).toContain('still here');
  });
});
