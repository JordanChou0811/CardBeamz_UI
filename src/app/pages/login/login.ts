import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { Controls } from '../../shared/controls/controls';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TranslatePipe, Controls],
  template: `
    <div class="auth-wrap">
      <div class="auth-controls"><app-controls /></div>
      <div class="card auth-card">
        <a class="back" routerLink="/">{{ 'common.back' | t }}</a>
        <div class="auth-logo"><img src="/photos/S__5726356.jpg" alt="CardBeamz" /></div>
        <h2 class="text-center">{{ 'landing.memberLogin' | t }}</h2>
        <p class="text-center text-muted">{{ 'login.subtitle' | t }}</p>

        <form (ngSubmit)="submit()" class="mt-3">
          <div class="field">
            <label>{{ 'common.account' | t }}<span class="req">*</span></label>
            <input
              type="text"
              [(ngModel)]="account"
              name="account"
              [placeholder]="'login.accountPlaceholder' | t"
            />
          </div>
          <div class="field">
            <label>{{ 'common.password' | t }}<span class="req">*</span></label>
            <input type="password" [(ngModel)]="password" name="password" [placeholder]="'login.passwordPlaceholder' | t" />
          </div>

          <div class="flex-between">
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="remember" name="remember" />
              {{ 'login.remember' | t }}
            </label>
          </div>

          @if (error()) {
            <p class="error-text">{{ error() | t }}</p>
          }

          <button type="submit" class="btn btn-primary btn-block mt-2">{{ 'common.login' | t }}</button>
        </form>

        <p class="text-center text-muted mt-2">
          {{ 'login.noAccount' | t }}<a class="link" routerLink="/register">{{ 'common.register' | t }}</a>
        </p>

        <div class="demo-hint">{{ 'login.demoHint' | t }}</div>
      </div>
    </div>
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
        max-width: 420px;
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
      .demo-hint {
        margin-top: 18px;
        padding: 10px 12px;
        background: var(--c-primary-light);
        border-radius: var(--radius-sm);
        font-size: 12px;
        color: var(--c-primary-dark);
        text-align: center;
      }
    `,
  ],
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  account = '';
  password = '';
  remember = false;
  error = signal('');

  async submit() {
    this.error.set('');
    if (!this.account.trim() || !this.password.trim()) {
      this.error.set('login.errRequired');
      return;
    }
    const res = await this.auth.login(this.account.trim(), this.password);
    if (!res.ok) {
      this.error.set(res.message ?? 'login.errFail');
      return;
    }
    this.router.navigate([this.auth.isAdmin() ? '/admin' : '/member']);
  }
}
