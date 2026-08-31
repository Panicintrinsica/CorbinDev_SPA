import { Component } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-bio-games',
  imports: [MarkdownComponent],
  templateUrl: './bio-games.component.html',
  styleUrl: './bio-games.component.scss',
  standalone: true,
})
export class BioGamesComponent {}
