import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { ConfirmDialog } from './shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialog],
  template: `
    <router-outlet />
    <app-confirm-dialog />
  `,
})
export class App {
  constructor() {
    inject(ThemeService);
  }
}
