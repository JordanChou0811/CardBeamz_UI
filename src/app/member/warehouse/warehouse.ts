import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ImageLightbox } from '../../shared/image-lightbox/image-lightbox';
import { Pagination } from '../../shared/pagination/pagination';
import {
  CvsBrand,
  Order,
  ShippingInfo,
  ShippingMethod,
  SHIPPING_FEE,
  WarehouseItem,
} from '../../models/models';

@Component({
  selector: 'app-warehouse',
  imports: [DatePipe, FormsModule, TranslatePipe, ImageLightbox, Pagination],
  template: `
    <div class="flex-between mb">
      <h2>{{ 'wh.title' | t }}</h2>
      <div class="steps">
        <span [class.on]="step() === 1">1 {{ 'wh.step1' | t }}</span>
        <span class="line"></span>
        <span [class.on]="step() === 2">2 {{ 'wh.step2' | t }}</span>
      </div>
    </div>

    <!-- 第一頁：倉庫一覽 -->
    @if (step() === 1) {
      <div class="warehouse-tabs">
        <button class="tab" [class.active]="warehouseTab() === 'available'" (click)="setTab('available')">
          📦 {{ 'wh.availableTab' | t }}
        </button>
        <button class="tab" [class.active]="warehouseTab() === 'pending'" (click)="setTab('pending')">
          🎁 {{ 'wh.pendingGiftTab' | t }} @if (pendingItemsCount()) { ({{ pendingItemsCount() }}) }
        </button>
        <button class="tab" [class.active]="warehouseTab() === 'placed'" (click)="setTab('placed')">
          📬 {{ 'wh.placedTab' | t }}
        </button>
        <button class="tab" [class.active]="warehouseTab() === 'shipped'" (click)="setTab('shipped')">
          🚚 {{ 'wh.shippedTab' | t }}
        </button>
      </div>

      @if (warehouseTab() === 'available') {
        <div class="card">
        @if (items().length === 0) {
          <div class="empty">
            <span class="emoji">📦</span>
            {{ 'wh.empty' | t }}
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'common.group' | t }}</th>
                <th>{{ 'common.groupPhoto' | t }}</th>
                <th style="width:260px">{{ 'wh.recycleExchange' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @for (it of items(); track it.id) {
                <tr>
                  <td>
                    <b>{{ it.cbz }}</b>
                    @if (it.cardName || it.cardNo) {
                      <div class="text-muted card-id">{{ it.cardName }}{{ it.cardNo ? ' #' + it.cardNo : '' }}</div>
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
                    <button class="btn btn-outline btn-sm" (click)="askRecycle(it)">{{ 'wh.recycle' | t }}</button>
                    <button class="btn btn-accent btn-sm" (click)="askExchange(it)">
                      {{ 'wh.exchange' | t }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <div class="flex-between mt-3">
            <span class="text-muted">{{ 'wh.shipAllHint' | t }}</span>
            <button class="btn btn-primary" (click)="goStep2()">
              {{ 'wh.shipAll' | t }}
            </button>
          </div>
        }
        </div>
      } @else if (warehouseTab() === 'pending') {
        <div class="card">
          @if (pendingItems().length === 0) {
            <div class="empty">
              <span class="emoji">🎁</span>
              {{ 'wh.emptyPendingGift' | t }}
            </div>
          } @else {
            <p class="text-muted pending-note">{{ 'wh.pendingGiftNote' | t }}</p>
            <table class="table">
              <thead>
                <tr>
                  <th>{{ 'common.group' | t }}</th>
                  <th>{{ 'common.groupPhoto' | t }}</th>
                  <th>{{ 'wh.pendingStatus' | t }}</th>
                </tr>
              </thead>
              <tbody>
                @for (it of pendingItems(); track it.id) {
                  <tr>
                    <td>
                      <b>{{ it.cbz }}</b>
                      @if (it.cardName || it.cardNo) {
                        <div class="text-muted card-id">{{ it.cardName }}{{ it.cardNo ? ' #' + it.cardNo : '' }}</div>
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
                    <td><span class="pending-badge">{{ 'wh.waitingRecipient' | t }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      } @else {
        <div class="card">
          @if (shippingOrders().length === 0) {
            <div class="empty">
              <span class="emoji">📦</span>
              {{ (warehouseTab() === 'placed' ? 'wh.emptyPlaced' : 'wh.emptyShipped') | t }}
            </div>
          } @else {
            @for (order of shippingOrders(); track order.id) {
              <div class="shipping-order">
                <div class="flex-between">
                  <b>{{ order.id }}</b>
                  <span class="text-muted">{{ order.createdAt | date: 'yyyy/MM/dd HH:mm' }}</span>
                </div>
                <p class="text-muted shipping-detail">{{ shippingDetail(order) }}</p>
                <table class="table">
                  <thead><tr><th>{{ 'common.group' | t }}</th><th>{{ 'common.groupPhoto' | t }}</th></tr></thead>
                  <tbody>
                    @for (item of order.items; track item.id) {
                      <tr>
                        <td><b>{{ item.cbz }}</b> @if (item.cardName || item.cardNo) { <span class="text-muted">· {{ item.cardName }}{{ item.cardNo ? ' #' + item.cardNo : '' }}</span> }</td>
                        <td>
                          <button
                            type="button"
                            class="thumb thumb-btn"
                            [class.clickable]="!isColor(item.groupPhoto) && !!item.groupPhoto"
                            [style.background]="isColor(item.groupPhoto) ? item.groupPhoto : null"
                            [disabled]="isColor(item.groupPhoto) || !item.groupPhoto"
                            (click)="openPhoto(item.groupPhoto)"
                          >
                            @if (!isColor(item.groupPhoto) && item.groupPhoto) { <img [src]="item.groupPhoto" alt="" /> } @else { {{ item.cbz.slice(0, 5) }} }
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </div>
      }
      <app-pagination
        [totalCount]="activePage().totalCount"
        [pageNum]="activePage().pageNum"
        [pageSize]="activePage().pageSize"
        (pageChange)="loadPage($event, activePage().pageSize)"
        (pageSizeChange)="loadPage(1, $event)"
      />
    }

    <!-- 第二頁：寄送方式 -->
    @if (step() === 2) {
      <div class="card">
        <div class="card-title">{{ 'wh.chooseShipping' | t }}</div>
        <div class="method-row">
          <label class="option-pill" [class.active]="method() === 'cvs'">
            <input type="radio" name="m" value="cvs" [ngModel]="method()" (ngModelChange)="setMethod('cvs')" hidden />
            🏪 {{ 'wh.cvs' | t }}
          </label>
          <label class="option-pill" [class.active]="method() === 'mail'">
            <input type="radio" name="m" value="mail" [ngModel]="method()" (ngModelChange)="setMethod('mail')" hidden />
            📮 {{ 'wh.mail' | t }}
          </label>
          <label class="option-pill" [class.active]="method() === 'pickup'">
            <input type="radio" name="m" value="pickup" [ngModel]="method()" (ngModelChange)="setMethod('pickup')" hidden />
            🤝 {{ 'wh.pickup' | t }}
          </label>
        </div>

        <!-- 超商店到店 -->
        @if (method() === 'cvs') {
          <div class="sub">
            <label class="sub-label">{{ 'wh.chooseCvs' | t }}</label>
            <div class="method-row">
              @for (b of cvsBrands; track b) {
                <label class="option-pill" [class.active]="cvsBrand() === b">
                  <input type="radio" name="b" [ngModel]="cvsBrand()" (ngModelChange)="cvsBrand.set(b)" [value]="b" hidden />
                  {{ b }}
                </label>
              }
            </div>
          </div>

          @if (cvsBrand()) {
            <div class="form-grid mt-2">
              <div class="field">
                <label>{{ 'common.name' | t }}<span class="req">*</span></label>
                <input [(ngModel)]="form.name" />
              </div>
              <div class="field">
                <label>{{ 'common.phone' | t }}<span class="req">*</span></label>
                <input [(ngModel)]="form.phone" />
              </div>
              <div class="field">
                <label>{{ 'wh.storeName' | t }}<span class="req">*</span></label>
                <input [(ngModel)]="form.storeName" />
              </div>
              <div class="field">
                <label>{{ 'wh.storeAddress' | t }}<span class="req">*</span></label>
                <input [(ngModel)]="form.storeAddress" />
              </div>
            </div>
          }
        }

        <!-- 郵寄 -->
        @if (method() === 'mail') {
          <div class="form-grid mt-2">
            <div class="field">
              <label>{{ 'common.name' | t }}<span class="req">*</span></label>
              <input [(ngModel)]="form.name" />
            </div>
            <div class="field">
              <label>{{ 'common.phone' | t }}<span class="req">*</span></label>
              <input [(ngModel)]="form.phone" />
            </div>
            <div class="field full">
              <label>{{ 'wh.address' | t }}<span class="req">*</span></label>
              <input [(ngModel)]="form.address" />
            </div>
          </div>
        }

        <!-- 自取 -->
        @if (method() === 'pickup') {
          <div class="form-grid mt-2">
            <div class="field">
              <label>{{ 'wh.lineId' | t }}<span class="req">*</span></label>
              <input [(ngModel)]="form.lineId" />
            </div>
            <div class="field">
              <label>{{ 'wh.lineName' | t }}<span class="req">*</span></label>
              <input [(ngModel)]="form.lineName" />
            </div>
          </div>
        }

        <div class="flex-between mt-3">
          <button class="btn btn-outline" (click)="step.set(1)">← {{ 'common.prev' | t }}</button>
          <div class="checkout">
            <button class="btn btn-primary" (click)="checkout()">{{ 'wh.checkout' | t }}</button>
            <span class="total">{{ 'common.total' | t }} {{ total() }} {{ 'common.yuan' | t }}</span>
          </div>
        </div>
      </div>
    }

    <!-- 回收確認 -->
    @if (recycleItem()) {
      <div class="modal-backdrop">
        <div class="modal">
          <h3>{{ 'wh.recycleConfirm' | t }}</h3>
          <div class="modal-body">{{ recycleItem()?.cbz }}</div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="recycleItem.set(null)">{{ 'common.cancel' | t }}</button>
            <button class="btn btn-primary" (click)="confirmRecycle()">{{ 'common.confirm' | t }}</button>
          </div>
        </div>
      </div>
    }

    <!-- 換團拆金確認 -->
    @if (exchangeItem()) {
      <div class="modal-backdrop">
        <div class="modal">
          <h3>{{ 'wh.exchangeConfirm' | t }}（{{ exchangeItem()?.exchangeValue }} {{ 'common.yuan' | t }}）！</h3>
          <div class="modal-body">{{ exchangeItem()?.cbz }}</div>
          <div class="modal-actions">
            <button class="btn btn-outline" (click)="exchangeItem.set(null)">{{ 'common.cancel' | t }}</button>
            <button class="btn btn-accent" (click)="confirmExchange()">{{ 'common.confirm' | t }}</button>
          </div>
        </div>
      </div>
    }

    <app-image-lightbox [url]="previewUrl()" (closed)="previewUrl.set(null)" />
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .steps {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--c-muted);
      }
      .steps .on {
        color: var(--c-primary);
        font-weight: 700;
      }
      .steps .line {
        width: 28px;
        height: 2px;
        background: var(--c-border);
      }
      .warehouse-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 14px;
      }
      .tab {
        border: 1px solid var(--c-border);
        background: var(--c-surface);
        border-radius: var(--radius-sm);
        padding: 9px 13px;
        cursor: pointer;
        color: var(--c-muted);
        font-weight: 700;
      }
      .tab.active {
        background: var(--c-primary-light);
        border-color: var(--c-primary);
        color: var(--c-primary-dark);
      }
      .pending-note {
        margin: 0 0 14px;
      }
      .pending-badge {
        display: inline-block;
        padding: 5px 9px;
        border-radius: 999px;
        background: var(--c-primary-light);
        color: var(--c-primary-dark);
        font-size: 13px;
        font-weight: 700;
      }
      .shipping-order {
        padding: 14px 0;
        border-bottom: 1px solid var(--c-border);
      }
      .shipping-order:last-child {
        padding-bottom: 0;
        border-bottom: none;
      }
      .shipping-detail {
        margin: 7px 0 10px;
      }
      td .btn {
        margin-right: 6px;
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
      .method-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .sub {
        margin-top: 18px;
      }
      .sub-label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 16px;
      }
      .form-grid .full {
        grid-column: 1 / -1;
      }
      .checkout {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .total {
        font-weight: 700;
        font-size: 17px;
        color: var(--c-primary);
      }
    `,
  ],
})
export class Warehouse implements OnInit {
  private data = inject(DataService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private alert = inject(AlertService);

  private memberId = this.auth.currentUser()!.id;

  step = signal(1);
  warehouseTab = signal<'available' | 'pending' | 'placed' | 'shipped'>('available');
  recycleItem = signal<WarehouseItem | null>(null);
  exchangeItem = signal<WarehouseItem | null>(null);

  method = signal<ShippingMethod>('cvs');
  cvsBrand = signal<CvsBrand | null>(null);
  cvsBrands: CvsBrand[] = ['7-11', '全家', '萊爾富', 'OK'];

  form: ShippingInfo = { method: 'cvs' };

  itemPage = this.data.itemPage;
  orderPage = this.data.orderPage;
  activePage = computed(() =>
    this.warehouseTab() === 'available' || this.warehouseTab() === 'pending' ? this.itemPage() : this.orderPage()
  );
  items = computed(() => this.warehouseTab() === 'available' ? this.itemPage().items : []);
  pendingItems = computed(() => this.warehouseTab() === 'pending' ? this.itemPage().items : []);
  pendingItemsCount = computed(() => {
    this.data.items();
    return this.data.itemsOf(this.memberId).filter((item) => item.status === 'gift_pending').length;
  });
  availableItems = computed(() => this.data.warehouseItems(this.memberId));
  shippingOrders = computed(() => this.orderPage().orders);

  total = computed(() => SHIPPING_FEE[this.method()]);

  isColor(value?: string): boolean {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value?.trim() ?? '');
  }

  previewUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPage();
  }

  setTab(tab: 'available' | 'pending' | 'placed' | 'shipped'): void {
    this.warehouseTab.set(tab);
    this.loadPage(1, this.activePage().pageSize);
  }

  loadPage(pageNum = 1, pageSize = 10): void {
    const tab = this.warehouseTab();
    if (tab === 'available' || tab === 'pending') {
      void this.data.refreshItemPage(this.memberId, tab === 'available' ? 'in_warehouse' : 'gift_pending', pageNum, pageSize);
      return;
    }
    void this.data.refreshOrderPage(tab, pageNum, pageSize, this.memberId);
  }

  openPhoto(photo?: string) {
    if (!photo || this.isColor(photo)) return;
    this.previewUrl.set(photo);
  }

  shippingDetail(order: Order): string {
    const shipping = order.shipping;
    if (shipping.method === 'cvs') {
      return `${shipping.cvsBrand}・${shipping.name}・${shipping.phone}・${shipping.storeName}`;
    }
    if (shipping.method === 'mail') return `${shipping.name}・${shipping.phone}・${shipping.address}`;
    return `Line：${shipping.lineName}（${shipping.lineId}）`;
  }

  setMethod(m: ShippingMethod) {
    this.method.set(m);
    this.form = { method: m };
    this.cvsBrand.set(null);
  }

  // ---- 回收 ----
  askRecycle(it: WarehouseItem) {
    this.recycleItem.set(it);
  }
  async confirmRecycle() {
    const it = this.recycleItem();
    if (it) {
      await this.data.recycle(it.id);
      this.loadPage(this.itemPage().pageNum, this.itemPage().pageSize);
    }
    this.recycleItem.set(null);
  }

  // ---- 換團拆金 ----
  askExchange(it: WarehouseItem) {
    this.exchangeItem.set(it);
  }
  async confirmExchange() {
    const it = this.exchangeItem();
    if (it) {
      await this.data.exchange(it.id);
      this.loadPage(this.itemPage().pageNum, this.itemPage().pageSize);
    }
    this.exchangeItem.set(null);
  }

  goStep2() {
    this.step.set(2);
    this.setMethod('cvs');
  }

  async checkout() {
    const m = this.method();
    const f = this.form;
    if (m === 'cvs') {
      if (!this.cvsBrand()) {
        await this.alert.error('wh.errCvs');
        return;
      }
      if (!f.name || !f.phone || !f.storeName || !f.storeAddress) {
        await this.alert.error('wh.errRequired');
        return;
      }
      f.cvsBrand = this.cvsBrand()!;
    } else if (m === 'mail') {
      if (!f.name || !f.phone || !f.address) {
        await this.alert.error('wh.errRequired');
        return;
      }
    } else if (!f.lineId || !f.lineName) {
      await this.alert.error('wh.errRequired');
      return;
    }

    const ids = this.availableItems().map((item) => item.id);
    try {
      await this.data.checkout(this.memberId, ids, { ...f, method: m });
      this.router.navigate(['/member/orders']);
    } catch {
      // API 錯誤已由 TelegramService 跳窗
    }
  }
}
