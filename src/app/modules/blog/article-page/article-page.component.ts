import { Component, effect, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../blog.service';
import { GoBackDirective } from '../../../directives/go-back.directive';
import { Meta, Title } from '@angular/platform-browser';
import { UiArticleComponent } from '../components/ui-article/ui-article.component';

@Component({
  selector: 'app-article',
  imports: [MatButton, GoBackDirective, UiArticleComponent],
  templateUrl: './article-page.component.html',
  standalone: true,
  styleUrl: './article-page.component.scss',
})
export class ArticlePageComponent implements OnInit {
  blogService = inject(BlogService);
  article = this.blogService.article;

  constructor(
    route: ActivatedRoute,
    private meta: Meta,
    private title: Title,
  ) {
    route.paramMap.subscribe((params) => {
      const date = params.get('date');
      const uri = params.get('uri');

      if (date && uri) {
        this.blogService.fetchArticle(date, uri);
      }
    });

    effect(() => {
      const currentArticle = this.article();
      if (currentArticle.title) {
        this.title.setTitle(`Corbin.dev | ${currentArticle.title}`);
        this.meta.addTags([
          {
            name: 'description',
            content: currentArticle.excerpt,
          },
        ]);
      }
    });
  }

  ngOnInit(): void {}
}
