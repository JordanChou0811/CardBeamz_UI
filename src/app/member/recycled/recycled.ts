import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ImageLightbox } from '../../shared/image-lightbox/image-lightbox';

@Component({
  selector: 'app-recycled',
  imports: [TranslatePipe, ImageLightbox],
  template: `
    <h2 class="mb">{{ 'recycled.title' | t }}</h2>

    <div class="card">
      <div class="card-title">♻️ {{ 'recycled.recycled' | t }}</div>
      @if (recycled().length === 0) {
        <div class="empty"><span class="emoji">♻️</span>{{ 'recycled.emptyRecycled' | t }}</div>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>{{ 'common.group' | t }}</th>
              <th>{{ 'common.groupPhoto' | t }}</th>
              <th>{{ 'common.status' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (it of recycled(); track it.id) {
              <tr>
                <td>
                  {{ it.cbz }}
                  @if (it.cardName || it.cardNo) {
                    <span class="text-muted"
                      >／{{ it.cardName }}{{ it.cardNo ? ' #' + it.cardNo : '' }}</span
                    >
                  }
                </td>
                <td>
                  <button
                    type="button"
                    class="thumb thumb-btn"
                    [class.clickable]="!isColor(it.groupPhoto) && !!it.groupPhoto"
                    [style.background]="isColor(it.groupPhoto) ? it.groupPhoto : null"
                    [disabled]="isColor(it.groupPhoto) || !it.groupPhoto"
                    (click)="openPhoto(it.groupPhoto)"
                  >
                    @if (!isColor(it.groupPhoto) && it.groupPhoto) {
                      <img [src]="it.groupPhoto" alt="" />
                    } @else {
                      {{ it.cbz.slice(0, 5) }}
                    }
                  </button>
                </td>
                <td><span class="badge badge-info">{{ 'recycled.recycled' | t }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <div class="card mt-2">
      <div class="card-title">💰 {{ 'recycled.exchanged' | t }}</div>
      @if (exchanged().length === 0) {
        <div class="empty"><span class="emoji">💰</span>{{ 'recycled.emptyExchanged' | t }}</div>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>{{ 'common.group' | t }}</th>
              <th>{{ 'common.groupPhoto' | t }}</th>
              <th>{{ 'common.status' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (it of exchanged(); track it.id) {
              <tr>
                <td>
                  {{ it.cbz }}
                  @if (it.cardName || it.cardNo) {
                    <span class="text-muted"
                      >／{{ it.cardName }}{{ it.cardNo ? ' #' + it.cardNo : '' }}</span
                    >
                  }
                </td>
                <td>
                  <button
                    type="button"
                    class="thumb thumb-btn"
                    [class.clickable]="!isColor(it.groupPhoto) && !!it.groupPhoto"
                    [style.background]="isColor(it.groupPhoto) ? it.groupPhoto : null"
                    [disabled]="isColor(it.groupPhoto) || !it.groupPhoto"
                    (click)="openPhoto(it.groupPhoto)"
                  >
                    @if (!isColor(it.groupPhoto) && it.groupPhoto) {
                      <img [src]="it.groupPhoto" alt="" />
                    } @else {
                      {{ it.cbz.slice(0, 5) }}
                    }
                  </button>
                </td>
                <td>
                  <span class="badge badge-success"
                    >{{ 'recycled.exchanged' | t }}（{{ it.exchangeValue }} {{ 'common.yuan' | t }}）</span
                  >
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <app-image-lightbox [url]="previewUrl()" (closed)="previewUrl.set(null)" />
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .thumb {
        overflow: hidden;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        pointer-events: none;
      }
      button.thumb-btn {
        border: none;
        padding: 0;
        font: inherit;
        color: inherit;
        cursor: default;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      button.thumb-btn.clickable {
        cursor: pointer;
      }
      button.thumb-btn.clickable:hover {
        transform: scale(1.06);
        box-shadow: 0 0 0 2px var(--c-primary);
      }
      button.thumb-btn:disabled {
        opacity: 1;
      }
    `,
  ],
})
export class Recycled {
  private data = inject(DataService);
  private auth = inject(AuthService);
  private memberId = this.auth.currentUser()!.id;

  previewUrl = signal<string | null>(null);

  recycled = computed(() =>
    this.data.items().filter((i) => i.memberId === this.memberId && i.status === 'recycled')
  );
  exchanged = computed(() =>
    this.data.items().filter((i) => i.memberId === this.memberId && i.status === 'exchanged')
  );

  isColor(value?: string): boolean {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value?.trim() ?? '');
  }

  openPhoto(photo?: string) {
    if (!photo || this.isColor(photo)) return;
    this.previewUrl.set(photo);
  }
}
