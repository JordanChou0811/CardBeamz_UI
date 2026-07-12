import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';
import {
  CvsBrand,
  ShippingInfo,
  ShippingMethod,
  SHIPPING_FEE,
  WarehouseItem,
} from '../../models/models';

@Component({
  selector: 'app-warehouse',
  imports: [FormsModule, TranslatePipe],
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
                <th style="width:60px">
                  <label class="checkbox">
                    <input type="checkbox" [checked]="allChecked()" (change)="toggleAll($event)" />
                    {{ 'wh.selectAll' | t }}
                  </label>
                </th>
                <th>{{ 'common.group' | t }}</th>
                <th>{{ 'common.groupPhoto' | t }}</th>
                <th style="width:260px">{{ 'wh.recycleExchange' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @for (it of items(); track it.id) {
                <tr>
                  <td>
                    <label class="checkbox">
                      <input
                        type="checkbox"
                        [checked]="selected().has(it.id)"
                        (change)="toggleOne(it.id)"
                      />
                    </label>
                  </td>
                  <td>
                    <b>{{ it.cbz }}</b>
                    @if (it.cardName || it.cardNo) {
                      <div class="text-muted card-id">{{ it.cardName }}{{ it.cardNo ? ' #' + it.cardNo : '' }}</div>
                    }
                  </td>
                  <td>
                    <div class="thumb" [style.background]="it.groupPhoto">{{ it.cbz.slice(0, 5) }}</div>
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
            <span class="text-muted">{{ 'wh.selectedCount' | t }} {{ selected().size }} {{ 'wh.items' | t }}</span>
            <button class="btn btn-primary" [disabled]="selected().size === 0" (click)="goStep2()">
              {{ 'common.next' | t }} →
            </button>
          </div>
        }
      </div>
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

        @if (error()) {
          <p class="error-text">{{ error() | t }}</p>
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
      td .btn {
        margin-right: 6px;
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
export class Warehouse {
  private data = inject(DataService);
  private auth = inject(AuthService);
  private router = inject(Router);

  private memberId = this.auth.currentUser()!.id;

  step = signal(1);
  selected = signal<Set<string>>(new Set());
  recycleItem = signal<WarehouseItem | null>(null);
  exchangeItem = signal<WarehouseItem | null>(null);
  error = signal('');

  method = signal<ShippingMethod>('cvs');
  cvsBrand = signal<CvsBrand | null>(null);
  cvsBrands: CvsBrand[] = ['7-11', '全家', '萊爾富', 'OK'];

  form: ShippingInfo = { method: 'cvs' };

  items = computed(() => {
    this.data.items();
    return this.data.warehouseItems(this.memberId);
  });

  total = computed(() => SHIPPING_FEE[this.method()]);

  allChecked() {
    const list = this.items();
    return list.length > 0 && list.every((i) => this.selected().has(i.id));
  }

  toggleAll(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    const set = new Set<string>();
    if (checked) this.items().forEach((i) => set.add(i.id));
    this.selected.set(set);
  }

  toggleOne(id: string) {
    const set = new Set(this.selected());
    set.has(id) ? set.delete(id) : set.add(id);
    this.selected.set(set);
  }

  setMethod(m: ShippingMethod) {
    this.method.set(m);
    this.form = { method: m };
    this.cvsBrand.set(null);
    this.error.set('');
  }

  // ---- 回收 ----
  askRecycle(it: WarehouseItem) {
    this.recycleItem.set(it);
  }
  async confirmRecycle() {
    const it = this.recycleItem();
    if (it) {
      await this.data.recycle(it.id);
      this.dropFromSelection(it.id);
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
      this.dropFromSelection(it.id);
    }
    this.exchangeItem.set(null);
  }

  private dropFromSelection(id: string) {
    const set = new Set(this.selected());
    set.delete(id);
    this.selected.set(set);
  }

  goStep2() {
    this.step.set(2);
    this.setMethod('cvs');
  }

  async checkout() {
    this.error.set('');
    const m = this.method();
    const f = this.form;
    if (m === 'cvs') {
      if (!this.cvsBrand()) return this.error.set('wh.errCvs');
      if (!f.name || !f.phone || !f.storeName || !f.storeAddress)
        return this.error.set('wh.errRequired');
      f.cvsBrand = this.cvsBrand()!;
    } else if (m === 'mail') {
      if (!f.name || !f.phone || !f.address) return this.error.set('wh.errRequired');
    } else {
      if (!f.lineId || !f.lineName) return this.error.set('wh.errRequired');
    }

    const ids = [...this.selected()];
    await this.data.checkout(this.memberId, ids, { ...f, method: m });
    this.selected.set(new Set());
    this.router.navigate(['/member/orders']);
  }
}
