import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Member } from '../../models/models';
import { TranslatePipe } from '../../services/translate.pipe';
import { apiErrorI18nKey } from '../../services/telegram.service';

@Component({
  selector: 'app-members-admin',
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="head">
      <h2>{{ 'amembers.title' | t }}</h2>
      <button class="btn btn-primary" type="button" (click)="openCreate()">
        {{ 'amembers.add' | t }}
      </button>
    </div>

    <div class="card">
      <div class="card-title">{{ 'amembers.list' | t }}</div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ 'amembers.no' | t }}</th>
              <th>{{ 'common.name' | t }}</th>
              <th>{{ 'amembers.accountPhone' | t }}</th>
              <th>{{ 'amembers.credit' | t }}</th>
              <th class="col-actions">{{ 'amembers.action' | t }}</th>
            </tr>
          </thead>
          <tbody>
            @for (m of members(); track m.id) {
              <tr>
                <td><b>{{ m.id }}</b></td>
                <td>{{ m.name }}</td>
                <td>{{ m.account }}</td>
                <td><b class="credit">{{ m.credit }} {{ 'common.yuan' | t }}</b></td>
                <td class="col-actions">
                  <button class="btn btn-outline btn-sm" type="button" (click)="openEdit(m)">
                    {{ 'amembers.edit' | t }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (formOpen()) {
      <div class="modal-backdrop">
        <div class="modal">
          <h3>{{ mode() === 'create' ? ('amembers.add' | t) : ('amembers.edit' | t) }}</h3>
          <div class="modal-body form-body">
            @if (mode() === 'edit') {
              <div class="field">
                <label>{{ 'amembers.no' | t }}</label>
                <input [value]="form.id" disabled />
              </div>
            }
            <div class="field">
              <label>{{ 'common.name' | t }}<span class="req">*</span></label>
              <input type="text" [(ngModel)]="form.name" name="name" />
            </div>
            <div class="field">
              <label>{{ 'amembers.accountPhone' | t }}<span class="req">*</span></label>
              <div class="input-group">
                <span class="prefix">09</span>
                <input
                  type="text"
                  inputmode="numeric"
                  maxlength="8"
                  [(ngModel)]="form.digits"
                  name="digits"
                  (input)="onDigits()"
                  [placeholder]="'register.digitsPlaceholder' | t"
                />
              </div>
            </div>
            <div class="field">
              <label>
                {{ 'common.password' | t }}
                @if (mode() === 'create') {
                  <span class="req">*</span>
                } @else {
                  <span class="hint">（{{ 'amembers.pwdOptional' | t }}）</span>
                }
              </label>
              <input type="password" [(ngModel)]="form.password" name="password" />
            </div>
            <div class="field">
              <label>{{ 'amembers.creditAmount' | t }}</label>
              <input type="number" [(ngModel)]="form.credit" name="credit" />
            </div>
            @if (error()) {
              <p class="error-text">{{ error() | t }}</p>
            }
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" type="button" (click)="closeForm()">{{ 'common.cancel' | t }}</button>
            <button class="btn btn-primary" type="button" (click)="save()">{{ 'common.save' | t }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
      }
      .head h2 {
        margin: 0;
      }
      .credit {
        color: var(--c-primary);
      }
      .table-wrap {
        overflow-x: auto;
      }
      .col-actions {
        width: 1%;
        white-space: nowrap;
        text-align: left;
        vertical-align: middle;
      }
      .form-body {
        text-align: left;
      }
      .hint {
        color: var(--c-muted);
        font-weight: 500;
        font-size: 12px;
      }
    `,
  ],
})
export class MembersAdmin {
  private data = inject(DataService);

  members = computed(() => this.data.members().filter((m) => m.role === 'member'));

  formOpen = signal(false);
  mode = signal<'create' | 'edit'>('create');
  error = signal('');
  form = {
    id: '',
    name: '',
    digits: '',
    password: '',
    credit: 0,
  };

  constructor() {
    void this.data.refreshMembers();
  }

  onDigits() {
    this.form.digits = this.form.digits.replace(/\D/g, '').slice(0, 8);
  }

  private account(): string {
    return '09' + this.form.digits;
  }

  openCreate() {
    this.mode.set('create');
    this.error.set('');
    this.form = { id: '', name: '', digits: '', password: '', credit: 0 };
    this.formOpen.set(true);
  }

  openEdit(m: Member) {
    this.mode.set('edit');
    this.error.set('');
    this.form = {
      id: m.id,
      name: m.name,
      digits: m.account.startsWith('09') ? m.account.slice(2) : m.account,
      password: '',
      credit: m.credit,
    };
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
    this.error.set('');
  }

  async save() {
    this.error.set('');
    if (!this.form.name.trim()) {
      this.error.set('amembers.errName');
      return;
    }
    if (this.form.digits.length !== 8) {
      this.error.set('amembers.errAccount');
      return;
    }
    if (this.mode() === 'create' && !this.form.password.trim()) {
      this.error.set('amembers.errPassword');
      return;
    }

    try {
      if (this.mode() === 'create') {
        await this.data.adminCreateMember({
          account: this.account(),
          name: this.form.name.trim(),
          password: this.form.password,
          credit: Number(this.form.credit) || 0,
        });
      } else {
        const patch: { name: string; account: string; credit: number; password?: string } = {
          name: this.form.name.trim(),
          account: this.account(),
          credit: Number(this.form.credit) || 0,
        };
        if (this.form.password.trim()) patch.password = this.form.password.trim();
        await this.data.adminUpdateMember(this.form.id, patch);
      }
      this.closeForm();
    } catch (e) {
      // 依 returnCode 顯示（1003 重複、1006 格式…）
      this.error.set(apiErrorI18nKey(e, 'amembers.errFail'));
    }
  }
}
