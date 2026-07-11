import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../services/translate.pipe';

interface SentLog {
  channel: 'email' | 'line';
  target: string;
  message: string;
  time: string;
}

@Component({
  selector: 'app-notify-admin',
  imports: [FormsModule, TranslatePipe],
  template: `
    <h2 class="mb">{{ 'notify.title' | t }}</h2>

    <div class="grid">
      <div class="card">
        <div class="card-title">{{ 'notify.send' | t }}</div>

        <div class="field">
          <label>{{ 'notify.channel' | t }}</label>
          <div class="row">
            <label class="option-pill" [class.active]="channel() === 'email'">
              <input type="radio" name="ch" [ngModel]="channel()" (ngModelChange)="channel.set('email')" value="email" hidden />
              ✉️ Email
            </label>
            <label class="option-pill" [class.active]="channel() === 'line'">
              <input type="radio" name="ch" [ngModel]="channel()" (ngModelChange)="channel.set('line')" value="line" hidden />
              💬 LINE Notify
            </label>
          </div>
        </div>

        <div class="field">
          <label>{{ 'notify.target' | t }}</label>
          <select [(ngModel)]="target">
            <option value="all">{{ 'notify.allMembers' | t }}（{{ memberCount() }}）</option>
            @for (m of data.members(); track m.id) {
              @if (m.role === 'member') {
                <option [value]="m.id">{{ m.name }}（{{ m.id }}）</option>
              }
            }
          </select>
        </div>

        <div class="field">
          <label>{{ 'notify.content' | t }}</label>
          <textarea rows="4" [(ngModel)]="message" [placeholder]="'notify.contentPlaceholder' | t"></textarea>
        </div>

        @if (error()) {
          <p class="error-text">{{ error() | t }}</p>
        }

        <button class="btn btn-primary btn-block" (click)="send()">{{ 'notify.send' | t }}</button>
        <p class="hint-text">{{ 'notify.mockHint' | t }}</p>
      </div>

      <div class="card">
        <div class="card-title">{{ 'notify.log' | t }}</div>
        @if (logs().length === 0) {
          <div class="empty"><span class="emoji">📣</span>{{ 'notify.emptyLog' | t }}</div>
        } @else {
          @for (l of logs(); track l.time) {
            <div class="log">
              <div class="flex-between">
                <span class="badge" [class.badge-info]="l.channel === 'email'" [class.badge-success]="l.channel === 'line'">
                  {{ l.channel === 'email' ? 'Email' : 'LINE' }}
                </span>
                <span class="text-muted">{{ l.time }}</span>
              </div>
              <div class="to">→ {{ l.target }}</div>
              <p class="text-muted msg">{{ l.message }}</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .grid {
        display: grid;
        grid-template-columns: 380px 1fr;
        gap: 20px;
        align-items: start;
      }
      .log {
        padding: 12px 0;
        border-bottom: 1px solid var(--c-border);
      }
      .log:last-child {
        border-bottom: none;
      }
      .to {
        font-weight: 600;
        margin-top: 6px;
      }
      .msg {
        margin: 6px 0 0;
        line-height: 1.6;
      }
      @media (max-width: 820px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class NotifyAdmin {
  protected data = inject(DataService);
  private i18n = inject(I18nService);

  channel = signal<'email' | 'line'>('email');
  target = 'all';
  message = '';
  error = signal('');
  logs = signal<SentLog[]>([]);

  memberCount = computed(() => this.data.members().filter((m) => m.role === 'member').length);

  send() {
    this.error.set('');
    if (!this.message.trim()) {
      this.error.set('notify.errContent');
      return;
    }
    const targetName =
      this.target === 'all'
        ? `${this.i18n.t('notify.allMembers')}（${this.memberCount()}）`
        : this.data.findMember(this.target)?.name + '（' + this.target + '）';

    const log: SentLog = {
      channel: this.channel(),
      target: targetName ?? this.target,
      message: this.message.trim(),
      time: new Date().toLocaleString('zh-TW'),
    };
    this.logs.update((arr) => [log, ...arr]);
    this.message = '';
  }
}
