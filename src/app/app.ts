import { DOCUMENT } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ThemeService } from './services/theme.service';
import { I18nService } from './services/i18n.service';
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
    const i18n = inject(I18nService);
    const title = inject(Title);
    const document = inject(DOCUMENT);

    effect(() => {
      title.setTitle(i18n.t('app.title'));
      document.documentElement.lang = i18n.lang() === 'zh' ? 'zh-Hant' : 'en';
    });
  }
}
