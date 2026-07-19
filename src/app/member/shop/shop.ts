import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Group, PriceTier } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { apiErrorI18nKey } from '../../services/telegram.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-shop',
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="flex-between mb">
      <h2>{{ 'shop.title' | t }}</h2>
      <a routerLink="/member/cart" class="btn btn-outline btn-sm">🛒 {{ 'nav.cart' | t }}</a>
    </div>

    @if (error()) {
      <p class="error-text mb">{{ error() | t }}</p>
    }

    @if (data.listedGroups().length === 0) {
      <div class="card">
        <div class="empty"><span class="emoji">🎴</span>{{ 'shop.empty' | t }}</div>
      </div>
    } @else {
      <div class="shop-grid">
        @for (g of data.listedGroups(); track g.id) {
          <div class="card shop-card">
            <div class="thumb-lg" [style.background]="isColor(g.photo) ? g.photo : null">
              @if (!isColor(g.photo) && g.photo) {
                <img [src]="g.photo" alt="" />
              }
            </div>
            <div class="meta">
              <div class="code">{{ g.code }}</div>
              <div class="name">{{ g.name }}</div>
              <div class="text-muted">
                {{ 'groups.remaining' | t }}：{{ remaining(g) }} / {{ g.totalStakes ?? 0 }}
              </div>
              <div class="price-row">
                <span>{{ 'shop.unitNow' | t }}</span>
                <b>{{ unitPrice(g, qtyOf(g.id)) }} {{ 'common.yuan' | t }}</b>
              </div>
              <div class="buy-row">
                <label>
                  {{ 'shop.qty' | t }}
                  <input
                    type="number"
                    min="1"
                    [max]="remaining(g)"
                    [ngModel]="qtyOf(g.id)"
                    (ngModelChange)="setQty(g.id, $event)"
                  />
                </label>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  [disabled]="remaining(g) < 1 || adding() === g.id"
                  (click)="add(g)"
                >
                  {{ 'shop.addCart' | t }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .shop-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 16px;
      }
      .shop-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .thumb-lg {
        width: 100%;
        aspect-ratio: 1;
        border-radius: var(--radius-sm);
        overflow: hidden;
        background: var(--c-bg);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .thumb-lg img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .code {
        font-weight: 800;
        font-size: 15px;
      }
      .name {
        font-weight: 600;
        margin: 2px 0 6px;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        margin: 8px 0;
        font-size: 14px;
      }
      .buy-row {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 10px;
      }
      .buy-row label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: var(--c-muted);
      }
      .buy-row input {
        width: 88px;
      }
    `,
  ],
})
export class Shop implements OnInit {
  protected data = inject(DataService);
  private auth = inject(AuthService);

  error = signal('');
  adding = signal<string | null>(null);
  private qtyMap = signal<Record<string, number>>({});

  async ngOnInit() {
    await this.data.refreshListedGroups();
  }

  isColor(v: string) {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v ?? '');
  }

  remaining(g: Group): number {
    return g.remainingStakes ?? Math.max(0, (g.totalStakes ?? 0) - (g.soldStakes ?? 0));
  }

  qtyOf(id: string): number {
    return this.qtyMap()[id] ?? 1;
  }

  setQty(id: string, raw: number | string) {
    const n = Math.max(1, Math.floor(Number(raw) || 1));
    this.qtyMap.update((m) => ({ ...m, [id]: n }));
  }

  unitPrice(g: Group, qty: number): number {
    return unitPriceFor(g.basePrice ?? 0, g.priceTiers ?? [], qty);
  }

  async add(g: Group) {
    const memberId = this.auth.currentUser()?.id;
    if (!memberId) return;
    const rem = this.remaining(g);
    const qty = Math.min(this.qtyOf(g.id), rem);
    if (qty < 1) return;
    this.error.set('');
    this.adding.set(g.id);
    try {
      await this.data.upsertCart(memberId, g.id, qty);
      await this.data.refreshListedGroups();
    } catch (e) {
      this.error.set(apiErrorI18nKey(e, 'api.err.unknown'));
    } finally {
      this.adding.set(null);
    }
  }
}

function unitPriceFor(basePrice: number, tiers: PriceTier[], quantity: number): number {
  let price = Math.max(0, basePrice);
  if (!tiers?.length || quantity <= 0) return price;
  const sorted = [...tiers].filter((t) => t.minQty >= 2).sort((a, b) => a.minQty - b.minQty);
  for (const t of sorted) {
    if (quantity >= t.minQty) price = Math.max(0, t.unitPrice);
  }
  return price;
}
