import { Component } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-bio-food',
  imports: [MarkdownComponent],
  templateUrl: './bio-food.component.html',
  styleUrl: './bio-food.component.scss',
  standalone: true,
})
export class BioFoodComponent {}
