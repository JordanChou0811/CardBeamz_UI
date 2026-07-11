import { Injectable, signal } from '@angular/core';

export type Theme = 'pink' | 'starry';

const THEME_KEY = 'cbz_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>((localStorage.getItem(THEME_KEY) as Theme) || 'pink');

  constructor() {
    this.apply(this.theme());
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(THEME_KEY, theme);
    this.apply(theme);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'pink' ? 'starry' : 'pink');
  }

  private apply(theme: Theme): void {
    document.body.setAttribute('data-theme', theme);
  }
}
