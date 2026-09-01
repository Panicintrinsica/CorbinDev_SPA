import { Component, forwardRef, input } from '@angular/core';

/** One entry in a list block. `items` carries the nesting @editorjs/list v2 allows. */
export interface BlockListItem {
  content: string;
  items?: BlockListItem[];
}

/**
 * Renders a list block, nesting included.
 *
 * Split out of the main renderer because a list is the one block type that
 * contains itself, and recursion needs a component boundary to recurse across.
 * The self-reference in `imports` goes through `forwardRef` because the class is
 * still in its temporal dead zone when the decorator is evaluated.
 *
 * The ordered/unordered input is called `listStyle` rather than `style` because
 * `[style]` on an element is Angular's inline-style binding, not an input.
 */
@Component({
  selector: 'ui-block-list',
  standalone: true,
  imports: [forwardRef(() => BlockListComponent)],
  template: `
    @if (listStyle() === 'ordered') {
      <ol>
        @for (item of items(); track $index) {
          <li>
            <span [innerHTML]="item.content"></span>
            @if (item.items?.length) {
              <ui-block-list [items]="item.items" [listStyle]="listStyle()" />
            }
          </li>
        }
      </ol>
    } @else {
      <ul>
        @for (item of items(); track $index) {
          <li>
            <span [innerHTML]="item.content"></span>
            @if (item.items?.length) {
              <ui-block-list [items]="item.items" [listStyle]="listStyle()" />
            }
          </li>
        }
      </ul>
    }
  `,
})
export class BlockListComponent {
  items = input<BlockListItem[]>([]);
  listStyle = input<'ordered' | 'unordered'>('unordered');
}
