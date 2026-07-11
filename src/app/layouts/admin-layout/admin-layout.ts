import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { Controls } from '../../shared/controls/controls';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, Controls],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/">
          <span class="logo logo-badge"><img src="/photos/S__5726357.jpg" alt="CB" /></span> {{ 'admin.brand' | t }}
        </a>
        <nav>
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active">
              <span class="ico">{{ l.icon }}</span> {{ l.label | t }}
            </a>
          }
        </nav>
      </aside>

      <main class="main">
        <header class="header">
          <div class="page-title">{{ 'admin.title' | t }}</div>
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
        display: flex;
        min-height: 100vh;
      }
      .sidebar {
        width: 230px;
        background: var(--c-dark);
        color: #e6d9e2;
        padding: 22px 14px;
        position: sticky;
        top: 0;
        height: 100vh;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 9px;
        font-weight: 800;
        font-size: 18px;
        color: #fff;
        margin-bottom: 24px;
        padding: 0 8px;
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
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 28px;
        background: var(--c-surface);
        border-bottom: 1px solid var(--c-border);
      }
      .page-title {
        font-weight: 700;
      }
      .right {
        display: flex;
        align-items: center;
        gap: 12px;
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

  links = [
    { path: '/admin/orders', label: 'admin.nav.orders', icon: '🚚' },
    { path: '/admin/members', label: 'admin.nav.members', icon: '👥' },
    { path: '/admin/groups', label: 'admin.nav.groups', icon: '🎴' },
    { path: '/admin/items', label: 'admin.nav.items', icon: '🃏' },
    { path: '/admin/pages', label: 'admin.nav.pages', icon: '📝' },
    { path: '/admin/upload', label: 'admin.nav.upload', icon: '🖼️' },
    { path: '/admin/notify', label: 'admin.nav.notify', icon: '📣' },
  ];

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
