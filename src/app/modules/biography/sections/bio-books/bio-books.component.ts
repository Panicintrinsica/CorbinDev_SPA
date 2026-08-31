import { Component } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-bio-books',
  imports: [MarkdownComponent],
  templateUrl: './bio-books.component.html',
  styleUrl: './bio-books.component.scss',
  standalone: true,
})
export class BioBooksComponent {}
