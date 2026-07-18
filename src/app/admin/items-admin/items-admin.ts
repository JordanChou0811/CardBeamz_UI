import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Group, GroupCard, WarehouseItem } from '../../models/models';
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
            <select [(ngModel)]="groupId" (ngModelChange)="onGroupChange($event)">
              <option value="">{{ 'aitems.selectGroup' | t }}</option>
              @for (g of data.groups(); track g.id) {
                <option [value]="g.id">{{ g.name }}（{{ g.code }}）</option>
              }
            </select>
          }
        </div>

        @if (groupId) {
          <div class="field">
            <label>{{ 'aitems.card' | t }}</label>
            @if (data.groupCards().length === 0) {
              <p class="hint-text">{{ 'aitems.noCards' | t }}</p>
            } @else {
              <div class="card-pick">
                @for (c of data.groupCards(); track c.id) {
                  <button
                    type="button"
                    class="pick-tile"
                    [class.active]="groupCardId === c.id"
                    [style.background]="isColor(c.photo) ? c.photo : null"
                    (click)="groupCardId = c.id"
                    [title]="cardLabel(c)"
                  >
                    @if (!isColor(c.photo) && c.photo) {
                      <img [src]="c.photo" [alt]="cardLabel(c)" />
                    }
                    <span class="tag">{{ cardLabel(c) }}</span>
                  </button>
                }
              </div>
            }
          </div>
        }

        @if (selectedCard(); as c) {
          <div class="preview">
            <div class="thumb" [style.background]="isColor(c.photo) ? c.photo : null">
              @if (!isColor(c.photo) && c.photo) {
                <img [src]="c.photo" alt="" />
              }
            </div>
            <div>
              <div><b>{{ cardLabel(c) }}</b></div>
              <div class="val">{{ c.exchangeValue }} {{ 'common.yuan' | t }}</div>
            </div>
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
      .preview {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
        padding: 10px;
        background: var(--c-surface-2);
        border-radius: 10px;
        border: 1px solid var(--c-border);
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
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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

  memberId = '';
  groupId = '';
  groupCardId = '';
  quantity = 1;

  error = signal('');
  success = signal(0);

  memberOptions = computed(() => this.data.members().filter((m) => m.role === 'member'));

  selectedGroup = computed<Group | undefined>(() =>
    this.data.groups().find((g) => g.id === this.groupId)
  );

  selectedCard = computed<GroupCard | undefined>(() =>
    this.data.groupCards().find((c) => c.id === this.groupCardId)
  );

  warehouseItems = computed<WarehouseItem[]>(() =>
    this.data.items().filter((i) => i.status === 'in_warehouse')
  );

  constructor() {
    void Promise.all([
      this.data.refreshMembers(),
      this.data.refreshGroups(),
      this.data.refreshItems(undefined, 'in_warehouse'),
    ]);
  }

  isColor(value: string): boolean {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value?.trim() ?? '');
  }

  memberName(id: string): string {
    return this.data.findMember(id)?.name ?? '—';
  }

  cardLabel(c: GroupCard): string {
    const name = c.cardName?.trim() || '';
    const no = c.cardNo?.trim() || '';
    if (name && no) return `${name} #${no}`;
    return name || no || '—';
  }

  async onGroupChange(groupId: string) {
    this.groupCardId = '';
    await this.data.refreshGroupCards(groupId);
  }

  async assign() {
    this.error.set('');
    this.success.set(0);
    if (!this.memberId || !this.groupId || !this.groupCardId) {
      this.error.set('aitems.errRequired');
      return;
    }
    const created = await this.data.assignFromCatalog(
      this.memberId,
      this.groupCardId,
      Number(this.quantity) || 1
    );
    this.success.set(created.length);
    this.groupCardId = '';
    this.quantity = 1;
  }
}
