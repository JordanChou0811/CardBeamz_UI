import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ImageLightbox } from '../../shared/image-lightbox/image-lightbox';
import { Pagination } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-purchase-orders',
  imports: [DatePipe, TranslatePipe, ImageLightbox, Pagination],
  template: `
    <h2 class="mb">{{ 'purchaseOrders.title' | t }}</h2>
    @if (data.purchaseOrders().length === 0) {
      <div class="card empty"><span class="emoji">🧾</span>{{ 'purchaseOrders.empty' | t }}</div>
    } @else {
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>{{ 'common.group' | t }}</th>
              <th>{{ 'common.groupPhoto' | t }}</th>
              <th>{{ 'purchaseOrders.item' | t }}</th>
              <th>{{ 'common.total' | t }}</th>
              <th>{{ 'purchaseOrders.payment' | t }}</th>
              <th>{{ 'purchaseOrders.createdAt' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (order of pageOrders(); track order.id) {
              <tr>
                <td><b>{{ order.groupCode }}</b><div class="text-muted">{{ order.groupName }}</div></td>
                <td>
                  <button
                    type="button"
                    class="thumb thumb-btn"
                    [class.clickable]="!isColor(order.groupPhoto) && !!order.groupPhoto"
                    [style.background]="isColor(order.groupPhoto) ? order.groupPhoto : null"
                    [disabled]="isColor(order.groupPhoto) || !order.groupPhoto"
                    (click)="openPhoto(order.groupPhoto)"
                  >
                    @if (!isColor(order.groupPhoto) && order.groupPhoto) {
                      <img [src]="order.groupPhoto" [alt]="order.groupName" />
                    } @else {
                      {{ order.groupCode }}
                    }
                  </button>
                </td>
                <td>
                  @if (order.kind === 'team') {
                    <b>{{ order.teamCode }}</b> {{ order.teamName }}
                  } @else {
                    {{ order.quantity }} {{ 'purchaseOrders.stakes' | t }} × {{ order.unitPrice }}
                  }
                </td>
                <td><b>{{ order.subtotal }} {{ 'common.yuan' | t }}</b></td>
                <td>{{ 'purchaseOrders.credit' | t }} {{ order.creditUsed }} / {{ 'purchaseOrders.cash' | t }} {{ order.cashDue }}</td>
                <td class="text-muted">{{ order.createdAt | date: 'yyyy/MM/dd HH:mm' }}</td>
              </tr>
            }
          </tbody>
        </table>
        <app-pagination
          [totalCount]="data.purchaseOrders().length"
          [pageNum]="pageNum()"
          [pageSize]="pageSize()"
          (pageChange)="pageNum.set($event)"
          (pageSizeChange)="setPageSize($event)"
        />
      </div>
    }
    <app-image-lightbox [url]="previewUrl()" (closed)="previewUrl.set(null)" />
  `,
  styles: [
    `
      .mb { margin-bottom: 18px; }
      .thumb { overflow: hidden; }
      .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
      button.thumb-btn { border: none; padding: 0; font: inherit; color: inherit; cursor: default; }
      button.thumb-btn.clickable { cursor: pointer; }
      button.thumb-btn.clickable:hover { transform: scale(1.06); box-shadow: 0 0 0 2px var(--c-primary); }
      button.thumb-btn:disabled { opacity: 1; }
    `,
  ],
})
export class PurchaseOrders implements OnInit {
  protected data = inject(DataService);
  private auth = inject(AuthService);
  previewUrl = signal<string | null>(null);
  pageNum = signal(1);
  pageSize = signal(10);
  pageOrders = computed(() => {
    const start = (this.pageNum() - 1) * this.pageSize();
    return this.data.purchaseOrders().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    const memberId = this.auth.currentUser()?.id;
    if (memberId) void this.data.refreshPurchaseOrders(memberId);
  }

  setPageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.pageNum.set(1);
  }

  isColor(value?: string): boolean {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value?.trim() ?? '');
  }

  openPhoto(photo?: string): void {
    if (!photo || this.isColor(photo)) return;
    this.previewUrl.set(photo);
  }
}
