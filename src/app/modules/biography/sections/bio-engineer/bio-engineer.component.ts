import { Component } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-bio-engineer',
  imports: [MarkdownComponent],
  templateUrl: './bio-engineer.component.html',
  styleUrl: './bio-engineer.component.scss',
  standalone: true,
})
export class BioEngineerComponent {}
