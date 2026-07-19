import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartLine } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-cart',
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="flex-between mb">
      <h2>{{ 'cart.title' | t }}</h2>
      <a routerLink="/member/shop" class="btn btn-outline btn-sm">← {{ 'nav.shop' | t }}</a>
    </div>

    @if (success()) {
      <p class="success-text mb">{{ 'cart.checkedOut' | t }} — {{ 'cart.cashDue' | t }}：{{ success()!.cashDue }}
        {{ 'common.yuan' | t }}</p>
    }

    @if (data.cartLines().length === 0) {
      <div class="card">
        <div class="empty"><span class="emoji">🛒</span>{{ 'cart.empty' | t }}</div>
      </div>
    } @else {
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>{{ 'groups.code' | t }}</th>
              <th>{{ 'groups.name' | t }}</th>
              <th>{{ 'cart.team' | t }} / {{ 'shop.qty' | t }}</th>
              <th>{{ 'shop.unitNow' | t }}</th>
              <th>{{ 'cart.subtotal' | t }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (line of data.cartLines(); track line.cartItemId || line.teamSlotId || line.groupId) {
              <tr>
                <td><b>{{ line.groupCode }}</b></td>
                <td>{{ line.groupName }}</td>
                <td>
                  @if (line.kind === 'team') {
                    <b>{{ line.teamCode }}</b>
                    <span class="text-muted"> {{ line.teamName }}</span>
                  } @else {
                    <input
                      type="number"
                      class="qty-input"
                      min="1"
                      [max]="line.remainingStakes ?? 1"
                      [ngModel]="line.quantity"
                      (change)="onQty(line.groupId, $event)"
                    />
                  }
                </td>
                <td>{{ line.unitPrice }}</td>
                <td>{{ line.subtotal }}</td>
                <td>
                  <button type="button" class="btn btn-danger btn-sm" (click)="removeLine(line)">
                    {{ 'cart.remove' | t }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="card mt-2 checkout">
        <div class="row">
          <span>{{ 'cart.grand' | t }}</span>
          <b>{{ data.cartGrandSubtotal() }} {{ 'common.yuan' | t }}</b>
        </div>
        <div class="field">
          <label>{{ 'cart.creditUse' | t }}</label>
          <input
            type="number"
            min="0"
            step="1"
            [ngModel]="creditInput()"
            (ngModelChange)="onCreditChange($event)"
          />
          <p class="hint-text">
            {{ 'cart.creditHint' | t }}（{{ 'credit.balance' | t }}：{{ balance() }}
            {{ 'common.yuan' | t }}；{{ 'cart.creditMax' | t }} {{ maxCredit() }}
            {{ 'common.yuan' | t }}）
          </p>
        </div>
        <div class="row">
          <span>{{ 'cart.cashDue' | t }}</span>
          <b class="cash">{{ cashDue() }} {{ 'common.yuan' | t }}</b>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="busy()" (click)="checkout()">
          {{ 'cart.checkout' | t }}
        </button>
      </div>
    }
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .mt-2 {
        margin-top: 16px;
      }
      .qty-input {
        width: 72px;
      }
      .checkout {
        max-width: 420px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .cash {
        font-size: 22px;
        color: var(--c-primary-dark);
      }
      .success-text {
        color: var(--c-success, #15803d);
        font-weight: 600;
      }
    `,
  ],
})
export class Cart implements OnInit {
  protected data = inject(DataService);
  private auth = inject(AuthService);

  busy = signal(false);
  success = signal<{ cashDue: number } | null>(null);
  creditInput = signal(0);

  balance = computed(() => this.auth.currentUser()?.credit ?? 0);
  cashDue = computed(() => {
    const grand = this.data.cartGrandSubtotal();
    if (grand <= 0) return 0;
    return Math.max(0, grand - this.creditInput());
  });

  async ngOnInit() {
    const id = this.auth.currentUser()?.id;
    if (id) await this.data.refreshCart(id);
    this.clampCredit();
  }

  maxCredit(): number {
    const grand = this.data.cartGrandSubtotal();
    return Math.min(this.data.cartMaxCredit(), this.balance(), Math.max(0, grand));
  }

  clampCredit() {
    const capped = Math.min(Math.max(0, Math.floor(this.creditInput() || 0)), this.maxCredit());
    this.creditInput.set(capped);
  }

  onCreditChange(raw: number | string) {
    this.creditInput.set(Math.max(0, Math.floor(Number(raw) || 0)));
    this.clampCredit();
  }

  async onQty(groupId: string, ev: Event) {
    const memberId = this.auth.currentUser()?.id;
    if (!memberId) return;
    const raw = (ev.target as HTMLInputElement).value;
    const qty = Math.max(1, Math.floor(Number(raw) || 1));
    try {
      await this.data.upsertCart(memberId, groupId, qty);
      this.clampCredit();
    } catch {
      await this.data.refreshCart(memberId);
    }
  }

  async removeLine(line: CartLine) {
    const memberId = this.auth.currentUser()?.id;
    if (!memberId) return;
    try {
      if (line.kind === 'team' && line.teamSlotId) {
        await this.data.removeCartTeam(memberId, line.teamSlotId);
      } else {
        await this.data.removeCartItem(memberId, line.groupId);
      }
      this.clampCredit();
    } catch {
      // API 錯誤已由 TelegramService 跳窗
    }
  }

  async checkout() {
    const memberId = this.auth.currentUser()?.id;
    if (!memberId) return;
    this.success.set(null);
    this.clampCredit();
    this.busy.set(true);
    try {
      const res = await this.data.checkoutCart(memberId, this.creditInput());
      this.success.set({ cashDue: res.cashDue });
      this.creditInput.set(0);
    } catch {
      // API 錯誤已由 TelegramService 跳窗
    } finally {
      this.busy.set(false);
    }
  }
}
