import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { Controls } from '../../shared/controls/controls';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, TranslatePipe, Controls],
  template: `
    <header class="topbar">
      <div class="brand">
        <span class="logo logo-badge"><img src="/photos/S__5726357.jpg" alt="CB" /></span>
        <span>CardBeamz</span>
      </div>
      <nav class="actions">
        <app-controls />
        @if (auth.isLoggedIn()) {
          <a class="btn btn-ghost" routerLink="/member">{{ 'common.memberCenter' | t }}</a>
          @if (auth.isAdmin()) {
            <a class="btn btn-outline" routerLink="/admin">{{ 'common.adminPanel' | t }}</a>
          }
          <button class="btn btn-primary" (click)="logout()">{{ 'common.logout' | t }}</button>
        } @else {
          <button class="btn btn-ghost" (click)="goLogin()">{{ 'common.login' | t }}</button>
          <button class="btn btn-primary" (click)="goRegister()">{{ 'common.register' | t }}</button>
        }
      </nav>
    </header>

    <section class="hero">
      <div class="hero-inner">
        <h1>{{ 'landing.title' | t }}</h1>
        <p>{{ 'landing.subtitle' | t }}</p>
        <div class="hero-actions">
          <button class="btn btn-primary" (click)="goRegister()">{{ 'landing.joinNow' | t }}</button>
          <button class="btn btn-outline" (click)="goLogin()">{{ 'landing.memberLogin' | t }}</button>
        </div>
      </div>
      <div class="hero-logo">
        <img src="/photos/S__5726355.jpg" alt="CardBeamz" />
      </div>
    </section>

    <section class="features">
      @for (f of features; track f.title) {
        <div class="card feature">
          <div class="feat-emoji">{{ f.emoji }}</div>
          <h3>{{ f.title | t }}</h3>
          <p class="text-muted">{{ f.desc | t }}</p>
        </div>
      }
    </section>

    <footer class="footer">{{ 'landing.footer' | t }}</footer>
  `,
  styles: [
    `
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 6vw;
        background: var(--c-surface);
        box-shadow: var(--shadow-sm);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 20px;
        font-weight: 800;
      }
      .logo {
        width: 42px;
        height: 42px;
        border-radius: 11px;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 40px;
        padding: 70px 6vw;
        flex-wrap: wrap;
      }
      .hero-inner {
        max-width: 540px;
      }
      .hero h1 {
        font-size: 42px;
        line-height: 1.2;
        background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .hero p {
        font-size: 18px;
        color: var(--c-muted);
        line-height: 1.7;
        margin: 18px 0 28px;
      }
      .hero-actions {
        display: flex;
        gap: 12px;
      }
      .hero-logo {
        flex: 0 0 auto;
        border-radius: 24px;
        overflow: hidden;
        background: var(--c-dark);
        box-shadow: 0 20px 50px rgba(216, 27, 106, 0.35);
        max-width: 460px;
      }
      .hero-logo img {
        display: block;
        width: 100%;
        height: auto;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
        padding: 20px 6vw 70px;
      }
      .feature {
        text-align: center;
      }
      .feat-emoji {
        font-size: 36px;
        margin-bottom: 10px;
      }
      .footer {
        text-align: center;
        padding: 26px;
        color: var(--c-muted);
        background: var(--c-surface);
      }
    `,
  ],
})
export class Landing {
  protected auth = inject(AuthService);
  private router = inject(Router);

  features = [
    { emoji: '📦', title: 'landing.feat1.title', desc: 'landing.feat1.desc' },
    { emoji: '🚚', title: 'landing.feat2.title', desc: 'landing.feat2.desc' },
    { emoji: '💰', title: 'landing.feat3.title', desc: 'landing.feat3.desc' },
    { emoji: '🔔', title: 'landing.feat4.title', desc: 'landing.feat4.desc' },
  ];

  goLogin() {
    this.router.navigate(['/login']);
  }
  goRegister() {
    this.router.navigate(['/register']);
  }
  logout() {
    this.auth.logout();
  }
}
