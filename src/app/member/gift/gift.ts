import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { GiftTransaction } from '../../models/models';

@Component({
  selector: 'app-gift',
  imports: [FormsModule, TranslatePipe],
  template: `
    <h2 class="mb">{{ 'gift.title' | t }}</h2>
    <p class="text-muted mb">{{ 'gift.intro' | t }}</p>

    <div class="tabs mb">
      <button class="tab" [class.active]="mode() === 'card'" (click)="mode.set('card')">
        🎴 {{ 'gift.card' | t }}
      </button>
      <button class="tab" [class.active]="mode() === 'credit'" (click)="mode.set('credit')">
        💰 {{ 'gift.credit' | t }}
      </button>
      <button class="tab" [class.active]="mode() === 'received'" (click)="mode.set('received')">
        ✅ {{ 'gift.reply' | t }}
      </button>
    </div>

    @if (mode() !== 'received') {
      <div class="card form-card">
        <label>
          {{ 'gift.recipientPhone' | t }}
          <input [(ngModel)]="recipientAccount" inputmode="numeric" maxlength="10" placeholder="09xxxxxxxx" />
        </label>

        @if (mode() === 'card') {
          <label>
            {{ 'gift.selectCard' | t }}
            <select [(ngModel)]="selectedItemId">
              <option value="">{{ 'gift.selectCardPlaceholder' | t }}</option>
              @for (item of items(); track item.id) {
                <option [value]="item.id">{{ item.cbz }} @if (item.cardName) { · {{ item.cardName }} } @if (item.cardNo) { · {{ item.cardNo }} }</option>
              }
            </select>
          </label>
          @if (items().length === 0) {
            <p class="text-muted">{{ 'gift.noCards' | t }}</p>
          }
        } @else {
          <label>
            {{ 'gift.amount' | t }}
            <input [(ngModel)]="amount" type="number" min="1" step="1" />
          </label>
          <p class="text-muted">{{ 'gift.balanceHint' | t }}：{{ auth.currentUser()?.credit ?? 0 }} {{ 'common.yuan' | t }}</p>
        }

        @if (message()) {
          <p class="result" [class.error]="isError()">{{ message() }}</p>
        }

        <button class="btn btn-primary" [disabled]="submitting()" (click)="submit()">
          {{ submitting() ? ('gift.processing' | t) : ('gift.submit' | t) }}
        </button>
      </div>
    } @else {
      <section class="received">
        <h3>{{ 'gift.receivedTitle' | t }}</h3>
        @if (pendingGifts().length === 0) {
          <p class="text-muted">{{ 'gift.noReceived' | t }}</p>
        } @else {
          @for (gift of pendingGifts(); track gift.id) {
            <div class="card received-row">
              <div>
                <strong>{{ senderName(gift.senderMemberId) }}</strong>
                @if (gift.type === 'card') {
                  <div>{{ 'gift.offeredCard' | t }}</div>
                  <small class="text-muted">{{ cardDescription(gift) }}</small>
                } @else {
                  {{ giftDescription(gift) }}
                }
              </div>
              <div class="actions">
                <button class="btn btn-primary" [disabled]="submitting()" (click)="accept(gift.id)">
                  {{ 'gift.accept' | t }}
                </button>
                <button class="btn btn-outline" [disabled]="submitting()" (click)="reject(gift.id)">
                  {{ 'gift.reject' | t }}
                </button>
              </div>
            </div>
          }
        }
      </section>
    }
  `,
  styles: [
    `
      .mb { margin-bottom: 18px; }
      .tabs { display: flex; gap: 8px; }
      .tab { border: 1px solid var(--c-border); background: var(--c-surface); border-radius: var(--radius-sm); padding: 10px 14px; cursor: pointer; color: var(--c-muted); font-weight: 700; }
      .tab.active { background: var(--c-primary-light); border-color: var(--c-primary); color: var(--c-primary-dark); }
      .form-card { max-width: 560px; display: grid; gap: 16px; }
      label { display: grid; gap: 7px; font-weight: 700; }
      input, select { width: 100%; padding: 10px 12px; border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-surface); color: var(--c-text); font: inherit; }
      .result { margin: 0; color: #15803d; font-weight: 600; }
      .result.error { color: #dc2626; }
      .received { max-width: 560px; }
      .received h3 { margin-bottom: 12px; }
      .received-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
      .actions { display: flex; gap: 8px; }
    `,
  ],
})
export class Gift implements OnInit {
  protected auth = inject(AuthService);
  private data = inject(DataService);
  private i18n = inject(I18nService);

  mode = signal<'card' | 'credit' | 'received'>('card');
  recipientAccount = '';
  selectedItemId = '';
  amount: number | null = null;
  submitting = signal(false);
  message = signal('');
  isError = signal(false);

  items = computed(() => {
    const memberId = this.auth.currentUser()?.id;
    return memberId ? this.data.warehouseItems(memberId) : [];
  });
  pendingGifts = computed(() => this.data.receivedGifts().filter((gift) => gift.status === 'pending'));

  ngOnInit(): void {
    const memberId = this.auth.currentUser()?.id;
    if (memberId) void this.data.refreshReceivedGifts(memberId);
  }

  async submit(): Promise<void> {
    const senderMemberId = this.auth.currentUser()?.id;
    const recipientAccount = this.recipientAccount.trim();
    this.message.set('');
    if (!senderMemberId || !/^09\d{8}$/.test(recipientAccount)) {
      this.fail(this.i18n.t('gift.errPhone'));
      return;
    }
    if (this.mode() === 'card' && !this.selectedItemId) {
      this.fail(this.i18n.t('gift.errCard'));
      return;
    }
    if (this.mode() === 'credit' && (!Number.isInteger(this.amount) || (this.amount ?? 0) <= 0)) {
      this.fail(this.i18n.t('gift.errAmount'));
      return;
    }

    this.submitting.set(true);
    try {
      if (this.mode() === 'card') {
        await this.data.giftCard(senderMemberId, recipientAccount, this.selectedItemId);
        this.selectedItemId = '';
      } else {
        await this.data.giftCredit(senderMemberId, recipientAccount, this.amount!);
        this.amount = null;
      }
      this.recipientAccount = '';
      this.isError.set(false);
      this.message.set(this.i18n.t('gift.success'));
    } catch (error) {
      this.fail(error instanceof Error ? error.message : this.i18n.t('gift.errFailed'));
    } finally {
      this.submitting.set(false);
    }
  }

  private fail(message: string): void {
    this.isError.set(true);
    this.message.set(message);
  }

  senderName(memberId: string): string {
    return this.data.findMember(memberId)?.name ?? memberId;
  }

  giftDescription(gift: GiftTransaction): string {
    return this.i18n.t('gift.offeredCredit').replace('{{amount}}', String(gift.creditAmount ?? 0));
  }

  cardDescription(gift: GiftTransaction): string {
    const item = this.data.items().find((candidate) => candidate.id === gift.warehouseItemId);
    if (!item) return gift.warehouseItemId ?? '';
    return [item.cbz, item.cardName, item.cardNo].filter(Boolean).join(' · ');
  }

  async accept(giftId: string): Promise<void> {
    const memberId = this.auth.currentUser()?.id;
    if (!memberId) return;
    this.submitting.set(true);
    try {
      await this.data.acceptGift(memberId, giftId);
    } finally {
      this.submitting.set(false);
    }
  }

  async reject(giftId: string): Promise<void> {
    const memberId = this.auth.currentUser()?.id;
    if (!memberId) return;
    this.submitting.set(true);
    try {
      await this.data.rejectGift(memberId, giftId);
    } finally {
      this.submitting.set(false);
    }
  }
}
