import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Group, PriceTier, TeamSlot } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../services/translate.pipe';

function isTeamSale(type?: string): boolean {
  return type === 'bball_team' || type === 'baseball_team';
}

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
              <div class="badge badge-info">{{ typeLabel(g.type) | t }}</div>
              <div class="text-muted">
                {{ 'groups.remaining' | t }}：{{ remaining(g) }} / {{ g.totalStakes ?? 0 }}
              </div>

              @if (isTeamSale(g.type)) {
                <p class="hint-text mt-1">{{ 'shop.pickTeamHint' | t }}</p>
                <button type="button" class="btn btn-primary btn-sm mt-1" (click)="openTeams(g)">
                  {{ 'shop.pickTeam' | t }}
                </button>
              } @else {
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
                    (click)="addStake(g)"
                  >
                    {{ 'shop.addCart' | t }}
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }

    @if (teamGroup(); as tg) {
      <div class="modal-backdrop" (click)="closeTeams()">
        <div class="modal team-modal" (click)="$event.stopPropagation()">
          <h3>{{ tg.name }} · {{ 'shop.pickTeam' | t }}</h3>
          <p class="hint-text">{{ 'shop.pickTeamHint' | t }}</p>
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
                <div class="t-price">{{ s.price }} {{ 'common.yuan' | t }}</div>
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
          <div class="modal-actions mt-2">
            <button type="button" class="btn btn-outline" (click)="closeTeams()">{{ 'common.cancel' | t }}</button>
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="selectedTeamIds().size === 0 || adding() === 'teams'"
              (click)="addSelectedTeams()"
            >
              {{ 'shop.addCart' | t }}
              @if (selectedTeamIds().size > 0) {
                （{{ selectedTeamIds().size }}）
              }
            </button>
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
      .mt-1 {
        margin-top: 10px;
      }
      .mt-2 {
        margin-top: 12px;
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
      .team-modal {
        max-width: 720px;
        width: min(720px, 94vw);
      }
      .team-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 10px;
        max-height: 60vh;
        overflow: auto;
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
      .t-price {
        font-weight: 700;
        margin: 4px 0;
      }
      .t-action {
        font-size: 12px;
        font-weight: 700;
        color: var(--c-muted);
      }
      .team-cell.selected .t-action {
        color: var(--c-primary-dark);
      }
      .team-cell.sold .t-action {
        color: var(--c-muted);
      }
    `,
  ],
})
export class Shop implements OnInit {
  protected data = inject(DataService);
  private auth = inject(AuthService);
  private i18n = inject(I18nService);

  adding = signal<string | null>(null);
  teamGroup = signal<Group | null>(null);
  teamSlots = signal<TeamSlot[]>([]);
  selectedTeamIds = signal<Set<string>>(new Set());
  private qtyMap = signal<Record<string, number>>({});

  readonly isTeamSale = isTeamSale;

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

  async openTeams(g: Group) {
    this.teamGroup.set(g);
    this.selectedTeamIds.set(new Set());
    await this.data.refreshTeamSlots(g.id);
    this.teamSlots.set(this.data.teamSlots());
  }

  closeTeams() {
    this.teamGroup.set(null);
    this.teamSlots.set([]);
    this.selectedTeamIds.set(new Set());
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

  async addStake(g: Group) {
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
      // API 錯誤已跳窗
    } finally {
      this.adding.set(null);
    }
  }

  async addSelectedTeams() {
    const memberId = this.auth.currentUser()?.id;
    const group = this.teamGroup();
    const ids = [...this.selectedTeamIds()];
    if (!memberId || !group || ids.length === 0) return;
    this.adding.set('teams');
    try {
      for (const teamSlotId of ids) {
        await this.data.upsertCartTeam(memberId, teamSlotId, true);
      }
      await this.data.refreshTeamSlots(group.id);
      this.teamSlots.set(this.data.teamSlots());
      await this.data.refreshListedGroups();
      this.closeTeams();
    } catch {
      // API 錯誤已跳窗；保留已選，方便重試
      await this.data.refreshTeamSlots(group.id);
      this.teamSlots.set(this.data.teamSlots());
      const available = new Set(
        this.teamSlots()
          .filter((s) => s.status === 'available')
          .map((s) => s.id)
      );
      this.selectedTeamIds.update((prev) => new Set([...prev].filter((id) => available.has(id))));
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
