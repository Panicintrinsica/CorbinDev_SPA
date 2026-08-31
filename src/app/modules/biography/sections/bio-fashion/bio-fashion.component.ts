import { Component } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-bio-fashion',
  imports: [MarkdownComponent],
  templateUrl: './bio-fashion.component.html',
  styleUrl: './bio-fashion.component.scss',
  standalone: true,
})
export class BioFashionComponent {}
