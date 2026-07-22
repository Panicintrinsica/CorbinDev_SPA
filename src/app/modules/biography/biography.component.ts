import { Component, inject, signal } from '@angular/core';
import { ContentService } from '../../services/content.service';
import { MarkdownComponent } from 'ngx-markdown';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getContentBody } from '../../utilities';
import { MatButton } from '@angular/material/button';
import { BioBooksComponent } from './sections/bio-books/bio-books.component';
import { BioDrinksComponent } from './sections/bio-drinks/bio-drinks.component';
import { BioEngineerComponent } from './sections/bio-engineer/bio-engineer.component';
import { BioFashionComponent } from './sections/bio-fashion/bio-fashion.component';
import { BioFoodComponent } from './sections/bio-food/bio-food.component';
import { BioGamesComponent } from './sections/bio-games/bio-games.component';
import { BioMusicComponent } from './sections/bio-music/bio-music.component';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-biography',
  imports: [
    MarkdownComponent,
    FormsModule,
    MatButton,
    BioBooksComponent,
    BioDrinksComponent,
    BioEngineerComponent,
    BioFashionComponent,
    BioFoodComponent,
    BioGamesComponent,
    BioMusicComponent,
    NgClass,
  ],
  templateUrl: './biography.component.html',
  styleUrl: './biography.component.scss',
  standalone: true,
})
export class BiographyComponent {
  contentService = inject(ContentService);
  content = this.contentService.content;

  sections: { id: string; title: string }[] = [
    { id: 'books', title: 'Books' },
    { id: 'drinks', title: 'Drinks' },
    { id: 'engineer', title: 'Engineering' },
    { id: 'fashion', title: 'Fashion' },
    { id: 'food', title: 'Food' },
    { id: 'games', title: 'Games' },
    { id: 'music', title: 'Music' },
  ];

  selection = signal('');

  constructor(
    private meta: Meta,
    private title: Title,
  ) {
    this.title.setTitle('Corbin.dev | Biography');
    this.meta.addTags([
      {
        name: 'description',
        content: 'A short personal biography of Emrys Corbin',
      },
    ]);

    this.contentService.fetchContent('biography');
  }

  protected readonly getContentBody = getContentBody;

  makeSelection(id: string) {
    this.selection.set(id);
  }
}
