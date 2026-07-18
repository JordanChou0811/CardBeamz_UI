import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CloudinaryService, UploadedImage } from '../../services/cloudinary.service';
import { CLOUDINARY, isCloudinaryConfigured } from '../../services/cloudinary.config';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ConfirmService } from '../../services/confirm.service';

type UploadCategory = 'groups' | 'members' | 'system';

interface Pending {
  id: string;
  file: File;
  preview: string;
  progress: number;
  done: boolean;
  error?: string;
}

@Component({
  selector: 'app-upload-admin',
  imports: [DatePipe, FormsModule, TranslatePipe],
  template: `
    <h2 class="mb">{{ 'upload.title' | t }}</h2>

    @if (!configured) {
      <div class="card warn">⚠️ {{ 'upload.notConfigured' | t }}</div>
    }

    <div class="card folder-card">
      <div class="card-title">📁 {{ 'upload.folder' | t }}</div>
      <div class="folder-grid">
        <div class="field">
          <label>{{ 'upload.category' | t }}</label>
          <select [(ngModel)]="category" (ngModelChange)="onCategoryChange()">
            <option value="groups">{{ 'upload.cat.groups' | t }}</option>
            <option value="members">{{ 'upload.cat.members' | t }}</option>
            <option value="system">{{ 'upload.cat.system' | t }}</option>
          </select>
        </div>

        @if (category === 'groups') {
          <div class="field">
            <label>{{ 'upload.group' | t }}</label>
            @if (data.groups().length === 0) {
              <p class="hint-text">{{ 'upload.noGroups' | t }}</p>
            } @else {
              <select [(ngModel)]="groupCode">
                <option value="">{{ 'upload.selectGroup' | t }}</option>
                @for (g of data.groups(); track g.id) {
                  <option [value]="g.code">{{ g.name }}（{{ g.code }}）</option>
                }
              </select>
            }
          </div>
        }

        @if (category === 'members') {
          <div class="field">
            <label>{{ 'upload.member' | t }}</label>
            <select [(ngModel)]="memberId">
              <option value="">{{ 'upload.selectMember' | t }}</option>
              @for (m of memberOptions(); track m.id) {
                <option [value]="m.id">{{ m.name }}（{{ m.id }}）</option>
              }
            </select>
          </div>
        }
      </div>

      <div class="path-preview">
        {{ 'upload.targetPath' | t }}：<code>{{ targetFolder() || '—' }}</code>
      </div>
    </div>

    <div class="card">
      <div
        class="dropzone"
        [class.over]="dragOver()"
        (click)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragOver.set(false)"
        (drop)="onDrop($event)"
      >
        <div class="dz-icon">🖼️</div>
        <p>{{ 'upload.dropHere' | t }}</p>
        <button type="button" class="btn btn-outline btn-sm">{{ 'upload.choose' | t }}</button>
        <input
          #fileInput
          type="file"
          accept="image/*"
          multiple
          hidden
          (change)="onPick($event)"
        />
      </div>

      @if (pending().length > 0) {
        <div class="pending-list mt-2">
          @for (p of pending(); track p.id) {
            <div class="pending">
              <img [src]="p.preview" alt="preview" />
              <div class="p-info">
                <div class="p-name">{{ p.file.name }}</div>
                @if (p.error) {
                  <div class="error-text">{{ p.error | t }}</div>
                } @else {
                  <div class="bar"><span [style.width.%]="p.progress"></span></div>
                }
              </div>
            </div>
          }
        </div>

        <div class="flex-between mt-2">
          <span class="text-muted">{{ 'upload.selected' | t }} {{ pending().length }}</span>
          <button class="btn btn-primary" [disabled]="!configured || uploading() || !targetFolder()" (click)="uploadAll()">
            {{ uploading() ? ('upload.uploading' | t) : ('upload.uploadBtn' | t) }}
          </button>
        </div>
        @if (!targetFolder()) {
          <p class="error-text mt-1">{{ 'upload.needSub' | t }}</p>
        }
      }
      <p class="hint-text mt-1">{{ 'upload.hint' | t }}</p>
    </div>

    <div class="card mt-2">
      <div class="card-title">{{ 'upload.gallery' | t }}</div>
      @if (cloud.gallery().length === 0) {
        <div class="empty"><span class="emoji">🗂️</span>{{ 'upload.emptyGallery' | t }}</div>
      } @else {
        <div class="grid">
          @for (g of cloud.gallery(); track g.publicId) {
            <div class="g-item">
              <img [src]="g.url" [alt]="g.name" />
              <div class="g-meta">
                <div class="g-name" [title]="g.name">{{ g.name }}</div>
                @if (g.folder) {
                  <div class="g-folder text-muted" [title]="g.folder">📁 {{ g.folder }}</div>
                }
                <div class="g-date text-muted">{{ g.uploadedAt | date: 'yyyy/MM/dd HH:mm' }}</div>
              </div>
              <div class="g-actions">
                <button class="btn btn-outline btn-sm" (click)="copy(g)">
                  {{ copiedId() === g.publicId ? ('upload.copied' | t) : ('upload.copy' | t) }}
                </button>
                <button class="btn btn-danger btn-sm" (click)="askRemove(g)">
                  {{ 'upload.remove' | t }}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .warn {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fcd34d;
        margin-bottom: 16px;
      }
      .folder-card {
        margin-bottom: 16px;
      }
      .folder-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 16px;
      }
      .folder-grid .field {
        margin-bottom: 0;
      }
      .path-preview {
        margin-top: 14px;
        font-size: 14px;
        color: var(--c-muted);
      }
      .path-preview code {
        background: var(--c-surface-2);
        border: 1px solid var(--c-border);
        border-radius: 6px;
        padding: 3px 8px;
        color: var(--c-primary);
        font-weight: 600;
      }
      .g-folder {
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dropzone {
        border: 2px dashed var(--c-border);
        border-radius: var(--radius);
        padding: 34px 20px;
        text-align: center;
        cursor: pointer;
        transition: border-color 0.15s ease, background 0.15s ease;
        color: var(--c-muted);
      }
      .dropzone:hover,
      .dropzone.over {
        border-color: var(--c-primary);
        background: var(--c-surface-2);
      }
      .dz-icon {
        font-size: 38px;
      }
      .pending-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pending {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .pending img {
        width: 54px;
        height: 54px;
        object-fit: cover;
        border-radius: 10px;
      }
      .p-info {
        flex: 1;
        min-width: 0;
      }
      .p-name {
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .bar {
        height: 7px;
        background: var(--c-surface-2);
        border-radius: 999px;
        margin-top: 6px;
        overflow: hidden;
      }
      .bar span {
        display: block;
        height: 100%;
        background: var(--c-primary);
        transition: width 0.2s ease;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
      }
      .g-item {
        border: 1px solid var(--c-border);
        border-radius: var(--radius);
        overflow: hidden;
        background: var(--c-surface);
      }
      .g-item img {
        width: 100%;
        height: 130px;
        object-fit: cover;
        display: block;
        background: var(--c-surface-2);
      }
      .g-meta {
        padding: 8px 10px;
      }
      .g-name {
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .g-date {
        font-size: 11px;
      }
      .g-actions {
        display: flex;
        gap: 6px;
        padding: 0 10px 10px;
      }
      .g-actions .btn {
        flex: 1;
      }
    `,
  ],
})
export class UploadAdmin {
  protected cloud = inject(CloudinaryService);
  protected data = inject(DataService);
  private confirm = inject(ConfirmService);
  protected configured = isCloudinaryConfigured();

  category: UploadCategory = 'groups';
  /** 選中的團代號，作為 Cloudinary 資料夾名 */
  groupCode = '';
  memberId = '';

  pending = signal<Pending[]>([]);
  dragOver = signal(false);
  uploading = signal(false);
  copiedId = signal<string | null>(null);

  constructor() {
    void Promise.all([this.data.refreshGroups(), this.data.refreshMembers()]);
  }

  memberOptions = computed(() => this.data.members().filter((m) => m.role === 'member'));

  onCategoryChange() {
    this.groupCode = '';
    this.memberId = '';
  }

  private slug(value: string): string {
    return value
      .trim()
      .split(/\s+/)[0]
      .replace(/[\\/?#%]/g, '');
  }

  targetFolder(): string {
    const base = CLOUDINARY.baseFolder || 'cardbeamz';
    if (this.category === 'system') return `${base}/system`;
    if (this.category === 'groups') {
      const sub = this.slug(this.groupCode);
      return sub ? `${base}/groups/${sub}` : '';
    }
    if (this.category === 'members') {
      return this.memberId ? `${base}/members/${this.memberId}` : '';
    }
    return base;
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    if (e.dataTransfer?.files) this.addFiles(e.dataTransfer.files);
  }

  onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) this.addFiles(input.files);
    input.value = '';
  }

  private seq = 0;

  private addFiles(files: FileList) {
    const items: Pending[] = [];
    for (const file of Array.from(files)) {
      const id = `p_${Date.now()}_${this.seq++}`;
      if (!file.type.startsWith('image/')) {
        items.push({ id, file, preview: '', progress: 0, done: false, error: 'upload.errType' });
        continue;
      }
      items.push({ id, file, preview: URL.createObjectURL(file), progress: 0, done: false });
    }
    this.pending.update((list) => [...list, ...items]);
  }

  async uploadAll() {
    const folder = this.targetFolder();
    if (!this.configured || !folder) return;
    this.uploading.set(true);
    const targets = this.pending().filter((p) => !p.done && !p.error && p.preview);
    for (const p of targets) {
      try {
        await this.cloud.upload(p.file, {
          folder,
          onProgress: (pct) => this.patch(p.id, { progress: pct }),
        });
        this.patch(p.id, { progress: 100, done: true });
      } catch (err) {
        this.patch(p.id, { error: (err as Error).message });
      }
    }
    this.uploading.set(false);
    this.pending.update((list) => list.filter((x) => !x.done));
  }

  private patch(id: string, patch: Partial<Pending>) {
    this.pending.update((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async copy(g: UploadedImage) {
    try {
      await navigator.clipboard.writeText(g.url);
    } catch {
      /* ignore */
    }
    this.copiedId.set(g.publicId);
    setTimeout(() => this.copiedId.set(null), 1500);
  }

  async askRemove(g: UploadedImage) {
    const ok = await this.confirm.ask({
      title: 'confirm.removeUpload',
      message: g.name || g.publicId,
      confirmKey: 'upload.remove',
    });
    if (!ok) return;
    this.cloud.removeFromGallery(g.publicId);
  }
}
