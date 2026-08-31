import { Component } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-bio-music',
  imports: [MarkdownComponent],
  templateUrl: './bio-music.component.html',
  styleUrl: './bio-music.component.scss',
  standalone: true,
})
export class BioMusicComponent {}
