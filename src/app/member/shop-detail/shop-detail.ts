import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Group, PriceTier, TeamSlot } from '../../models/models';
import { AuthService } from '../../services/auth.service';
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
  selector: 'app-shop-detail',
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="top-bar mb">
      <a routerLink="/member/shop" class="btn btn-outline btn-sm">{{ 'shop.backToList' | t }}</a>
      <a routerLink="/member/cart" class="btn btn-outline btn-sm">{{ 'nav.cart' | t }}</a>
    </div>

    @if (loading()) {
      <div class="card">
        <div class="empty">{{ 'shop.loading' | t }}</div>
      </div>
    } @else if (group(); as g) {
      <div class="detail">
        <div class="hero card">
          <div class="thumb" [style.background]="isColor(g.photo) ? g.photo : null">
            @if (!isColor(g.photo) && g.photo) {
              <img [src]="g.photo" [alt]="g.name" />
            }
          </div>
          <div class="hero-meta">
            <div class="code">{{ g.code }}</div>
            <h2 class="name">{{ g.name }}</h2>
            <div class="badge badge-info">{{ typeLabel(g.type) | t }}</div>
            <div class="text-muted mt-1">
              {{ 'groups.remaining' | t }}: {{ remaining(g) }} / {{ g.totalStakes ?? 0 }}
            </div>
          </div>
        </div>

        @if (addedOk()) {
          <div class="banner card">
            <span>{{ 'shop.addedCart' | t }}</span>
            <a routerLink="/member/cart" class="btn btn-primary btn-sm">{{ 'shop.viewCart' | t }}</a>
          </div>
        }

        @if (isTeamSale(g.type)) {
          <div class="card section">
            <div class="card-title">{{ 'shop.pickTeam' | t }}</div>
            <p class="hint-text">{{ 'shop.pickTeamHint' | t }}</p>
            @if (teamSlots().length === 0) {
              <div class="empty">{{ 'shop.teamsEmpty' | t }}</div>
            } @else {
              <div class="team-grid">
                @for (s of teamSlots(); track s.id) {
                  <button
                    type="button"
                    class="team-cell"
                    [class.sold]="s.status === 'sold'"
                    [class.selected]="isTeamSelected(s.id)"
                    [disabled]="s.status === 'sold'"
                    (click)="toggleTeam(s)"
                  >
                    <div class="t-code">{{ s.teamCode }}</div>
                    <div class="t-name">{{ s.teamName }}</div>
                    <div class="t-action">
                      @if (s.status === 'sold') {
                        {{ 'shop.teamSold' | t }}
                      } @else if (isTeamSelected(s.id)) {
                        {{ 'shop.teamSelected' | t }}
                      } @else {
                        {{ 'shop.buyTeam' | t }}
                      }
                    </div>
                  </button>
                }
              </div>
            }
          </div>
        } @else {
          <div class="card section">
            <div class="card-title">{{ 'groups.saleSection' | t }}</div>
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
                <b>{{ unitPrice(g, qty()) }} {{ 'common.yuan' | t }}</b>
              </div>
            </div>
          </div>
        }

        <div class="buy-bar card">
          @if (isTeamSale(g.type)) {
            <div class="buy-summary text-muted">
              @if (selectedTeamIds().size > 0) {
                {{ selectedCountLabel() }}
              } @else {
                {{ 'shop.selectTeamsFirst' | t }}
              }
            </div>
            <div class="buy-actions">
              <div class="buy-total">
                <span class="buy-total-label">{{ 'shop.selectedTotal' | t }}</span>
                <b class="buy-total-value">{{ selectedTotal() }} {{ 'common.yuan' | t }}</b>
              </div>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="selectedTeamIds().size === 0 || busy()"
                (click)="addSelectedTeams()"
              >
                {{ 'shop.addCart' | t }}
                @if (selectedTeamIds().size > 0) {
                  ({{ selectedTeamIds().size }})
                }
              </button>
            </div>
          } @else {
            <label class="qty-field">
              {{ 'shop.qty' | t }}
              <input
                type="number"
                min="1"
                [max]="remaining(g)"
                [ngModel]="qty()"
                (ngModelChange)="setQty($event)"
              />
            </label>
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="remaining(g) < 1 || busy()"
              (click)="addStake()"
            >
              {{ 'shop.addCart' | t }}
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .mb {
        margin-bottom: 16px;
      }
      .mt-1 {
        margin-top: 8px;
      }
      .top-bar {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
      }
      .detail {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding-bottom: 88px;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(140px, 280px) 1fr;
        gap: 16px;
        align-items: center;
      }
      .thumb {
        width: 100%;
        aspect-ratio: 1;
        border-radius: var(--radius-sm);
        overflow: hidden;
        background: var(--c-bg);
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .code {
        font-weight: 800;
        font-size: 14px;
      }
      .name {
        margin: 4px 0 8px;
        font-size: 1.4rem;
        line-height: 1.25;
      }
      .banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-color: var(--c-primary);
        background: var(--c-primary-light);
      }
      .section .card-title {
        margin-bottom: 6px;
      }
      .price-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
      }
      .price-row.tier {
        color: var(--c-muted);
        font-size: 13px;
      }
      .price-row.now {
        margin-top: 2px;
        padding-top: 8px;
        border-top: 1px dashed var(--c-border);
        font-weight: 600;
      }
      .team-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }
      .team-cell {
        border: 1px solid var(--c-border);
        border-radius: var(--radius-sm);
        padding: 12px 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        text-align: left;
        background: var(--c-surface);
        color: var(--c-text);
        cursor: pointer;
      }
      .team-cell:hover:not(:disabled) {
        border-color: var(--c-primary);
      }
      .team-cell.selected {
        border-color: var(--c-primary);
        background: var(--c-primary-light);
        box-shadow: inset 0 0 0 1px var(--c-primary);
      }
      .team-cell.sold,
      .team-cell:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .t-code {
        font-weight: 800;
      }
      .t-name {
        font-size: 13px;
        color: var(--c-muted);
      }
      .t-action {
        font-size: 12px;
        font-weight: 700;
        color: var(--c-muted);
        margin-top: 4px;
      }
      .team-cell.selected .t-action {
        color: var(--c-primary-dark);
      }
      .buy-bar {
        position: sticky;
        bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        z-index: 2;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }
      .buy-actions {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-left: auto;
      }
      .buy-total {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        line-height: 1.2;
      }
      .buy-total-label {
        font-size: 12px;
        color: var(--c-muted);
      }
      .buy-total-value {
        font-size: 1.15rem;
        font-variant-numeric: tabular-nums;
        color: var(--c-primary-dark);
      }
      .qty-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: var(--c-muted);
      }
      .qty-field input {
        width: 96px;
      }
      .buy-summary {
        font-size: 14px;
      }
      @media (max-width: 640px) {
        .hero {
          grid-template-columns: 1fr;
        }
        .buy-bar {
          flex-wrap: wrap;
        }
        .buy-actions {
          width: 100%;
          justify-content: space-between;
        }
        .buy-bar .btn {
          flex: 0 0 auto;
        }
      }
    `,
  ],
})
export class ShopDetail implements OnInit {
  protected data = inject(DataService);
  private auth = inject(AuthService);
  private i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly isTeamSale = isTeamSale;

  loading = signal(true);
  group = signal<Group | null>(null);
  teamSlots = signal<TeamSlot[]>([]);
  selectedTeamIds = signal<Set<string>>(new Set());
  qty = signal(1);
  busy = signal(false);
  addedOk = signal(false);

  async ngOnInit() {
    const groupId = this.route.snapshot.paramMap.get('groupId') ?? '';
    await this.data.refreshListedGroups();
    const g = this.data.listedGroups().find((x) => x.id === groupId) ?? null;
    if (!g) {
      await this.router.navigateByUrl('/member/shop');
      return;
    }
    this.group.set(g);
    if (isTeamSale(g.type)) {
      await this.data.refreshTeamSlots(g.id);
      this.teamSlots.set(this.data.teamSlots());
    }
    this.loading.set(false);
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

  tiersOf(g: Group): PriceTier[] {
    return [...(g.priceTiers ?? [])]
      .filter((t) => t.minQty >= 2)
      .sort((a, b) => a.minQty - b.minQty);
  }

  tierLabel(minQty: number): string {
    return this.i18n.t('shop.priceTier').replace('{{n}}', String(minQty));
  }

  selectedCountLabel(): string {
    return this.i18n.t('shop.selectedCount').replace('{{n}}', String(this.selectedTeamIds().size));
  }

  selectedTotal(): number {
    const ids = this.selectedTeamIds();
    return this.teamSlots()
      .filter((s) => ids.has(s.id))
      .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }

  unitPrice(g: Group, qty: number): number {
    return unitPriceFor(g.basePrice ?? 0, g.priceTiers ?? [], qty);
  }

  setQty(raw: number | string) {
    const g = this.group();
    const rem = g ? this.remaining(g) : 1;
    const n = Math.min(rem, Math.max(1, Math.floor(Number(raw) || 1)));
    this.qty.set(n);
  }

  isTeamSelected(id: string): boolean {
    return this.selectedTeamIds().has(id);
  }

  toggleTeam(s: TeamSlot) {
    if (s.status !== 'available') return;
    this.selectedTeamIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(s.id)) next.delete(s.id);
      else next.add(s.id);
      return next;
    });
  }

  async addStake() {
    const g = this.group();
    const memberId = this.auth.currentUser()?.id;
    if (!g || !memberId) return;
    const rem = this.remaining(g);
    const qty = Math.min(this.qty(), rem);
    if (qty < 1) return;
    this.busy.set(true);
    this.addedOk.set(false);
    try {
      await this.data.upsertCart(memberId, g.id, qty);
      await this.data.refreshListedGroups();
      const refreshed = this.data.listedGroups().find((x) => x.id === g.id) ?? null;
      if (!refreshed) {
        await this.router.navigateByUrl('/member/shop');
        return;
      }
      this.group.set(refreshed);
      this.addedOk.set(true);
    } catch {
      // API errors shown by TelegramService
    } finally {
      this.busy.set(false);
    }
  }

  async addSelectedTeams() {
    const g = this.group();
    const memberId = this.auth.currentUser()?.id;
    const ids = [...this.selectedTeamIds()];
    if (!g || !memberId || ids.length === 0) return;
    this.busy.set(true);
    this.addedOk.set(false);
    try {
      for (const teamSlotId of ids) {
        await this.data.upsertCartTeam(memberId, teamSlotId, true);
      }
      await this.data.refreshTeamSlots(g.id);
      this.teamSlots.set(this.data.teamSlots());
      await this.data.refreshListedGroups();
      const refreshed = this.data.listedGroups().find((x) => x.id === g.id) ?? null;
      if (!refreshed) {
        await this.router.navigateByUrl('/member/shop');
        return;
      }
      this.group.set(refreshed);
      this.selectedTeamIds.set(new Set());
      this.addedOk.set(true);
    } catch {
      await this.data.refreshTeamSlots(g.id);
      this.teamSlots.set(this.data.teamSlots());
      const available = new Set(
        this.teamSlots()
          .filter((s) => s.status === 'available')
          .map((s) => s.id)
      );
      this.selectedTeamIds.update((prev) => new Set([...prev].filter((id) => available.has(id))));
    } finally {
      this.busy.set(false);
    }
  }
}
