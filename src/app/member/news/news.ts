import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-news',
  imports: [DatePipe, TranslatePipe],
  template: `
    <h2 class="mb">{{ 'news.title' | t }}</h2>

    @if (data.news().length === 0) {
      <div class="card empty"><span class="emoji">🔔</span>{{ 'news.empty' | t }}</div>
    } @else {
      @for (n of data.news(); track n.id) {
        <div class="card news-item">
          <div class="flex-between">
            <div class="title">
              <span
                class="badge"
                [class.badge-info]="n.category === 'service'"
                [class.badge-warning]="n.category === 'maintenance'"
              >
                {{ (n.category === 'service' ? 'news.service' : 'news.maintenance') | t }}
              </span>
              {{ n.title }}
            </div>
            <span class="text-muted">{{ n.createdAt | date: 'yyyy/MM/dd' }}</span>
          </div>
          <p class="text-muted content">{{ n.content }}</p>
        </div>
      }
    }
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .news-item {
        margin-bottom: 14px;
      }
      .title {
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .content {
        margin: 10px 0 0;
        line-height: 1.7;
      }
    `,
  ],
})
export class News {
  protected data = inject(DataService);
}
