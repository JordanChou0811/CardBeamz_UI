import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CloudinaryService, UploadedImage } from '../../services/cloudinary.service';
import { Group, WarehouseItem } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-items-admin',
  imports: [DatePipe, FormsModule, TranslatePipe],
  template: `
    <h2 class="mb">🃏 {{ 'aitems.title' | t }}</h2>

    <div class="grid">
      <div class="card">
        <div class="card-title">{{ 'aitems.assign' | t }}</div>

        <div class="field">
          <label>{{ 'aitems.member' | t }}</label>
          <select [(ngModel)]="memberId">
            <option value="">{{ 'aitems.selectMember' | t }}</option>
            @for (m of memberOptions(); track m.id) {
              <option [value]="m.id">{{ m.name }}（{{ m.id }}）</option>
            }
          </select>
        </div>

        <div class="field">
          <label>{{ 'aitems.group' | t }}</label>
          @if (data.groups().length === 0) {
            <p class="hint-text">{{ 'aitems.noGroups' | t }}</p>
          } @else {
            <select [(ngModel)]="groupId" (ngModelChange)="onGroupChange()">
              <option value="">{{ 'aitems.selectGroup' | t }}</option>
              @for (g of data.groups(); track g.id) {
                <option [value]="g.id">{{ g.name }}（{{ g.code }}）</option>
              }
            </select>
          }
        </div>

        @if (selectedGroup(); as g) {
          <div class="field">
            <label>{{ 'aitems.cardPhoto' | t }}</label>
            <div class="card-pick">
              <button
                type="button"
                class="pick-tile def"
                [class.active]="cardPhoto() === ''"
                [style.background]="isColor(g.photo) ? g.photo : null"
                (click)="cardPhoto.set('')"
              >
                @if (!isColor(g.photo) && g.photo) {
                  <img [src]="g.photo" alt="" />
                }
                <span class="tag">{{ 'aitems.useGroupPhoto' | t }}</span>
              </button>
              @for (img of groupImages(); track img.publicId) {
                <button
                  type="button"
                  class="pick-tile"
                  [class.active]="cardPhoto() === img.url"
                  (click)="cardPhoto.set(img.url)"
                >
                  <img [src]="img.url" [alt]="img.name" />
                </button>
              }
            </div>
            @if (groupImages().length === 0) {
              <p class="hint-text">{{ 'aitems.noCardImages' | t }}</p>
            }
          </div>

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
            <input type="number" min="0" [(ngModel)]="exchangeValue" />
          </div>
        }

        <div class="field">
          <label>{{ 'aitems.quantity' | t }}</label>
          <input type="number" min="1" [(ngModel)]="quantity" />
        </div>

        @if (error()) {
          <p class="error-text">{{ error() | t }}</p>
        }
        @if (success()) {
          <p class="ok-text">{{ 'aitems.assigned' | t }} {{ success() }} {{ 'wh.items' | t }}</p>
        }

        <button class="btn btn-primary" (click)="assign()">{{ 'aitems.assignBtn' | t }}</button>
      </div>

      <div class="card">
        <div class="card-title">{{ 'aitems.listTitle' | t }}</div>
        @if (warehouseItems().length === 0) {
          <div class="empty"><span class="emoji">🃏</span>{{ 'aitems.empty' | t }}</div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>{{ 'aitems.member' | t }}</th>
                <th>{{ 'common.group' | t }}</th>
                <th>{{ 'aitems.card' | t }}</th>
                <th>{{ 'common.groupPhoto' | t }}</th>
                <th>{{ 'groups.exchange' | t }}</th>
                <th>{{ 'aitems.assignedAt' | t }}</th>
                <th style="width:90px"></th>
              </tr>
            </thead>
            <tbody>
              @for (it of warehouseItems(); track it.id) {
                <tr>
                  <td>{{ memberName(it.memberId) }}<span class="text-muted">（{{ it.memberId }}）</span></td>
                  <td><b>{{ it.cbz }}</b></td>
                  <td>
                    @if (it.cardName || it.cardNo) {
                      {{ it.cardName }}<span class="text-muted">{{ it.cardNo ? ' #' + it.cardNo : '' }}</span>
                    } @else {
                      <span class="text-muted">—</span>
                    }
                  </td>
                  <td>
                    <div class="thumb" [style.background]="isColor(it.groupPhoto) ? it.groupPhoto : null">
                      @if (!isColor(it.groupPhoto) && it.groupPhoto) {
                        <img [src]="it.groupPhoto" alt="" />
                      } @else {
                        {{ it.cbz.slice(0, 5) }}
                      }
                    </div>
                  </td>
                  <td><b class="val">{{ it.exchangeValue }} {{ 'common.yuan' | t }}</b></td>
                  <td class="text-muted">{{ it.updatedAt | date: 'yyyy/MM/dd HH:mm' }}</td>
                  <td>
                    <button class="btn btn-danger btn-sm" (click)="data.removeItem(it.id)">{{ 'aitems.remove' | t }}</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .grid {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 20px;
        align-items: start;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 12px;
      }
      .card-pick {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
        gap: 8px;
      }
      .pick-tile {
        position: relative;
        aspect-ratio: 1;
        border: 2px solid var(--c-border);
        border-radius: 10px;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        background: var(--c-surface-2);
        transition: border-color 0.12s ease, transform 0.12s ease;
      }
      .pick-tile:hover {
        transform: translateY(-2px);
      }
      .pick-tile.active {
        border-color: var(--c-primary);
      }
      .pick-tile img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .pick-tile .tag {
        position: absolute;
        inset: auto 0 0 0;
        font-size: 10px;
        line-height: 1.3;
        padding: 2px;
        background: rgba(0, 0, 0, 0.45);
        color: #fff;
      }
      .val {
        color: var(--c-primary);
      }
      .ok-text {
        color: var(--c-primary);
        font-weight: 600;
      }
      @media (max-width: 820px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ItemsAdmin {
  protected data = inject(DataService);
  private cloud = inject(CloudinaryService);

  memberId = '';
  groupId = '';
  cardName = '';
  cardNo = '';
  quantity = 1;

  /** 這張卡片要用的圖；'' 代表沿用團預設圖 */
  cardPhoto = signal('');
  exchangeValue = signal(0);

  error = signal('');
  success = signal(0);

  memberOptions = computed(() => this.data.members().filter((m) => m.role === 'member'));

  selectedGroup = computed<Group | undefined>(() =>
    this.data.groups().find((g) => g.id === this.groupId)
  );

  /** 該團資料夾（cardbeamz/groups/{代號或團名}）裡已上傳的卡圖 */
  groupImages = computed<UploadedImage[]>(() => {
    const g = this.selectedGroup();
    if (!g) return [];
    const keys = [g.code, g.name.trim().split(/\s+/)[0]]
      .map((k) => k.replace(/[\\/?#%]/g, '').trim())
      .filter(Boolean);
    return this.cloud.gallery().filter((img) => {
      const folder = img.folder || '';
      if (!folder.includes('groups/')) return false;
      return keys.some((k) => folder.endsWith(`/${k}`) || folder.endsWith(`groups/${k}`));
    });
  });

  warehouseItems = computed<WarehouseItem[]>(() =>
    this.data.items().filter((i) => i.status === 'in_warehouse')
  );

  isColor(value: string): boolean {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value?.trim() ?? '');
  }

  memberName(id: string): string {
    return this.data.findMember(id)?.name ?? '—';
  }

  onGroupChange() {
    this.cardPhoto.set('');
    this.exchangeValue.set(this.selectedGroup()?.exchangeValue ?? 0);
  }

  async assign() {
    this.error.set('');
    this.success.set(0);
    const group = this.selectedGroup();
    if (!this.memberId || !group) {
      this.error.set('aitems.errRequired');
      return;
    }
    const created = await this.data.assignItems(
      this.memberId,
      {
        name: group.name,
        photo: this.cardPhoto() || group.photo,
        exchangeValue: Number(this.exchangeValue()) || 0,
        cardName: this.cardName,
        cardNo: this.cardNo,
      },
      Number(this.quantity) || 1
    );
    this.success.set(created.length);
    this.groupId = '';
    this.cardName = '';
    this.cardNo = '';
    this.cardPhoto.set('');
    this.exchangeValue.set(0);
    this.quantity = 1;
  }
}
