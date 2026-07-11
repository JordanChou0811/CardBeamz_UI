import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { Order, ShippingMethod } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-orders',
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
                  <td><div class="thumb" [style.background]="it.groupPhoto">{{ it.cbz.slice(0, 5) }}</div></td>
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
    `,
  ],
  imports: [DatePipe, TranslatePipe],
})
export class Orders {
  private data = inject(DataService);
  private auth = inject(AuthService);
  private memberId = this.auth.currentUser()!.id;

  tab = signal<'placed' | 'shipped'>('placed');

  list = computed(() =>
    this.data.ordersOf(this.memberId).filter((o) => o.status === this.tab())
  );

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
