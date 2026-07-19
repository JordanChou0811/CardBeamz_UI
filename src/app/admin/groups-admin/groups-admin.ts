import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CloudinaryService, UploadedImage } from '../../services/cloudinary.service';
import { Group, GroupCard, PriceTier } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';
import { AlertService } from '../../services/alert.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-groups-admin',
  imports: [FormsModule, TranslatePipe],
  template: `
    <h2 class="mb">🎴 {{ 'groups.title' | t }}</h2>

    @if (managingGroup(); as mg) {
      <div class="cards-view">
        <div class="cards-head">
          <button type="button" class="btn btn-outline btn-sm" (click)="closeCards()">
            ← {{ 'groups.backToGroups' | t }}
          </button>
          <div>
            <div class="card-title" style="margin-bottom: 4px">
              {{ 'groups.cardsTitle' | t }} · {{ mg.name }}（{{ mg.code }}）
            </div>
            <p class="hint-text" style="margin: 0">{{ 'groups.cardsHint' | t }}</p>
          </div>
        </div>

        <div class="card">
          <div class="list-head">
            <div class="card-title" style="margin: 0">{{ 'groups.cardsTitle' | t }}</div>
            <button
              type="button"
              class="btn btn-primary btn-icon"
              [attr.data-tip]="'groups.addCard' | t"
              [attr.aria-label]="'groups.addCard' | t"
              (click)="openAddCard()"
            >
              +
            </button>
          </div>
          @if (data.groupCards().length === 0) {
            <div class="empty"><span class="emoji">🃏</span>{{ 'groups.cardsEmpty' | t }}</div>
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>{{ 'aitems.cardPhoto' | t }}</th>
                  <th>{{ 'aitems.card' | t }}</th>
                  <th>{{ 'groups.exchange' | t }}</th>
                  <th style="width:90px"></th>
                </tr>
              </thead>
              <tbody>
                @for (c of data.groupCards(); track c.id) {
                  <tr>
                    <td>
                      <div class="thumb" [style.background]="isColor(c.photo) ? c.photo : null">
                        @if (!isColor(c.photo) && c.photo) {
                          <img [src]="c.photo" alt="" />
                        }
                      </div>
                    </td>
                    <td>
                      @if (c.cardName || c.cardNo) {
                        {{ c.cardName }}
                        <span class="text-muted">{{ c.cardNo ? ' #' + c.cardNo : '' }}</span>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td><b class="val">{{ c.exchangeValue }} {{ 'common.yuan' | t }}</b></td>
                    <td class="actions">
                      <button
                        type="button"
                        class="btn btn-outline btn-icon"
                        [attr.data-tip]="'common.edit' | t"
                        [attr.aria-label]="'common.edit' | t"
                        (click)="editCard(c)"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        class="btn btn-danger btn-icon"
                        [attr.data-tip]="'common.delete' | t"
                        [attr.aria-label]="'common.delete' | t"
                        (click)="removeCard(c.id)"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    } @else {
      <div class="card">
        <div class="list-head">
          <div class="card-title" style="margin: 0">{{ 'groups.list' | t }}</div>
          <button
            type="button"
            class="btn btn-primary btn-icon"
            [attr.data-tip]="'groups.add' | t"
            [attr.aria-label]="'groups.add' | t"
            (click)="openAddGroup()"
          >
            +
          </button>
        </div>
        @if (data.groups().length === 0) {
          <div class="empty"><span class="emoji">🎴</span>{{ 'groups.empty' | t }}</div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'groups.photo' | t }}</th>
                <th>{{ 'groups.code' | t }}</th>
                <th>{{ 'groups.name' | t }}</th>
                <th>{{ 'groups.status' | t }}</th>
                <th>{{ 'groups.remaining' | t }}</th>
                <th style="width:160px"></th>
              </tr>
            </thead>
            <tbody>
              @for (g of data.groups(); track g.id) {
                <tr>
                  <td>
                    <div class="thumb" [style.background]="isColor(g.photo) ? g.photo : null">
                      @if (!isColor(g.photo) && g.photo) {
                        <img [src]="g.photo" alt="" />
                      } @else {
                        {{ g.code }}
                      }
                    </div>
                  </td>
                  <td><b>{{ g.code }}</b></td>
                  <td>{{ g.name }}</td>
                  <td>
                    <span
                      class="badge"
                      [class.badge-info]="g.status === 'draft'"
                      [class.badge-success]="g.status === 'listed'"
                      [class.badge-warning]="g.status === 'unlisted'"
                      >{{ statusLabel(g.status) | t }}</span
                    >
                  </td>
                  <td class="text-muted">
                    {{ g.remainingStakes ?? (g.totalStakes ?? 0) - (g.soldStakes ?? 0) }} /
                    {{ g.totalStakes ?? 0 }}
                  </td>
                  <td class="actions">
                    <button
                      type="button"
                      class="btn btn-primary btn-icon"
                      [attr.data-tip]="'groups.manageCards' | t"
                      [attr.aria-label]="'groups.manageCards' | t"
                      (click)="openCards(g)"
                    >
                      🃏
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline btn-icon"
                      [attr.data-tip]="'common.edit' | t"
                      [attr.aria-label]="'common.edit' | t"
                      (click)="edit(g)"
                    >
                      ✏️
                    </button>
                    @if (g.status === 'listed') {
                      <button
                        type="button"
                        class="btn btn-warning btn-icon"
                        [attr.data-tip]="'groups.unlist' | t"
                        [attr.aria-label]="'groups.unlist' | t"
                        (click)="askUnlist(g)"
                      >
                        ⬇️
                      </button>
                    } @else {
                      <button
                        type="button"
                        class="btn btn-success btn-icon"
                        [attr.data-tip]="'groups.publish' | t"
                        [attr.aria-label]="'groups.publish' | t"
                        (click)="askPublish(g)"
                      >
                        ⬆️
                      </button>
                    }
                    <button
                      type="button"
                      class="btn btn-danger btn-icon"
                      [attr.data-tip]="'common.delete' | t"
                      [attr.aria-label]="'common.delete' | t"
                      (click)="askDeleteGroup(g)"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    @if (cardFormOpen(); as formMg) {
      <div class="modal-backdrop" (click)="closeCardForm()">
        <div class="modal form-modal" (click)="$event.stopPropagation()">
          <h3>{{ (editingCardId() ? 'groups.editCard' : 'groups.addCard') | t }}</h3>

          <div class="form-grid-2">
            <div class="field">
              <label>{{ 'aitems.cardName' | t }}</label>
              <input
                type="text"
                [(ngModel)]="cardName"
                [placeholder]="'aitems.cardNamePlaceholder' | t"
                autocomplete="off"
              />
            </div>
            <div class="field">
              <label>{{ 'aitems.cardNo' | t }}</label>
              <input
                type="text"
                [(ngModel)]="cardNo"
                [placeholder]="'aitems.cardNoPlaceholder' | t"
                autocomplete="off"
              />
            </div>
          </div>

          <div class="field">
            <label>{{ 'groups.exchange' | t }}</label>
            <input type="number" min="0" [(ngModel)]="cardExchange" />
          </div>

          <div class="field">
            <label>{{ 'aitems.cardPhoto' | t }}</label>
            <div class="photo-row">
              <div
                class="thumb-lg"
                [style.background]="isColor(selectedCardPreview(formMg)) ? selectedCardPreview(formMg) : null"
              >
                @if (!isColor(selectedCardPreview(formMg)) && selectedCardPreview(formMg)) {
                  <img [src]="selectedCardPreview(formMg)" alt="preview" />
                }
              </div>
              <div class="photo-inputs">
                <p class="hint-text" style="margin: 0 0 8px">
                  {{ cardPhoto() ? ('aitems.cardPhoto' | t) : ('aitems.useGroupPhoto' | t) }}
                </p>
                <button type="button" class="btn btn-outline btn-sm" (click)="openCardPhotoPicker()">
                  🖼️ {{ 'groups.pickCardPhoto' | t }}
                </button>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="closeCardForm()">{{ 'common.cancel' | t }}</button>
            <button type="button" class="btn btn-primary" (click)="saveCard()">
              {{ (editingCardId() ? 'common.save' : 'groups.addCard') | t }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (groupFormOpen()) {
      <div class="modal-backdrop" (click)="closeGroupForm()">
        <div class="modal form-modal" (click)="$event.stopPropagation()">
          <h3>{{ (editingId() ? 'groups.edit' : 'groups.add') | t }}</h3>

          <div class="form-grid-2">
            <div class="field">
              <label>{{ 'groups.code' | t }}</label>
              <input type="text" [(ngModel)]="code" [placeholder]="'groups.codePlaceholder' | t" autocomplete="off" />
            </div>
            <div class="field">
              <label>{{ 'groups.name' | t }}</label>
              <input type="text" [(ngModel)]="name" [placeholder]="'groups.namePlaceholder' | t" autocomplete="off" />
            </div>
          </div>

          <div class="field">
            <label>{{ 'groups.photo' | t }}</label>
            <div class="photo-row">
              <div class="thumb-lg" [style.background]="isColor(photo) ? photo : null">
                @if (!isColor(photo) && photo) {
                  <img [src]="photo" alt="preview" />
                }
              </div>
              <div class="photo-inputs">
                <input type="text" [(ngModel)]="photo" [placeholder]="'groups.photoUrl' | t" autocomplete="off" />
                <button type="button" class="btn btn-outline btn-sm mt-1" (click)="openPicker()">
                  🖼️ {{ 'groups.pickPhoto' | t }}
                </button>
              </div>
            </div>
          </div>

          <div class="sale-block">
            <div class="card-title" style="margin-bottom: 8px">{{ 'groups.saleSection' | t }}</div>
            <p class="hint-text">{{ 'groups.saleHint' | t }}</p>
            <div class="field">
              <label>{{ 'groups.type' | t }}</label>
              <select [(ngModel)]="saleType" [disabled]="formListed()">
                <option value="stake_sale">{{ 'groups.type.stake_sale' | t }}</option>
              </select>
            </div>
            <div class="form-grid-2">
              <div class="field">
                <label>{{ 'groups.totalStakes' | t }}</label>
                <input type="number" min="0" [(ngModel)]="totalStakes" [disabled]="formListed()" />
              </div>
              <div class="field">
                <label>{{ 'groups.basePrice' | t }}</label>
                <input type="number" min="0" [(ngModel)]="basePrice" [disabled]="formListed()" />
              </div>
            </div>
            <div class="field">
              <label>{{ 'groups.priceTiers' | t }}</label>
              @for (t of priceTiers; track $index) {
                <div class="tier-row">
                  <input
                    type="number"
                    min="2"
                    [(ngModel)]="t.minQty"
                    [disabled]="formListed()"
                    [placeholder]="'groups.tierMin' | t"
                  />
                  <input
                    type="number"
                    min="0"
                    [(ngModel)]="t.unitPrice"
                    [disabled]="formListed()"
                    [placeholder]="'groups.tierPrice' | t"
                  />
                  @if (!formListed()) {
                    <button type="button" class="btn btn-danger btn-icon" (click)="removeTier($index)">🗑️</button>
                  }
                </div>
              }
              @if (!formListed()) {
                <button type="button" class="btn btn-outline btn-sm" (click)="addTier()">
                  + {{ 'groups.addTier' | t }}
                </button>
              }
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="closeGroupForm()">{{ 'common.cancel' | t }}</button>
            <button type="button" class="btn btn-primary" (click)="save()">
              {{ (editingId() ? 'common.save' : 'groups.add') | t }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (picker()) {
      <div class="modal-backdrop" (click)="picker.set(false)">
        <div class="modal picker" (click)="$event.stopPropagation()">
          <h3>{{ 'groups.selectImage' | t }}</h3>
          @if (cloud.gallery().length === 0) {
            <div class="empty"><span class="emoji">🗂️</span>{{ 'groups.noUploads' | t }}</div>
          } @else {
            <div class="pick-grid">
              @for (img of cloud.gallery(); track img.publicId) {
                <button type="button" class="pick" (click)="choose(img.url)">
                  <img [src]="img.url" [alt]="img.name" />
                </button>
              }
            </div>
          }
          <div class="modal-actions mt-2">
            <button class="btn btn-outline" (click)="picker.set(false)">{{ 'common.cancel' | t }}</button>
          </div>
        </div>
      </div>
    }

    @if (cardPhotoPicker(); as mgPick) {
      <div class="modal-backdrop" (click)="closeCardPhotoPicker()">
        <div class="modal picker card-photo-modal" (click)="$event.stopPropagation()">
          <h3>{{ 'groups.pickCardPhotoTitle' | t }}</h3>
          <p class="hint-text">📁 cardbeamz/groups/{{ mgPick.code }}</p>

          @if (folderLoading()) {
            <div class="empty"><span class="emoji">⏳</span>{{ 'groups.loadingImages' | t }}</div>
          } @else {
            <div class="pick-grid">
              <button
                type="button"
                class="pick def"
                [class.active]="cardPhoto() === ''"
                [style.background]="isColor(mgPick.photo) ? mgPick.photo : null"
                (click)="chooseCardPhoto('')"
              >
                @if (!isColor(mgPick.photo) && mgPick.photo) {
                  <img [src]="mgPick.photo" alt="" />
                }
                <span class="pick-label">{{ 'aitems.useGroupPhoto' | t }}</span>
              </button>
              @for (img of folderImages(); track img.publicId) {
                <button
                  type="button"
                  class="pick"
                  [class.active]="cardPhoto() === img.url"
                  (click)="chooseCardPhoto(img.url)"
                >
                  <img [src]="img.url" [alt]="img.name" />
                </button>
              }
            </div>
            @if (folderImages().length === 0) {
              <div class="empty"><span class="emoji">🗂️</span>{{ 'groups.folderEmpty' | t }}</div>
            }
            @if (folderNextCursor()) {
              <div class="modal-actions mt-2">
                <button
                  type="button"
                  class="btn btn-outline"
                  [disabled]="folderLoading()"
                  (click)="loadMoreFolderImages()"
                >
                  {{ 'groups.loadMoreImages' | t }}
                </button>
              </div>
            }
          }

          <div class="modal-actions mt-2">
            <button class="btn btn-outline" (click)="closeCardPhotoPicker()">{{ 'common.cancel' | t }}</button>
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
      .list-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }
      .grid {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 20px;
        align-items: start;
      }
      .cards-head {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 16px;
      }
      .photo-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      .photo-inputs {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .photo-inputs .btn {
        align-self: flex-start;
      }
      .thumb-lg {
        width: 72px;
        height: 72px;
        border-radius: 12px;
        flex: 0 0 auto;
        overflow: hidden;
        border: 1px solid var(--c-border);
        background: var(--c-surface-2);
      }
      .thumb-lg img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
      }
      .val {
        color: var(--c-primary);
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }
      .btn-icon {
        width: 34px;
        height: 34px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        line-height: 1;
        flex: 0 0 auto;
      }
      .list-head .btn-icon {
        font-size: 22px;
        font-weight: 500;
      }
      .sale-block {
        margin-top: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--c-border);
      }
      .tier-row {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 8px;
        margin-bottom: 8px;
      }
      .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 12px;
      }
      .picker {
        max-width: 560px;
      }
      .card-photo-modal {
        max-width: 640px;
      }
      .pick-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 10px;
        max-height: 420px;
        overflow: auto;
        margin-top: 8px;
      }
      .pick {
        position: relative;
        border: 2px solid var(--c-border);
        border-radius: 10px;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        background: var(--c-surface-2);
        transition: border-color 0.12s ease, transform 0.12s ease;
      }
      .pick:hover {
        border-color: var(--c-primary);
        transform: translateY(-2px);
      }
      .pick.active {
        border-color: var(--c-primary);
      }
      .pick img {
        width: 100%;
        height: 90px;
        object-fit: cover;
        display: block;
      }
      .pick .pick-label {
        position: absolute;
        inset: auto 0 0 0;
        font-size: 11px;
        line-height: 1.3;
        padding: 3px;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
      }
      @media (max-width: 820px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class GroupsAdmin {
  protected data = inject(DataService);
  protected cloud = inject(CloudinaryService);
  private confirm = inject(ConfirmService);
  private alert = inject(AlertService);

  code = '';
  name = '';
  photo = '#6366f1';
  saleType = 'stake_sale';
  totalStakes = 0;
  basePrice = 0;
  priceTiers: PriceTier[] = [];
  formListed = signal(false);

  editingId = signal<string | null>(null);
  groupFormOpen = signal(false);
  picker = signal(false);

  managingGroup = signal<Group | null>(null);
  /** 開啟時帶入目前管理的團，供表單預覽用 */
  cardFormOpen = signal<Group | null>(null);
  editingCardId = signal<string | null>(null);
  cardName = '';
  cardNo = '';
  cardExchange = 0;
  cardPhoto = signal('');

  /** 開啟卡片圖跳窗時帶入的團 */
  cardPhotoPicker = signal<Group | null>(null);
  folderImages = signal<UploadedImage[]>([]);
  folderNextCursor = signal<string | undefined>(undefined);
  folderLoading = signal(false);

  constructor() {
    void this.data.refreshGroups();
  }

  selectedCardPreview(g: Group): string {
    return this.cardPhoto() || g.photo;
  }

  isColor(value: string): boolean {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value?.trim() ?? '');
  }

  openPicker() {
    this.picker.set(true);
  }

  choose(url: string) {
    this.photo = url;
    this.picker.set(false);
  }

  statusLabel(status?: string): string {
    if (status === 'listed') return 'groups.status.listed';
    if (status === 'unlisted') return 'groups.status.unlisted';
    return 'groups.status.draft';
  }

  openAddGroup() {
    this.resetForm();
    this.groupFormOpen.set(true);
  }

  closeGroupForm() {
    this.groupFormOpen.set(false);
    this.resetForm();
  }

  addTier() {
    this.priceTiers = [...this.priceTiers, { minQty: 5, unitPrice: this.basePrice || 0 }];
  }

  removeTier(index: number) {
    this.priceTiers = this.priceTiers.filter((_, i) => i !== index);
  }

  async save() {
    if (!this.code.trim() || !this.name.trim()) {
      await this.alert.error('groups.errRequired');
      return;
    }
    const payload = {
      code: this.code.trim(),
      name: this.name.trim(),
      photo: this.photo.trim() || '#6366f1',
    };
    try {
      const id = this.editingId();
      if (id) {
        await this.data.updateGroup(id, payload);
        if (!this.formListed()) {
          await this.data.updateGroupSale(id, {
            type: this.saleType,
            totalStakes: Number(this.totalStakes) || 0,
            basePrice: Number(this.basePrice) || 0,
            priceTiers: this.priceTiers
              .filter((t) => t.minQty >= 2)
              .map((t) => ({ minQty: Number(t.minQty) || 0, unitPrice: Number(t.unitPrice) || 0 })),
          });
        }
      } else {
        await this.data.addGroup(payload);
        const created = this.data.groups().find((g) => g.code === payload.code);
        if (created) {
          await this.data.updateGroupSale(created.id, {
            type: this.saleType,
            totalStakes: Number(this.totalStakes) || 0,
            basePrice: Number(this.basePrice) || 0,
            priceTiers: this.priceTiers
              .filter((t) => t.minQty >= 2)
              .map((t) => ({ minQty: Number(t.minQty) || 0, unitPrice: Number(t.unitPrice) || 0 })),
          });
        }
      }
      this.closeGroupForm();
    } catch {
      // API 錯誤已由 TelegramService 跳窗
    }
  }

  edit(g: Group) {
    this.editingId.set(g.id);
    this.code = g.code;
    this.name = g.name;
    this.photo = g.photo;
    this.saleType = g.type || 'stake_sale';
    this.totalStakes = g.totalStakes ?? 0;
    this.basePrice = g.basePrice ?? 0;
    this.priceTiers = (g.priceTiers ?? []).map((t) => ({ ...t }));
    this.formListed.set(g.status === 'listed');
    this.groupFormOpen.set(true);
  }

  resetForm() {
    this.editingId.set(null);
    this.code = '';
    this.name = '';
    this.photo = '#6366f1';
    this.saleType = 'stake_sale';
    this.totalStakes = 0;
    this.basePrice = 0;
    this.priceTiers = [];
    this.formListed.set(false);
  }

  async askPublish(g: Group) {
    const ok = await this.confirm.ask({
      title: 'confirm.publishGroup',
      message: `${g.name}（${g.code}）`,
      confirmKey: 'groups.publish',
      confirmTone: 'primary',
    });
    if (!ok) return;
    try {
      await this.data.publishGroup(g.id);
    } catch {
      // API 錯誤已由 TelegramService 跳窗
    }
  }

  async askUnlist(g: Group) {
    const ok = await this.confirm.ask({
      title: 'confirm.unlistGroup',
      message: `${g.name}（${g.code}）`,
      confirmKey: 'groups.unlist',
    });
    if (!ok) return;
    try {
      await this.data.unlistGroup(g.id);
    } catch {
      // API 錯誤已由 TelegramService 跳窗
    }
  }

  async openCards(g: Group) {
    this.managingGroup.set(g);
    this.resetCardForm();
    await this.data.refreshGroupCards(g.id);
  }

  closeCards() {
    this.managingGroup.set(null);
    this.closeCardForm();
    this.closeCardPhotoPicker();
    this.data.groupCards.set([]);
  }

  openAddCard() {
    const g = this.managingGroup();
    if (!g) return;
    this.resetCardForm();
    this.cardFormOpen.set(g);
  }

  closeCardForm() {
    this.cardFormOpen.set(null);
    this.resetCardForm();
  }

  async openCardPhotoPicker() {
    const g = this.managingGroup();
    if (!g) return;
    this.cardPhotoPicker.set(g);
    this.folderImages.set([]);
    this.folderNextCursor.set(undefined);
    await this.fetchFolderImages(g.code);
  }

  closeCardPhotoPicker() {
    this.cardPhotoPicker.set(null);
    this.folderLoading.set(false);
  }

  chooseCardPhoto(url: string) {
    this.cardPhoto.set(url);
    this.closeCardPhotoPicker();
  }

  async loadMoreFolderImages() {
    const g = this.cardPhotoPicker();
    const cursor = this.folderNextCursor();
    if (!g || !cursor) return;
    await this.fetchFolderImages(g.code, cursor, true);
  }

  private async fetchFolderImages(groupCode: string, nextCursor?: string, append = false) {
    this.folderLoading.set(true);
    try {
      const res = await this.cloud.listGroupFolder(groupCode, nextCursor);
      this.folderImages.set(append ? [...this.folderImages(), ...res.images] : res.images);
      this.folderNextCursor.set(res.nextCursor);
    } catch {
      if (!append) this.folderImages.set([]);
      // API 錯誤已由 TelegramService 跳窗
    } finally {
      this.folderLoading.set(false);
    }
  }

  editCard(c: GroupCard) {
    const g = this.managingGroup();
    if (!g) return;
    this.editingCardId.set(c.id);
    this.cardName = c.cardName ?? '';
    this.cardNo = c.cardNo ?? '';
    this.cardExchange = c.exchangeValue;
    this.cardPhoto.set(c.photo === g.photo ? '' : c.photo);
    this.cardFormOpen.set(g);
  }

  resetCardForm() {
    this.editingCardId.set(null);
    this.cardName = '';
    this.cardNo = '';
    this.cardExchange = 0;
    this.cardPhoto.set('');
  }

  async saveCard() {
    const g = this.managingGroup();
    if (!g) return;
    if (!this.cardName.trim() && !this.cardNo.trim()) {
      await this.alert.error('groups.cardErrRequired');
      return;
    }
    const payload = {
      cardName: this.cardName.trim(),
      cardNo: this.cardNo.trim(),
      photo: this.cardPhoto() || g.photo,
      exchangeValue: Number(this.cardExchange) || 0,
    };
    const id = this.editingCardId();
    if (id) {
      await this.data.updateGroupCard(id, g.id, payload);
    } else {
      await this.data.addGroupCard(g.id, payload);
    }
    this.closeCardForm();
  }

  async askDeleteGroup(g: Group) {
    const ok = await this.confirm.ask({
      title: 'confirm.deleteGroup',
      message: `${g.name}（${g.code}）`,
    });
    if (!ok) return;
    await this.data.deleteGroup(g.id);
  }

  async removeCard(id: string) {
    const g = this.managingGroup();
    if (!g) return;
    const card = this.data.groupCards().find((c) => c.id === id);
    const label = [card?.cardName, card?.cardNo ? `#${card.cardNo}` : ''].filter(Boolean).join(' ') || id;
    const ok = await this.confirm.ask({
      title: 'confirm.deleteGroupCard',
      message: label,
    });
    if (!ok) return;
    await this.data.deleteGroupCard(id, g.id);
    if (this.editingCardId() === id) this.closeCardForm();
  }
}
