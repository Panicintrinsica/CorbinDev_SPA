import {Component, inject, signal} from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import {AuthService} from "../../../auth/auth.service";

@Component({
  selector: 'ui-nav',
  imports: [
    MatToolbar,
    RouterLink,
    MatButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './ui-nav.component.html',
  styleUrl: './ui-nav.component.scss',
  standalone: true,
})
export class UiNavComponent {
  auth = inject(AuthService)

  isAdmin = signal(false)

  constructor() {
    this.auth.loadIdentity().then(() => {
      if(this.auth.identity()?.roles.find((role) => role === 'owner')) {
        this.isAdmin.set(true)
      }
    })
  }

}
