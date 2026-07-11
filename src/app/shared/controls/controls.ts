import { Component, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-controls',
  template: `
    <div class="controls">
      <button class="ctl-btn" (click)="i18n.toggle()" [title]="i18n.lang() === 'zh' ? 'Switch to English' : '切換為中文'">
        <span class="ico">🌐</span>
        {{ i18n.lang() === 'zh' ? 'EN' : '中' }}
      </button>
      <button class="ctl-btn" (click)="theme.toggle()" [title]="theme.theme() === 'pink' ? 'Starry theme' : 'Light theme'">
        @if (theme.theme() === 'pink') {
          <span class="ico">🌙</span> {{ i18n.t('ctl.themeStarry') }}
        } @else {
          <span class="ico">☀️</span> {{ i18n.t('ctl.themePink') }}
        }
      </button>
    </div>
  `,
  styles: [
    `
      .controls {
        display: inline-flex;
        gap: 8px;
      }
      .ctl-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 12px;
        border-radius: 999px;
        border: 1.5px solid var(--c-border);
        background: var(--c-surface);
        color: var(--c-text);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: var(--shadow-sm);
        transition: transform 0.12s ease, border-color 0.12s ease;
      }
      .ctl-btn:hover {
        border-color: var(--c-primary);
        color: var(--c-primary);
        transform: translateY(-1px);
      }
      .ico {
        font-size: 14px;
      }
    `,
  ],
})
export class Controls {
  protected i18n = inject(I18nService);
  protected theme = inject(ThemeService);
}
