import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Group, PriceTier } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-shop',
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="flex-between mb">
      <h2>{{ 'shop.title' | t }}</h2>
      <a routerLink="/member/cart" class="btn btn-outline btn-sm">🛒 {{ 'nav.cart' | t }}</a>
    </div>

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
              <div class="price-list">
                <div class="price-row">
                  <span>{{ 'shop.priceBase' | t }}</span>
                  <b>{{ g.basePrice ?? 0 }} {{ 'common.yuan' | t }}</b>
                </div>
                @for (t of tiersOf(g); track t.minQty) {
                  <div class="price-row tier">
                    <span>{{ tierLabel(t.minQty) }}</span>
                    <b>{{ 'shop.perStake' | t }} {{ t.unitPrice }} {{ 'common.yuan' | t }}</b>
                  </div>
                }
                <div class="price-row now">
                  <span>{{ 'shop.unitNow' | t }}</span>
                  <b>{{ unitPrice(g, qtyOf(g.id)) }} {{ 'common.yuan' | t }}</b>
                </div>
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
      .price-list {
        margin: 10px 0;
        padding: 10px 0;
        border-top: 1px solid var(--c-border);
        border-bottom: 1px solid var(--c-border);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
        font-size: 14px;
      }
      .price-row.tier {
        color: var(--c-muted);
        font-size: 13px;
      }
      .price-row.now {
        margin-top: 2px;
        padding-top: 6px;
        border-top: 1px dashed var(--c-border);
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
  private i18n = inject(I18nService);

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

  tiersOf(g: Group): PriceTier[] {
    return [...(g.priceTiers ?? [])]
      .filter((t) => t.minQty >= 2)
      .sort((a, b) => a.minQty - b.minQty);
  }

  tierLabel(minQty: number): string {
    return this.i18n.t('shop.priceTier').replace('{{n}}', String(minQty));
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
    this.adding.set(g.id);
    try {
      await this.data.upsertCart(memberId, g.id, qty);
      await this.data.refreshListedGroups();
    } catch {
      // API 錯誤已由 TelegramService 跳窗
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
