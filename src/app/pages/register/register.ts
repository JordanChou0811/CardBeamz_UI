import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { Controls } from '../../shared/controls/controls';
import { apiErrorI18nKey } from '../../services/telegram.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, TranslatePipe, Controls],
  template: `
    <div class="auth-wrap">
      <div class="auth-controls"><app-controls /></div>
      <div class="card auth-card">
        <a class="back" routerLink="/">{{ 'common.back' | t }}</a>
        <div class="auth-logo"><img src="/photos/S__5726356.jpg" alt="CardBeamz" /></div>
        <h2 class="text-center">{{ 'register.title' | t }}</h2>
        <p class="text-center text-muted">{{ 'register.subtitle' | t }}</p>

        <form (ngSubmit)="submit()" class="mt-3">
          <div class="field">
            <label>{{ 'common.name' | t }}<span class="req">*</span></label>
            <input type="text" [(ngModel)]="name" name="name" [placeholder]="'register.namePlaceholder' | t" />
          </div>

          <div class="field">
            <label>{{ 'common.account' | t }}<span class="req">*</span></label>
            <div class="input-group">
              <span class="prefix">09</span>
              <input
                type="text"
                inputmode="numeric"
                maxlength="8"
                [(ngModel)]="digits"
                name="digits"
                (input)="onDigits()"
                [placeholder]="'register.digitsPlaceholder' | t"
              />
            </div>
            <p class="hint-text">{{ 'register.accountHint' | t }}</p>
          </div>

          <div class="field">
            <label>{{ 'register.verify' | t }}<span class="req">*</span></label>
            <button type="button" class="btn btn-outline btn-sm" (click)="sendCode()">
              {{ (sentCode() ? 'register.resend' : 'register.verify') | t }}
            </button>
            @if (sentCode()) {
              <p class="hint-text">
                {{ 'register.codeSent' | t }}<b>{{ sentCode() }}</b>
              </p>
            }
          </div>

          <div class="field">
            <label>{{ 'register.code' | t }}<span class="req">*</span></label>
            <input type="text" [(ngModel)]="code" name="code" [placeholder]="'register.codePlaceholder' | t" />
          </div>

          <div class="field">
            <label>{{ 'common.password' | t }}<span class="req">*</span></label>
            <input type="password" [(ngModel)]="password" name="password" [placeholder]="'register.passwordPlaceholder' | t" />
          </div>

          @if (error()) {
            <p class="error-text">{{ error() | t }}</p>
          }

          <button type="submit" class="btn btn-primary btn-block mt-2">{{ 'register.submit' | t }}</button>
        </form>

        <p class="text-center text-muted mt-2">
          {{ 'register.haveAccount' | t }}<a class="link" routerLink="/login">{{ 'register.goLogin' | t }}</a>
        </p>
      </div>
    </div>

    @if (success()) {
      <div class="modal-backdrop">
        <div class="modal">
          <div style="font-size:42px">🎉</div>
          <h3>{{ 'register.welcome' | t }}</h3>
          <div class="modal-body">
            {{ 'register.success' | t }}<br />
            {{ 'register.yourNo' | t }}<b class="member-no">{{ memberNo() }}</b
            ><br />
            <span class="text-muted">{{ 'register.autoSent' | t }}</span>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary btn-block" (click)="goLogin()">{{ 'register.gotoLogin' | t }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .auth-wrap {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        position: relative;
        background: linear-gradient(135deg, #1a0f17, #3d0f2a 55%, #ff2d88);
      }
      .auth-controls {
        position: absolute;
        top: 16px;
        right: 16px;
      }
      .auth-card {
        width: 100%;
        max-width: 440px;
        position: relative;
      }
      .auth-logo {
        background: var(--c-dark);
        border-radius: 14px;
        overflow: hidden;
        margin: 6px 0 14px;
      }
      .auth-logo img {
        display: block;
        width: 100%;
        height: auto;
      }
      .back {
        position: absolute;
        top: 18px;
        left: 18px;
        font-size: 14px;
        color: var(--c-muted);
      }
      .link {
        color: var(--c-primary);
        font-weight: 600;
      }
      .member-no {
        color: var(--c-primary);
        font-size: 18px;
        letter-spacing: 1px;
      }
    `,
  ],
})
export class Register {
  private data = inject(DataService);
  private router = inject(Router);

  name = '';
  digits = '';
  code = '';
  password = '';

  sentCode = signal('');
  error = signal('');
  success = signal(false);
  memberNo = signal('');

  onDigits() {
    this.digits = this.digits.replace(/\D/g, '').slice(0, 8);
  }

  get account() {
    return '09' + this.digits;
  }

  async sendCode() {
    if (this.digits.length !== 8) {
      this.error.set('register.errPhone');
      return;
    }
    this.error.set('');
    try {
      const code = await this.data.sendVerifyCode(this.account);
      this.sentCode.set(code || '已發送');
    } catch {
      this.error.set('register.errSend');
    }
  }

  async submit() {
    this.error.set('');
    if (!this.name.trim()) {
      this.error.set('register.errName');
      return;
    }
    if (this.digits.length !== 8) {
      this.error.set('register.errDigits');
      return;
    }
    if (!this.sentCode()) {
      this.error.set('register.errCodeFirst');
      return;
    }
    if (!this.code.trim()) {
      this.error.set('register.errCode');
      return;
    }
    if (!this.password.trim()) {
      this.error.set('register.errPwd');
      return;
    }

    try {
      const member = await this.data.createMember({
        account: this.account,
        name: this.name.trim(),
        password: this.password,
        verifyCode: this.code.trim(),
      });
      this.memberNo.set(member.id);
      this.success.set(true);
    } catch (e) {
      // 依 returnCode 顯示錯誤（1002 驗證碼、1003 帳號已存在…）
      this.error.set(apiErrorI18nKey(e, 'register.errFail'));
    }
  }

  goLogin() {
    this.router.navigate(['/login']);
  }
}
