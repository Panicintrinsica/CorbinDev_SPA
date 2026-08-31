import {
  Component,
  computed,
  Inject,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ContentService } from '../../services/content.service';
import { MarkdownComponent } from 'ngx-markdown';
import { isPlatformBrowser, NgClass, NgOptimizedImage } from '@angular/common';
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
    NgOptimizedImage,
  ],
  templateUrl: './biography.component.html',
  styleUrl: './biography.component.scss',
  standalone: true,
})
export class BiographyComponent implements OnInit, OnDestroy {
  contentService = inject(ContentService);
  content = this.contentService.content;

  age = signal(0);
  sections: { id: string; title: string }[] = [
    { id: 'books', title: 'Books' },
    // { id: 'drinks', title: 'Drinks' },
    { id: 'engineer', title: 'Engineering' },
    { id: 'fashion', title: 'Style' },
    { id: 'food', title: 'Food' },
    { id: 'games', title: 'Games' },
    { id: 'music', title: 'Music' },
  ];

  selection = signal('');
  private readonly birthDate = new Date('1990-10-18T12:00:00Z');
  private intervalId?: number;

  facts = computed(() => [
    { title: 'Height', value: '182cm' },
    { title: 'Age', value: `${this.age()}ms` },
    { title: 'Build', value: 'Average' },
    { title: 'Hair Color', value: 'Variable' },
    { title: 'Eye Color', value: 'Static' },
    { title: 'Blood', value: 'Fluid' },
    { title: 'Alcohol', value: 'Yes' },
    { title: 'Tobacco', value: 'No' },
    { title: 'Coffee', value: 'Single Origin' },
    { title: 'Sign', value: 'Stop' },
    { title: 'Animals', value: 'Cats' },
  ]);

  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: object,
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

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.calculateAge();
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  protected readonly getContentBody = getContentBody;

  makeSelection(id: string) {
    this.selection.set(id);
  }

  calculateAge() {
    this.intervalId = window.setInterval(() => {
      this.age.set(Date.now() - this.birthDate.getTime());
    }, 1);
  }
}
