import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { Article, emptyArticle } from '../../../../models/article.model';
import { TagComponent } from '../../../ui/ui-tag/tag.component';
import { UiBlocksComponent } from '../ui-blocks/ui-blocks.component';

@Component({
  selector: 'ui-article',
  imports: [RouterLink, MatButton, DatePipe, TagComponent, UiBlocksComponent],
  templateUrl: './ui-article.component.html',
  standalone: true,
  styleUrl: './ui-article.component.scss',
})
export class UiArticleComponent {
  data = input<Article>(emptyArticle());

  /**
   * A stub is a card in a list: it shows the API-derived excerpt and links on.
   * Only the full view fetches and renders the block body.
   */
  isStub = input<boolean>(false);
  displayStyle = input<ArticleDisplayStyle>(ArticleDisplayStyle.Simple);
}

export enum ArticleDisplayStyle {
  'Simple' = 'simple',
  'Card' = 'card',
}
