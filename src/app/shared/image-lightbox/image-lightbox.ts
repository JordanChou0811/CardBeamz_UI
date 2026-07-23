import { Component, input, output } from '@angular/core';

/** 全螢幕點圖放大；點背景或關閉鈕結束 */
@Component({
  selector: 'app-image-lightbox',
  template: `
    @if (url()) {
      <div class="lightbox-backdrop" (click)="closed.emit()" role="dialog" aria-modal="true">
        <button type="button" class="lightbox-close" (click)="closed.emit()" aria-label="Close">
          ×
        </button>
        <img [src]="url()!" alt="" (click)="$event.stopPropagation()" />
      </div>
    }
  `,
  styles: [
    `
      .lightbox-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1200;
        background: rgba(0, 0, 0, 0.82);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        cursor: pointer;
      }
      .lightbox-backdrop img {
        max-width: min(92vw, 960px);
        max-height: 88vh;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
        cursor: default;
      }
      .lightbox-close {
        position: absolute;
        top: 16px;
        right: 18px;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
        color: #fff;
        font-size: 28px;
        line-height: 1;
        cursor: pointer;
      }
      .lightbox-close:hover {
        background: rgba(255, 255, 255, 0.28);
      }
    `,
  ],
})
export class ImageLightbox {
  /** 要放大的圖片網址；空字串／null 不顯示 */
  readonly url = input<string | null>(null);
  readonly closed = output<void>();
}
