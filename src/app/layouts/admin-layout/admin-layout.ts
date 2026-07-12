import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { Controls } from '../../shared/controls/controls';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, Controls],
  template: `
    <div class="shell">
      <div
        class="nav-hotzone"
        (mouseenter)="openNav()"
        aria-hidden="true"
      ></div>

      <aside
        class="sidebar"
        [class.open]="navOpen()"
        (mouseenter)="openNav()"
        (mouseleave)="closeNav()"
      >
        <a class="brand" routerLink="/">
          <span class="logo logo-badge"><img src="/photos/S__5726357.jpg" alt="CB" /></span>
          {{ 'admin.brand' | t }}
        </a>
        <div class="mode-badge" [class.api]="useApi" [class.mock]="!useApi">
          {{ useApi ? 'API 模式' : '模擬模式' }}
        </div>
        <nav>
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active" (click)="closeNav()">
              <span class="ico">{{ l.icon }}</span> {{ l.label | t }}
            </a>
          }
        </nav>
      </aside>

      <main class="main">
        <header class="header">
          <div class="left">
            <button
              type="button"
              class="logo-btn"
              (mouseenter)="openNav()"
              (click)="toggleNav()"
              [attr.aria-expanded]="navOpen()"
              [attr.aria-label]="'admin.brand' | t"
            >
              <img src="/photos/S__5726357.jpg" alt="CardBeamz" />
            </button>
            <div class="page-title">{{ 'admin.title' | t }}</div>
          </div>
          <div class="right">
            <app-controls />
            <span class="text-muted">{{ auth.currentUser()?.name }}</span>
            <a class="btn btn-outline btn-sm" routerLink="/member">{{ 'common.frontend' | t }}</a>
            <button class="btn btn-primary btn-sm" (click)="logout()">{{ 'common.logout' | t }}</button>
          </div>
        </header>
        <div class="content"><router-outlet /></div>
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        position: relative;
        min-height: 100vh;
      }
      .nav-hotzone {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 14px;
        z-index: 40;
      }
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 230px;
        background: var(--c-dark);
        color: #e6d9e2;
        padding: 22px 14px;
        z-index: 50;
        transform: translateX(-100%);
        transition: transform 0.22s ease;
        box-shadow: none;
        overflow-y: auto;
      }
      .sidebar.open {
        transform: translateX(0);
        box-shadow: 8px 0 28px rgba(0, 0, 0, 0.28);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 9px;
        font-weight: 800;
        font-size: 18px;
        color: #fff;
        margin-bottom: 12px;
        padding: 0 8px;
      }
      .mode-badge {
        margin: 0 8px 18px;
        padding: 6px 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        text-align: center;
      }
      .mode-badge.api {
        background: #14532d;
        color: #86efac;
      }
      .mode-badge.mock {
        background: #713f12;
        color: #fde68a;
      }
      .logo {
        width: 36px;
        height: 36px;
        border-radius: 9px;
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      nav a {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 11px 13px;
        border-radius: var(--radius-sm);
        color: #cbd2e0;
        font-weight: 600;
        font-size: 15px;
      }
      nav a:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
      }
      nav a.active {
        background: var(--c-primary);
        color: #fff;
      }
      .main {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 100vh;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 28px;
        background: var(--c-surface);
        border-bottom: 1px solid var(--c-border);
        gap: 12px;
      }
      .left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .logo-btn {
        width: 40px;
        height: 40px;
        padding: 0;
        border: none;
        border-radius: 10px;
        overflow: hidden;
        cursor: pointer;
        background: var(--c-dark);
        flex-shrink: 0;
      }
      .logo-btn img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .logo-btn:hover {
        outline: 2px solid var(--c-primary);
        outline-offset: 2px;
      }
      .page-title {
        font-weight: 700;
      }
      .right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .content {
        padding: 28px;
        flex: 1;
      }
    `,
  ],
})
export class AdminLayout {
  protected auth = inject(AuthService);
  private router = inject(Router);
  protected useApi = environment.useApi;
  protected navOpen = signal(false);

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  links = [
    { path: '/admin/orders', label: 'admin.nav.orders', icon: '🚚' },
    { path: '/admin/members', label: 'admin.nav.members', icon: '👥' },
    { path: '/admin/groups', label: 'admin.nav.groups', icon: '🎴' },
    { path: '/admin/items', label: 'admin.nav.items', icon: '🃏' },
    { path: '/admin/pages', label: 'admin.nav.pages', icon: '📝' },
    { path: '/admin/upload', label: 'admin.nav.upload', icon: '🖼️' },
    { path: '/admin/notify', label: 'admin.nav.notify', icon: '📣' },
  ];

  openNav() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.navOpen.set(true);
  }

  closeNav() {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => this.navOpen.set(false), 180);
  }

  toggleNav() {
    this.navOpen.update((v) => !v);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
