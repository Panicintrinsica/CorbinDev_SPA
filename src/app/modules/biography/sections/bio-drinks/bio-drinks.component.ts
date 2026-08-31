import { Component } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-bio-drinks',
  imports: [MarkdownComponent],
  templateUrl: './bio-drinks.component.html',
  styleUrl: './bio-drinks.component.scss',
})
export class BioDrinksComponent {}
