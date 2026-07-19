import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { AlertDialog } from './shared/alert-dialog/alert-dialog';
import { ConfirmDialog } from './shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialog, AlertDialog],
  template: `
    <router-outlet />
    <app-confirm-dialog />
    <app-alert-dialog />
  `,
})
export class App {
  constructor() {
    inject(ThemeService);
  }
}
