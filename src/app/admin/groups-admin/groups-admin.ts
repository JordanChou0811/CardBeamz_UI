import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CloudinaryService, UploadedImage } from '../../services/cloudinary.service';
import { Group, GroupCard, GroupType, PriceTier, TeamSlot } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';
import { AlertService } from '../../services/alert.service';
import { ConfirmService } from '../../services/confirm.service';

function isTeamSale(type?: string): boolean {
  return type === 'bball_team' || type === 'baseball_team';
}

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
            <p class="hint-text" style="margin: 0">
              {{ (isTeamSale(mg.type) ? 'groups.cardsHintTeam' : 'groups.cardsHint') | t }}
            </p>
          </div>
        </div>

        @if (isTeamSale(mg.type)) {
          <div class="card team-price-card">
            <div class="list-head">
              <div class="card-title" style="margin: 0">{{ 'groups.teamPrices' | t }}</div>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                [disabled]="savingTeamPrices()"
                (click)="saveTeamPrices()"
              >
                {{ 'groups.saveTeamPrices' | t }}
              </button>
            </div>
            <p class="hint-text">{{ 'groups.teamPricesCatalogHint' | t }}</p>
            <div class="team-price-toolbar">
              <input
                type="number"
                min="0"
                [(ngModel)]="bulkTeamPrice"
                name="bulkTeamPrice"
                [placeholder]="'groups.bulkTeamPrice' | t"
              />
              <button type="button" class="btn btn-outline btn-sm" (click)="applyBulkTeamPrice()">
                {{ 'groups.applyBulkTeamPrice' | t }}
              </button>
            </div>
            @if (editTeamSlots().length === 0) {
              <div class="empty"><span class="emoji">🏀</span>{{ 'groups.teamPricesPending' | t }}</div>
            } @else {
              <div class="team-price-tables">
                @for (col of teamSlotColumns(); track $index) {
                  <table class="table team-price-table">
                    <thead>
                      <tr>
                        <th class="col-code">{{ 'groups.colTeamCode' | t }}</th>
                        <th>{{ 'groups.colTeamName' | t }}</th>
                        <th class="col-price">{{ 'groups.colTeamPrice' | t }}</th>
                        <th class="col-status"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (s of col; track s.id) {
                        <tr [class.is-sold]="s.status === 'sold'">
                          <td class="col-code">{{ s.teamCode }}</td>
                          <td>{{ s.teamName }}</td>
                          <td class="col-price">
                            <input
                              type="number"
                              min="0"
                              [(ngModel)]="s.price"
                              [name]="'tp_' + s.id"
                              aria-label="price"
                            />
                          </td>
                          <td class="col-status">
                            @if (s.status === 'sold') {
                              <span class="badge badge-warning">{{ 'groups.teamSold' | t }}</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            }
          </div>
        }

        <div class="card">
          <div class="list-head">
            <div class="card-title" style="margin: 0">{{ 'groups.cardsTitle' | t }}</div>
            @if (!isTeamSale(mg.type)) {
              <button
                type="button"
                class="btn btn-primary btn-icon"
                [attr.data-tip]="'groups.addCard' | t"
                [attr.aria-label]="'groups.addCard' | t"
                (click)="openAddCard()"
              >
                +
              </button>
            }
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
                      @if (!isTeamSale(mg.type)) {
                        <button
                          type="button"
                          class="btn btn-danger btn-icon"
                          [attr.data-tip]="'common.delete' | t"
                          [attr.aria-label]="'common.delete' | t"
                          (click)="removeCard(c.id)"
                        >
                          🗑️
                        </button>
                      }
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
                [readonly]="!!formMg && isTeamSale(formMg.type)"
              />
            </div>
            <div class="field">
              <label>{{ 'aitems.cardNo' | t }}</label>
              <input
                type="text"
                [(ngModel)]="cardNo"
                [placeholder]="'aitems.cardNoPlaceholder' | t"
                autocomplete="off"
                [readonly]="!!formMg && isTeamSale(formMg.type)"
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
              <select [(ngModel)]="saleType" [disabled]="formListed()" (ngModelChange)="onSaleTypeChange($event)">
                <option value="stake_sale">{{ 'groups.type.stake_sale' | t }}</option>
                <option value="bball_team">{{ 'groups.type.bball_team' | t }}</option>
                <option value="baseball_team">{{ 'groups.type.baseball_team' | t }}</option>
              </select>
            </div>
            @if (isTeamType()) {
              <p class="hint-text">{{ 'groups.teamPricesHint' | t }}</p>
            } @else {
              <div class="form-grid-2">
                <div class="field">
                  <label>{{ 'groups.totalStakes' | t }}</label>
                  <input type="number" min="0" [(ngModel)]="totalStakes" [disabled]="formListed()" />
                </div>
                <div class="field">
                  <label>{{ 'groups.basePrice' | t }}</label>
                  <input type="number" min="0" [(ngModel)]="basePrice" />
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
                      [placeholder]="'groups.tierMin' | t"
                    />
                    <input
                      type="number"
                      min="0"
                      [(ngModel)]="t.unitPrice"
                      [placeholder]="'groups.tierPrice' | t"
                    />
                    <button type="button" class="btn btn-danger btn-icon" (click)="removeTier($index)">🗑️</button>
                  </div>
                }
                <button type="button" class="btn btn-outline btn-sm" (click)="addTier()">
                  + {{ 'groups.addTier' | t }}
                </button>
              </div>
            }
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
      .team-price-card {
        margin-bottom: 16px;
      }
      .team-price-toolbar {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 12px;
      }
      .team-price-toolbar input {
        width: 140px;
      }
      .team-price-tables {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 28px;
        align-items: start;
      }
      .team-price-table {
        margin: 0;
      }
      .team-price-table th,
      .team-price-table td {
        padding: 8px 10px;
        vertical-align: middle;
      }
      .team-price-table .col-code {
        width: 64px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .team-price-table .col-price {
        width: 110px;
      }
      .team-price-table .col-price input {
        width: 100%;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .team-price-table .col-status {
        width: 56px;
        padding-left: 0;
      }
      .team-price-table tr.is-sold td {
        color: var(--c-muted);
      }
      .team-price-table tr.is-sold .col-code {
        color: var(--c-muted);
      }
      @media (max-width: 900px) {
        .team-price-tables {
          grid-template-columns: 1fr;
        }
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
  readonly isTeamSale = isTeamSale;

  code = '';
  name = '';
  photo = '#6366f1';
  saleType: GroupType = 'stake_sale';
  totalStakes = 0;
  basePrice = 0;
  priceTiers: PriceTier[] = [];
  editTeamSlots = signal<TeamSlot[]>([]);
  bulkTeamPrice: number | null = null;
  savingTeamPrices = signal(false);
  formListed = signal(false);
  /** 開啟編輯時的價格快照（用來判斷上架中是否降價） */
  private originalBasePrice = 0;
  private originalTiersJson = '[]';
  private originalTeamPricesJson = '[]';

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

  isTeamType(): boolean {
    return isTeamSale(this.saleType);
  }

  applyBulkTeamPrice() {
    const price = Number(this.bulkTeamPrice);
    if (!Number.isFinite(price) || price < 0) return;
    this.editTeamSlots.update((slots) => slots.map((s) => ({ ...s, price })));
  }

  /** 雙欄表格：左半／右半球隊 */
  teamSlotColumns(): TeamSlot[][] {
    const slots = this.editTeamSlots();
    const mid = Math.ceil(slots.length / 2);
    return [slots.slice(0, mid), slots.slice(mid)];
  }

  private normalizedTiers(): PriceTier[] {
    return this.priceTiers
      .filter((t) => t.minQty >= 2)
      .map((t) => ({ minQty: Number(t.minQty) || 0, unitPrice: Number(t.unitPrice) || 0 }));
  }

  private teamPricesPayload() {
    return this.editTeamSlots().map((s) => ({
      teamCode: s.teamCode,
      price: Number(s.price) || 0,
    }));
  }

  private loadTeamSlotsForCatalog(groupId: string, listed: boolean) {
    return this.data.refreshTeamSlots(groupId).then(() => {
      const slots = this.data.teamSlots().map((s) => ({ ...s }));
      this.editTeamSlots.set(slots);
      this.originalTeamPricesJson = JSON.stringify(
        slots.map((s) => ({ teamCode: s.teamCode, price: Number(s.price) || 0 }))
      );
      this.formListed.set(listed);
    });
  }

  private priceChangedFromOriginal(): boolean {
    const base = Number(this.basePrice) || 0;
    const tiersJson = JSON.stringify(this.normalizedTiers());
    return base !== this.originalBasePrice || tiersJson !== this.originalTiersJson;
  }

  private teamPricesChangedFromOriginal(): boolean {
    return JSON.stringify(this.teamPricesPayload()) !== this.originalTeamPricesJson;
  }

  async onSaleTypeChange(_type: string) {
    // 新建時無槽位；編輯時切換玩法會在儲存後重建
  }

  async saveTeamPrices() {
    const g = this.managingGroup();
    if (!g || !isTeamSale(g.type) || this.editTeamSlots().length === 0) return;
    if (g.status === 'listed' && this.teamPricesChangedFromOriginal()) {
      const ok = await this.confirm.ask({
        title: 'confirm.dropPrice',
        confirmKey: 'common.save',
        confirmTone: 'primary',
      });
      if (!ok) return;
    }
    this.savingTeamPrices.set(true);
    try {
      await this.data.updateTeamPrices(g.id, this.teamPricesPayload());
      await this.loadTeamSlotsForCatalog(g.id, g.status === 'listed');
      const refreshed = this.data.groups().find((x) => x.id === g.id);
      if (refreshed) this.managingGroup.set(refreshed);
    } catch {
      // API 錯誤已由 TelegramService 跳窗
    } finally {
      this.savingTeamPrices.set(false);
    }
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
      type: this.saleType,
    };
    const salePayload = {
      type: this.saleType,
      totalStakes: Number(this.totalStakes) || 0,
      basePrice: Number(this.basePrice) || 0,
      priceTiers: this.normalizedTiers(),
    };
    try {
      const id = this.editingId();
      if (id) {
        if (this.formListed() && !this.isTeamType() && this.priceChangedFromOriginal()) {
          const ok = await this.confirm.ask({
            title: 'confirm.dropPrice',
            confirmKey: 'common.save',
            confirmTone: 'primary',
          });
          if (!ok) return;
        }
        await this.data.updateGroup(id, payload);
        await this.data.updateGroupSale(
          id,
          this.formListed() && !this.isTeamType()
            ? { basePrice: salePayload.basePrice, priceTiers: salePayload.priceTiers }
            : salePayload
        );
      } else {
        await this.data.addGroup(payload);
        const created = this.data.groups().find((g) => g.code === payload.code);
        if (created) {
          await this.data.updateGroupSale(created.id, salePayload);
        }
      }
      this.closeGroupForm();
    } catch {
      // API 錯誤已由 TelegramService 跳窗
    }
  }

  async edit(g: Group) {
    this.editingId.set(g.id);
    this.code = g.code;
    this.name = g.name;
    this.photo = g.photo;
    this.saleType = (g.type as GroupType) || 'stake_sale';
    this.totalStakes = g.totalStakes ?? 0;
    this.basePrice = g.basePrice ?? 0;
    this.priceTiers = (g.priceTiers ?? []).map((t) => ({ ...t }));
    this.originalBasePrice = this.basePrice;
    this.originalTiersJson = JSON.stringify(this.normalizedTiers());
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
    this.originalBasePrice = 0;
    this.originalTiersJson = '[]';
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
    this.bulkTeamPrice = null;
    this.editTeamSlots.set([]);
    this.originalTeamPricesJson = '[]';
    await this.data.refreshGroupCards(g.id);
    if (isTeamSale(g.type)) {
      await this.loadTeamSlotsForCatalog(g.id, g.status === 'listed');
    }
  }

  closeCards() {
    this.managingGroup.set(null);
    this.closeCardForm();
    this.closeCardPhotoPicker();
    this.data.groupCards.set([]);
    this.editTeamSlots.set([]);
    this.bulkTeamPrice = null;
    this.originalTeamPricesJson = '[]';
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
