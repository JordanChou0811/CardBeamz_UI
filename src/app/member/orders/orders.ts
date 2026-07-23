import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { Order, ShippingMethod } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';
import { ImageLightbox } from '../../shared/image-lightbox/image-lightbox';

@Component({
  selector: 'app-orders',
  imports: [DatePipe, TranslatePipe, ImageLightbox],
  template: `
    <div class="flex-between mb">
      <h2>{{ 'orders.title' | t }}</h2>
      <div class="tabs">
        <button [class.active]="tab() === 'placed'" (click)="tab.set('placed')">{{ 'orders.placed' | t }}</button>
        <button [class.active]="tab() === 'shipped'" (click)="tab.set('shipped')">{{ 'orders.shipped' | t }}</button>
      </div>
    </div>

    @if (list().length === 0) {
      <div class="card empty">
        <span class="emoji">🧾</span>
        {{ (tab() === 'placed' ? 'orders.emptyPlaced' : 'orders.emptyShipped') | t }}
      </div>
    } @else {
      @for (o of list(); track o.id) {
        <div class="card order">
          <div class="flex-between">
            <div>
              <b>{{ 'orders.order' | t }} {{ o.id }}</b>
              <span class="badge" [class.badge-warning]="o.status === 'placed'" [class.badge-success]="o.status === 'shipped'">
                {{ (o.status === 'placed' ? 'orders.placed' : 'orders.shipped') | t }}
              </span>
            </div>
            <span class="text-muted">{{ o.createdAt | date: 'yyyy/MM/dd HH:mm' }}</span>
          </div>

          <div class="ship-info">
            <span class="badge badge-info">{{ methodName(o.shipping.method) | t }}</span>
            <span class="text-muted">{{ shippingDetail(o) }}</span>
          </div>

          <table class="table mt-1">
            <thead>
              <tr><th>{{ 'common.group' | t }}</th><th>{{ 'common.groupPhoto' | t }}</th></tr>
            </thead>
            <tbody>
              @for (it of o.items; track it.id) {
                <tr>
                  <td>
                    {{ it.cbz }}
                    @if (it.cardName || it.cardNo) {
                      <span class="text-muted">／{{ it.cardName }}{{ it.cardNo ? ' #' + it.cardNo : '' }}</span>
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
                </tr>
              }
            </tbody>
          </table>

          <div class="flex-between mt-1">
            <span class="text-muted">{{ 'orders.itemsTotal' | t }} {{ o.items.length }} {{ 'orders.itemsUnit' | t }}</span>
            <b class="total">{{ 'common.total' | t }} {{ o.total }} {{ 'common.yuan' | t }}</b>
          </div>
        </div>
      }
    }

    <app-image-lightbox [url]="previewUrl()" (closed)="previewUrl.set(null)" />
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .order {
        margin-bottom: 16px;
      }
      .badge {
        margin-left: 8px;
      }
      .ship-info {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .total {
        color: var(--c-primary);
        font-size: 16px;
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
export class Orders {
  private data = inject(DataService);
  private auth = inject(AuthService);
  private memberId = this.auth.currentUser()!.id;

  tab = signal<'placed' | 'shipped'>('placed');
  previewUrl = signal<string | null>(null);

  list = computed(() =>
    this.data.ordersOf(this.memberId).filter((o) => o.status === this.tab())
  );

  isColor(value?: string): boolean {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value?.trim() ?? '');
  }

  openPhoto(photo?: string) {
    if (!photo || this.isColor(photo)) return;
    this.previewUrl.set(photo);
  }

  methodName(m: ShippingMethod) {
    return { cvs: 'wh.cvs', mail: 'wh.mail', pickup: 'wh.pickup' }[m];
  }

  shippingDetail(o: Order) {
    const s = o.shipping;
    if (s.method === 'cvs') return `${s.cvsBrand}・${s.name}・${s.storeName}`;
    if (s.method === 'mail') return `${s.name}・${s.address}`;
    return `Line：${s.lineName}（${s.lineId}）`;
  }
}
