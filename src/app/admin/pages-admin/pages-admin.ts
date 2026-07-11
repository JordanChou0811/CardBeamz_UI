import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { NewsCategory, NewsItem } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-pages-admin',
  imports: [FormsModule, DatePipe, TranslatePipe],
  template: `
    <h2 class="mb">{{ 'apages.title' | t }}</h2>

    <div class="grid">
      <div class="card">
        <div class="card-title">{{ (editingId() ? 'apages.editNews' : 'apages.addNews') | t }}</div>
        <div class="field">
          <label>{{ 'apages.category' | t }}</label>
          <select [(ngModel)]="category">
            <option value="service">{{ 'news.service' | t }}</option>
            <option value="maintenance">{{ 'news.maintenance' | t }}</option>
          </select>
        </div>
        <div class="field">
          <label>{{ 'apages.titleField' | t }}</label>
          <input [(ngModel)]="title" [placeholder]="'apages.titlePlaceholder' | t" />
        </div>
        <div class="field">
          <label>{{ 'apages.content' | t }}</label>
          <textarea rows="5" [(ngModel)]="content" [placeholder]="'apages.contentPlaceholder' | t"></textarea>
        </div>
        @if (error()) {
          <p class="error-text">{{ error() | t }}</p>
        }
        <div class="row">
          <button class="btn btn-primary" (click)="save()">
            {{ (editingId() ? 'apages.saveEdit' : 'apages.add') | t }}
          </button>
          @if (editingId()) {
            <button class="btn btn-outline" (click)="resetForm()">{{ 'common.cancel' | t }}</button>
          }
        </div>
      </div>

      <div class="card">
        <div class="card-title">{{ 'apages.published' | t }}</div>
        @if (data.news().length === 0) {
          <div class="empty"><span class="emoji">📝</span>{{ 'apages.emptyNews' | t }}</div>
        } @else {
          @for (n of data.news(); track n.id) {
            <div class="item">
              <div class="flex-between">
                <div>
                  <span
                    class="badge"
                    [class.badge-info]="n.category === 'service'"
                    [class.badge-warning]="n.category === 'maintenance'"
                    >{{ (n.category === 'service' ? 'news.service' : 'news.maintenance') | t }}</span
                  >
                  <b> {{ n.title }}</b>
                </div>
                <span class="text-muted">{{ n.createdAt | date: 'MM/dd' }}</span>
              </div>
              <p class="text-muted preview">{{ n.content }}</p>
              <div class="row">
                <button class="btn btn-outline btn-sm" (click)="edit(n)">{{ 'common.edit' | t }}</button>
                <button class="btn btn-danger btn-sm" (click)="data.deleteNews(n.id)">{{ 'common.delete' | t }}</button>
              </div>
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
        grid-template-columns: 360px 1fr;
        gap: 20px;
        align-items: start;
      }
      .item {
        padding: 14px 0;
        border-bottom: 1px solid var(--c-border);
      }
      .item:last-child {
        border-bottom: none;
      }
      .preview {
        margin: 8px 0;
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
export class PagesAdmin {
  protected data = inject(DataService);

  category: NewsCategory = 'service';
  title = '';
  content = '';
  editingId = signal<string | null>(null);
  error = signal('');

  save() {
    this.error.set('');
    if (!this.title.trim() || !this.content.trim()) {
      this.error.set('apages.errRequired');
      return;
    }
    const id = this.editingId();
    if (id) {
      this.data.updateNews(id, {
        title: this.title.trim(),
        content: this.content.trim(),
        category: this.category,
      });
    } else {
      this.data.addNews({
        title: this.title.trim(),
        content: this.content.trim(),
        category: this.category,
      });
    }
    this.resetForm();
  }

  edit(n: NewsItem) {
    this.editingId.set(n.id);
    this.title = n.title;
    this.content = n.content;
    this.category = n.category;
  }

  resetForm() {
    this.editingId.set(null);
    this.title = '';
    this.content = '';
    this.category = 'service';
  }
}
