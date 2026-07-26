import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '../../services/translate.pipe';

/** 共用表格分頁列。pageNum 採 1 起算，父元件負責依事件載入該頁資料。 */
@Component({
  selector: 'app-pagination',
  imports: [TranslatePipe],
  template: `
    @if (totalCount() > 0) {
      <div class="pagination">
        <div class="summary">
          {{ 'pagination.total' | t }} {{ totalCount() }} {{ 'pagination.records' | t }}
          · {{ 'pagination.page' | t }} {{ currentPage() }} / {{ totalPages() }}
        </div>

        <div class="controls">
          <label class="page-size">
            {{ 'pagination.perPage' | t }}
            <select [value]="pageSize()" [disabled]="disabled()" (change)="changePageSize($event)">
              @for (size of pageSizes(); track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
          </label>

          <button
            type="button"
            class="page-btn"
            [disabled]="disabled() || currentPage() === 1"
            (click)="goTo(currentPage() - 1)"
          >
            ← {{ 'pagination.previous' | t }}
          </button>

          @for (token of pageTokens(); track $index) {
            @if (token === '…') {
              <span class="ellipsis">…</span>
            } @else {
              <button
                type="button"
                class="page-btn page-number"
                [class.active]="token === currentPage()"
                [disabled]="disabled()"
                (click)="goTo(token)"
              >
                {{ token }}
              </button>
            }
          }

          <button
            type="button"
            class="page-btn"
            [disabled]="disabled() || currentPage() === totalPages()"
            (click)="goTo(currentPage() + 1)"
          >
            {{ 'pagination.next' | t }} →
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 16px;
      }
      .summary {
        color: var(--c-muted);
        font-size: 14px;
      }
      .controls,
      .page-size {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .page-size {
        margin-right: 6px;
        color: var(--c-muted);
        font-size: 14px;
      }
      select,
      .page-btn {
        height: 34px;
        border: 1px solid var(--c-border);
        border-radius: var(--radius-sm);
        background: var(--c-surface);
        color: var(--c-text);
        font: inherit;
      }
      select {
        padding: 0 7px;
      }
      .page-btn {
        padding: 0 10px;
        cursor: pointer;
      }
      .page-number {
        min-width: 34px;
        padding: 0 6px;
      }
      .page-btn.active {
        border-color: var(--c-primary);
        background: var(--c-primary);
        color: #fff;
      }
      .page-btn:disabled,
      select:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .ellipsis {
        width: 20px;
        text-align: center;
        color: var(--c-muted);
      }
    `,
  ],
})
export class Pagination {
  readonly totalCount = input.required<number>();
  readonly pageNum = input(1);
  readonly pageSize = input(10);
  readonly pageSizes = input<number[]>([10, 20, 50]);
  readonly disabled = input(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  readonly currentPage = computed(() => Math.min(Math.max(1, this.pageNum()), this.totalPages()));
  readonly pageTokens = computed<(number | '…')[]>(() => {
    const total = this.totalPages();
    const page = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

    const tokens: (number | '…')[] = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);
    if (start > 2) tokens.push('…');
    for (let number = start; number <= end; number += 1) tokens.push(number);
    if (end < total - 1) tokens.push('…');
    tokens.push(total);
    return tokens;
  });

  goTo(pageNum: number): void {
    const next = Math.min(Math.max(1, pageNum), this.totalPages());
    if (next !== this.currentPage()) this.pageChange.emit(next);
  }

  changePageSize(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);
    if (this.pageSizes().includes(pageSize) && pageSize !== this.pageSize()) {
      this.pageSizeChange.emit(pageSize);
    }
  }
}
