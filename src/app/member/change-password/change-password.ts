import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule, TranslatePipe],
  template: `
    <h2 class="mb">{{ 'pwd.title' | t }}</h2>

    <div class="card form-card">
      <form (ngSubmit)="submit()">
        <div class="field">
          <label>{{ 'pwd.old' | t }}<span class="req">*</span></label>
          <input type="password" [(ngModel)]="oldPwd" name="o" />
        </div>
        <div class="field">
          <label>{{ 'pwd.new' | t }}<span class="req">*</span></label>
          <input type="password" [(ngModel)]="newPwd" name="n" />
        </div>
        <div class="field">
          <label>{{ 'pwd.confirm' | t }}<span class="req">*</span></label>
          <input type="password" [(ngModel)]="confirmPwd" name="c" />
        </div>

        @if (done()) {
          <p class="ok-text">{{ 'pwd.ok' | t }}</p>
        }

        <button type="submit" class="btn btn-primary btn-block mt-1">{{ 'pwd.submit' | t }}</button>
      </form>
    </div>
  `,
  styles: [
    `
      .mb {
        margin-bottom: 18px;
      }
      .form-card {
        max-width: 440px;
      }
      .ok-text {
        color: var(--c-success);
        font-size: 14px;
        font-weight: 600;
      }
    `,
  ],
})
export class ChangePassword {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private alert = inject(AlertService);

  oldPwd = '';
  newPwd = '';
  confirmPwd = '';
  done = signal(false);

  async submit() {
    this.done.set(false);
    const user = this.auth.currentUser();
    if (!user) return;
    if (!this.oldPwd || !this.newPwd || !this.confirmPwd) {
      await this.alert.error('pwd.errRequired');
      return;
    }
    if (this.newPwd !== this.confirmPwd) {
      await this.alert.error('pwd.errMismatch');
      return;
    }
    try {
      await this.data.changePassword(user.id, this.oldPwd, this.newPwd);
      this.oldPwd = this.newPwd = this.confirmPwd = '';
      this.done.set(true);
    } catch {
      // API 錯誤已由 TelegramService 跳窗
    }
  }
}
