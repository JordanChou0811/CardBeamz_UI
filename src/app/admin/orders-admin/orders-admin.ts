import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Order, ShippingMethod } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-orders-admin',
  imports: [DatePipe, TranslatePipe],
  template: `
    <div class="flex-between mb">
      <h2>{{ 'aorders.title' | t }}</h2>
      <div class="tabs">
        <button [class.active]="tab() === 'placed'" (click)="tab.set('placed')">
          {{ 'aorders.pending' | t }}
        </button>
        <button [class.active]="tab() === 'shipped'" (click)="tab.set('shipped')">{{ 'aorders.shipped' | t }}</button>
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
                  <td><div class="thumb" [style.background]="it.groupPhoto">{{ it.cbz.slice(0, 5) }}</div></td>
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
    `,
  ],
})
export class OrdersAdmin {
  private data = inject(DataService);
  tab = signal<'placed' | 'shipped'>('placed');

  list = computed(() => this.data.orders().filter((o) => o.status === this.tab()));

  constructor() {
    void Promise.all([this.data.refreshOrders(), this.data.refreshMembers()]);
  }

  memberName(id: string) {
    return this.data.findMember(id)?.name ?? '—';
  }
  methodName(m: ShippingMethod) {
    return { cvs: 'wh.cvs', mail: 'wh.mail', pickup: 'wh.pickup' }[m];
  }
  detail(o: Order) {
    const s = o.shipping;
    if (s.method === 'cvs') return `${s.cvsBrand}・${s.name}・${s.phone}・${s.storeName}・${s.storeAddress}`;
    if (s.method === 'mail') return `${s.name}・${s.phone}・${s.address}`;
    return `Line：${s.lineName}（${s.lineId}）`;
  }
  async ship(o: Order) {
    await this.data.shipOrder(o.id);
  }
}
