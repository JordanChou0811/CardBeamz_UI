import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Order, ShippingMethod } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';
import { ImageLightbox } from '../../shared/image-lightbox/image-lightbox';
import { Pagination } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-orders-admin',
  imports: [DatePipe, TranslatePipe, ImageLightbox, Pagination],
  template: `
    <div class="flex-between mb">
      <h2>{{ 'aorders.title' | t }}</h2>
      <div class="tabs">
        <button [class.active]="tab() === 'placed'" (click)="setTab('placed')">
          {{ 'aorders.pending' | t }}
        </button>
        <button [class.active]="tab() === 'shipped'" (click)="setTab('shipped')">{{ 'aorders.shipped' | t }}</button>
      </div>
    </div>

    @if (list().length === 0) {
      <div class="card empty"><span class="emoji">📦</span>{{ (tab() === 'placed' ? 'aorders.emptyPending' : 'aorders.emptyShipped') | t }}</div>
    } @else {
      @for (o of list(); track o.id) {
        <div class="card order">
          <div class="flex-between">
            <div>
              <b>{{ o.id }}</b>
              <span class="text-muted">　{{ 'aorders.member' | t }} {{ memberName(o.memberId) }}（{{ o.memberId }}）</span>
            </div>
            <span class="text-muted">{{ o.createdAt | date: 'yyyy/MM/dd HH:mm' }}</span>
          </div>

          <div class="ship mt-1">
            <span class="badge badge-info">{{ methodName(o.shipping.method) | t }}</span>
            <span class="text-muted">{{ detail(o) }}</span>
          </div>

          <table class="table mt-1">
            <thead><tr><th>{{ 'common.group' | t }}</th><th>{{ 'common.groupPhoto' | t }}</th></tr></thead>
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
                        <img [src]="it.groupPhoto" [alt]="it.cbz" />
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
            <b class="total">{{ 'common.total' | t }} {{ o.total }} {{ 'common.yuan' | t }}</b>
            @if (o.status === 'placed') {
              <button class="btn btn-success btn-sm" (click)="ship(o)">{{ 'aorders.ship' | t }}</button>
            } @else {
              <span class="badge badge-success">{{ 'aorders.shippedAt' | t }} {{ o.shippedAt | date: 'MM/dd HH:mm' }}</span>
            }
          </div>
        </div>
      }
    }

    <app-pagination
      [totalCount]="page().totalCount"
      [pageNum]="page().pageNum"
      [pageSize]="page().pageSize"
      (pageChange)="loadPage($event, page().pageSize)"
      (pageSizeChange)="loadPage(1, $event)"
    />
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
      .ship {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }
      .total {
        color: var(--c-primary);
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
export class OrdersAdmin {
  private data = inject(DataService);
  tab = signal<'placed' | 'shipped'>('placed');
  page = this.data.orderPage;
  previewUrl = signal<string | null>(null);

  list = computed(() => this.page().orders);

  constructor() {
    void this.data.refreshMembers();
    this.loadPage();
  }

  setTab(tab: 'placed' | 'shipped'): void {
    this.tab.set(tab);
    this.loadPage(1, this.page().pageSize);
  }

  loadPage(pageNum = 1, pageSize = 10): void {
    void this.data.refreshOrderPage(this.tab(), pageNum, pageSize);
  }

  memberName(id: string) {
    return this.data.findMember(id)?.name ?? '—';
  }
  methodName(m: ShippingMethod) {
    return { cvs: 'wh.cvs', mail: 'wh.mail', pickup: 'wh.pickup' }[m];
  }
  isColor(value?: string): boolean {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value?.trim() ?? '');
  }
  openPhoto(photo?: string): void {
    if (!photo || this.isColor(photo)) return;
    this.previewUrl.set(photo);
  }
  detail(o: Order) {
    const s = o.shipping;
    if (s.method === 'cvs') return `${s.cvsBrand}・${s.name}・${s.phone}・${s.storeName}・${s.storeAddress}`;
    if (s.method === 'mail') return `${s.name}・${s.phone}・${s.address}`;
    return `Line：${s.lineName}（${s.lineId}）`;
  }
  async ship(o: Order) {
    await this.data.shipOrder(o.id);
    this.loadPage(this.page().pageNum, this.page().pageSize);
  }
}
