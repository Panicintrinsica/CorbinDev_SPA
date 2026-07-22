import { Component, Input, OnInit, signal } from '@angular/core';

@Component({
  selector: 'ui-spinner',
  imports: [],
  templateUrl: './ui-spinner.component.html',
  standalone: true,
  styleUrl: './ui-spinner.component.scss',
})
export class UiSpinnerComponent implements OnInit {
  @Input() timeout: number | null = null;
  @Input() message: string = '';

  showSpinner = signal(true);
  showText = signal(false);

  ngOnInit() {
    if (this.timeout) {
      setTimeout(() => {
        this.showSpinner.set(false);
        this.showText.set(true);
      }, this.timeout);
    }
  }
}
