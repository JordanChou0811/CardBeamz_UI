import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { Group } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-groups-admin',
  imports: [FormsModule, TranslatePipe],
  template: `
    <h2 class="mb">🎴 {{ 'groups.title' | t }}</h2>

    <div class="grid">
      <div class="card">
        <div class="card-title">{{ (editingId() ? 'groups.edit' : 'groups.add') | t }}</div>

        <div class="field">
          <label>{{ 'groups.code' | t }}</label>
          <input [(ngModel)]="code" [placeholder]="'groups.codePlaceholder' | t" />
        </div>
        <div class="field">
          <label>{{ 'groups.name' | t }}</label>
          <input [(ngModel)]="name" [placeholder]="'groups.namePlaceholder' | t" />
        </div>
        <div class="field">
          <label>{{ 'groups.exchange' | t }}</label>
          <input type="number" [(ngModel)]="exchangeValue" />
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
              <input [(ngModel)]="photo" [placeholder]="'groups.photoUrl' | t" />
              <button type="button" class="btn btn-outline btn-sm mt-1" (click)="openPicker()">
                🖼️ {{ 'groups.pickPhoto' | t }}
              </button>
            </div>
          </div>
        </div>

        @if (error()) {
          <p class="error-text">{{ error() | t }}</p>
        }

        <div class="row">
          <button class="btn btn-primary" (click)="save()">
            {{ (editingId() ? 'common.save' : 'groups.add') | t }}
          </button>
          @if (editingId()) {
            <button class="btn btn-outline" (click)="resetForm()">{{ 'common.cancel' | t }}</button>
          }
        </div>
      </div>

      <div class="card">
        <div class="card-title">{{ 'groups.list' | t }}</div>
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
                <th style="width:130px"></th>
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
                  <td>
                    <button class="btn btn-outline btn-sm" (click)="edit(g)">{{ 'common.edit' | t }}</button>
                    <button class="btn btn-danger btn-sm" (click)="data.deleteGroup(g.id)">{{ 'common.delete' | t }}</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

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
      .photo-row {
        display: flex;
        gap: 12px;
      }
      .photo-inputs {
        flex: 1;
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
      td .btn {
        margin-right: 6px;
      }
      .picker {
        max-width: 560px;
      }
      .pick-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 10px;
        max-height: 380px;
        overflow: auto;
        margin-top: 8px;
      }
      .pick {
        border: 1px solid var(--c-border);
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
      .pick img {
        width: 100%;
        height: 90px;
        object-fit: cover;
        display: block;
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
  error = signal('');
  picker = signal(false);

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
    this.resetForm();
  }

  edit(g: Group) {
    this.editingId.set(g.id);
    this.code = g.code;
    this.name = g.name;
    this.exchangeValue = g.exchangeValue;
    this.photo = g.photo;
  }

  resetForm() {
    this.editingId.set(null);
    this.code = '';
    this.name = '';
    this.exchangeValue = 0;
    this.photo = '#6366f1';
  }
}
