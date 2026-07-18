import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CloudinaryService, UploadedImage } from '../../services/cloudinary.service';
import { Group, GroupCard } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';
import { apiErrorI18nKey } from '../../services/telegram.service';

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
            <div class="card-title">{{ 'groups.cardsTitle' | t }} · {{ mg.name }}（{{ mg.code }}）</div>
            <p class="hint-text">{{ 'groups.cardsHint' | t }}</p>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">{{ (editingCardId() ? 'groups.editCard' : 'groups.addCard') | t }}</div>

            <div class="two-col">
              <div class="field">
                <label>{{ 'aitems.cardName' | t }}</label>
                <input [(ngModel)]="cardName" [placeholder]="'aitems.cardNamePlaceholder' | t" />
              </div>
              <div class="field">
                <label>{{ 'aitems.cardNo' | t }}</label>
                <input [(ngModel)]="cardNo" [placeholder]="'aitems.cardNoPlaceholder' | t" />
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
                  [style.background]="isColor(selectedCardPreview(mg)) ? selectedCardPreview(mg) : null"
                >
                  @if (!isColor(selectedCardPreview(mg)) && selectedCardPreview(mg)) {
                    <img [src]="selectedCardPreview(mg)" alt="preview" />
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

            @if (cardError()) {
              <p class="error-text">{{ cardError() | t }}</p>
            }

            <div class="row">
              <button class="btn btn-primary" (click)="saveCard()">
                {{ (editingCardId() ? 'common.save' : 'groups.addCard') | t }}
              </button>
              @if (editingCardId()) {
                <button class="btn btn-outline" (click)="resetCardForm()">{{ 'common.cancel' | t }}</button>
              }
            </div>
          </div>

          <div class="card">
            <div class="card-title">{{ 'groups.cardsTitle' | t }}</div>
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
                <th>{{ 'groups.exchange' | t }}</th>
                <th style="width:120px"></th>
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
                  <td><b class="val">{{ g.exchangeValue }} {{ 'common.yuan' | t }}</b></td>
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
                    <button
                      type="button"
                      class="btn btn-danger btn-icon"
                      [attr.data-tip]="'common.delete' | t"
                      [attr.aria-label]="'common.delete' | t"
                      (click)="data.deleteGroup(g.id)"
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
            <label>{{ 'groups.exchange' | t }}</label>
            <input type="number" min="0" [(ngModel)]="exchangeValue" />
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

          @if (error()) {
            <p class="error-text">{{ error() | t }}</p>
          }

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
          } @else if (folderError()) {
            <p class="error-text">{{ folderError() | t }}</p>
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

  code = '';
  name = '';
  exchangeValue = 0;
  photo = '#6366f1';

  editingId = signal<string | null>(null);
  groupFormOpen = signal(false);
  error = signal('');
  picker = signal(false);

  managingGroup = signal<Group | null>(null);
  editingCardId = signal<string | null>(null);
  cardError = signal('');
  cardName = '';
  cardNo = '';
  cardExchange = 0;
  cardPhoto = signal('');

  /** 開啟卡片圖跳窗時帶入的團 */
  cardPhotoPicker = signal<Group | null>(null);
  folderImages = signal<UploadedImage[]>([]);
  folderNextCursor = signal<string | undefined>(undefined);
  folderLoading = signal(false);
  folderError = signal('');

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

  openAddGroup() {
    this.resetForm();
    this.groupFormOpen.set(true);
  }

  closeGroupForm() {
    this.groupFormOpen.set(false);
    this.resetForm();
  }

  async save() {
    this.error.set('');
    if (!this.code.trim() || !this.name.trim()) {
      this.error.set('groups.errRequired');
      return;
    }
    const payload = {
      code: this.code.trim(),
      name: this.name.trim(),
      exchangeValue: Number(this.exchangeValue) || 0,
      photo: this.photo.trim() || '#6366f1',
    };
    const id = this.editingId();
    if (id) {
      await this.data.updateGroup(id, payload);
    } else {
      await this.data.addGroup(payload);
    }
    this.closeGroupForm();
  }

  edit(g: Group) {
    this.editingId.set(g.id);
    this.code = g.code;
    this.name = g.name;
    this.exchangeValue = g.exchangeValue;
    this.photo = g.photo;
    this.error.set('');
    this.groupFormOpen.set(true);
  }

  resetForm() {
    this.editingId.set(null);
    this.error.set('');
    this.code = '';
    this.name = '';
    this.exchangeValue = 0;
    this.photo = '#6366f1';
  }

  async openCards(g: Group) {
    this.managingGroup.set(g);
    this.resetCardForm();
    this.cardExchange = g.exchangeValue;
    await this.data.refreshGroupCards(g.id);
  }

  closeCards() {
    this.managingGroup.set(null);
    this.resetCardForm();
    this.closeCardPhotoPicker();
    this.data.groupCards.set([]);
  }

  async openCardPhotoPicker() {
    const g = this.managingGroup();
    if (!g) return;
    this.cardPhotoPicker.set(g);
    this.folderImages.set([]);
    this.folderNextCursor.set(undefined);
    this.folderError.set('');
    await this.fetchFolderImages(g.code);
  }

  closeCardPhotoPicker() {
    this.cardPhotoPicker.set(null);
    this.folderLoading.set(false);
    this.folderError.set('');
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
    this.folderError.set('');
    try {
      const res = await this.cloud.listGroupFolder(groupCode, nextCursor);
      this.folderImages.set(append ? [...this.folderImages(), ...res.images] : res.images);
      this.folderNextCursor.set(res.nextCursor);
    } catch (e) {
      this.folderError.set(apiErrorI18nKey(e, 'api.err.9102'));
      if (!append) this.folderImages.set([]);
    } finally {
      this.folderLoading.set(false);
    }
  }

  editCard(c: GroupCard) {
    this.editingCardId.set(c.id);
    this.cardName = c.cardName ?? '';
    this.cardNo = c.cardNo ?? '';
    this.cardExchange = c.exchangeValue;
    const g = this.managingGroup();
    this.cardPhoto.set(g && c.photo === g.photo ? '' : c.photo);
  }

  resetCardForm() {
    const g = this.managingGroup();
    this.editingCardId.set(null);
    this.cardError.set('');
    this.cardName = '';
    this.cardNo = '';
    this.cardExchange = g?.exchangeValue ?? 0;
    this.cardPhoto.set('');
  }

  async saveCard() {
    this.cardError.set('');
    const g = this.managingGroup();
    if (!g) return;
    if (!this.cardName.trim() && !this.cardNo.trim()) {
      this.cardError.set('groups.cardErrRequired');
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
    this.resetCardForm();
  }

  async removeCard(id: string) {
    const g = this.managingGroup();
    if (!g) return;
    await this.data.deleteGroupCard(id, g.id);
    if (this.editingCardId() === id) this.resetCardForm();
  }
}
