import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ui-footer',
  imports: [NgClass],
  templateUrl: './ui-footer.component.html',
  styleUrl: './ui-footer.component.scss',
  standalone: true,
})
export class UiFooterComponent implements OnInit, OnDestroy {
  year: number = new Date().getFullYear();
  isHomePage = signal(false);
  loading = signal(false);

  private currentRoute$!: Subscription;

  constructor(private router: Router) {
    this.isHomePage.set(this.router.url === '/' || this.router.url === '/home');
  }

  ngOnInit() {
    this.currentRoute$ = this.router.events.subscribe((event) => {
      const currentRoute = this.router.url;
      this.isHomePage.set(currentRoute === '/' || currentRoute === '/home');

      if (event instanceof NavigationStart) {
        this.loading.set(true);
      } else if (event instanceof NavigationEnd) {
        setTimeout(() => this.loading.set(false), 300);
      }
    });
  }

  ngOnDestroy() {
    this.currentRoute$?.unsubscribe();
  }
}
