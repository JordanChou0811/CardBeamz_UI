import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Group, PriceTier } from '../../models/models';
import { DataService } from '../../services/data.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../services/translate.pipe';

function isTeamSale(type?: string): boolean {
  return type === 'bball_team' || type === 'baseball_team';
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

@Component({
  selector: 'app-shop',
  imports: [RouterLink, TranslatePipe],
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
          <a class="card shop-card" [routerLink]="['/member/shop', g.id]">
            <div class="thumb-lg" [style.background]="isColor(g.photo) ? g.photo : null">
              @if (!isColor(g.photo) && g.photo) {
                <img [src]="g.photo" [alt]="g.name" />
              }
            </div>
            <div class="meta">
              <div class="code">{{ g.code }}</div>
              <div class="name">{{ g.name }}</div>
              <div class="badge badge-info">{{ typeLabel(g.type) | t }}</div>
              <div class="text-muted">
                {{ 'groups.remaining' | t }}：{{ remaining(g) }} / {{ g.totalStakes ?? 0 }}
              </div>
              <div class="price-teaser">{{ priceTeaser(g) }}</div>
            </div>
          </a>
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
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }
      .shop-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.12s ease, transform 0.12s ease;
      }
      .shop-card:hover {
        border-color: var(--c-primary);
        transform: translateY(-2px);
      }
      .thumb-lg {
        width: 100%;
        aspect-ratio: 1;
        border-radius: var(--radius-sm);
        overflow: hidden;
        background: var(--c-bg);
      }
      .thumb-lg img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .code {
        font-weight: 800;
        font-size: 15px;
      }
      .name {
        font-weight: 600;
        margin: 2px 0 6px;
      }
      .price-teaser {
        margin-top: 8px;
        font-weight: 700;
        color: var(--c-primary-dark);
      }
    `,
  ],
})
export class Shop implements OnInit {
  protected data = inject(DataService);
  private i18n = inject(I18nService);

  async ngOnInit() {
    await this.data.refreshListedGroups();
  }

  typeLabel(type?: string): string {
    if (type === 'bball_team') return 'groups.type.bball_team';
    if (type === 'baseball_team') return 'groups.type.baseball_team';
    return 'groups.type.stake_sale';
  }

  isColor(v: string) {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v ?? '');
  }

  remaining(g: Group): number {
    return g.remainingStakes ?? Math.max(0, (g.totalStakes ?? 0) - (g.soldStakes ?? 0));
  }

  priceTeaser(g: Group): string {
    if (isTeamSale(g.type)) {
      const min = g.minTeamPrice ?? 0;
      return this.i18n.t('shop.fromTeamPrice').replace('{{n}}', String(min));
    }
    const unit = unitPriceFor(g.basePrice ?? 0, g.priceTiers ?? [], 1);
    return this.i18n.t('shop.fromStakePrice').replace('{{n}}', String(unit));
  }
}
