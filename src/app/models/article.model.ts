import type { OutputData } from '@editorjs/editorjs';

/**
 * An article body is an Editor.js block document, not markdown.
 *
 * `content` is absent on list and search responses — those return cards, and the
 * body is fetched only when a full article is opened. `excerpt` is the API's
 * derived summary and is what a card, a search hit and the meta description all
 * render.
 */
export interface Article {
  _id?: string;
  title: string;
  date: string;
  uri: string;
  excerpt: string;
  content?: OutputData;
  category: string;
  tags: string[];
  author: string;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
  score?: number;
}

/** The fields the editor sends; the API derives the rest. */
export interface ArticleDraft {
  title: string;
  content: OutputData;
  excerpt?: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  /** Only on update, and only to deliberately move a published article's URL. */
  uri?: string;
}

export interface ArticlePage {
  data: Article[];
  meta: {
    size: number;
    page: number;
    totalPages: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
}

export interface ArticleAdminPage {
  data: Article[];
  meta: {
    size: number;
    page: number;
    totalPages: number;
    totalCount: number;
  };
}

/**
 * A blank article, for a signal that must hold one before the fetch resolves.
 * A factory rather than a shared constant so no caller can mutate the blank.
 */
export function emptyArticle(): Article {
  return {
    title: '',
    date: '',
    uri: '',
    excerpt: '',
    category: '',
    tags: [],
    author: '',
    createdAt: '',
    updatedAt: '',
  };
}
