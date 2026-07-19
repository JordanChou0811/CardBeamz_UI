import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { Controls } from '../../shared/controls/controls';

@Component({
  selector: 'app-member-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, Controls],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/">
          <span class="logo logo-badge"><img src="/photos/S__5726357.jpg" alt="CB" /></span> CardBeamz
        </a>
        <nav>
          @for (l of links; track l.path) {
            <a
              [routerLink]="l.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
            >
              <span class="ico">{{ l.icon }}</span> {{ l.label | t }}
            </a>
          }
        </nav>
      </aside>

      <main class="main">
        <header class="header">
          <div class="page-title">{{ 'common.memberCenter' | t }}</div>
          <div class="header-right">
          <app-controls />
          <div class="avatar-wrap" #avatarRef>
            <button class="avatar" (click)="toggle()">
              {{ initial() }}
            </button>
            @if (open()) {
              <div class="dropdown">
                <div class="dd-head">
                  <div class="avatar sm">{{ initial() }}</div>
                  <div>
                    <div class="dd-name">{{ auth.currentUser()?.name }}</div>
                    <div class="dd-no">{{ auth.currentUser()?.id }}</div>
                  </div>
                </div>
                <a routerLink="/member/change-password" (click)="close()">🔑 {{ 'nav.changePwd' | t }}</a>
                @if (auth.isAdmin()) {
                  <a routerLink="/admin" (click)="close()">🛠️ {{ 'common.adminPanel' | t }}</a>
                }
                <button (click)="logout()">🚪 {{ 'common.logout' | t }}</button>
              </div>
            }
          </div>
          </div>
        </header>

        <div class="content">
          <router-outlet />
        </div>
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
        width: 240px;
        background: var(--c-surface);
        border-right: 1px solid var(--c-border);
        padding: 22px 16px;
        position: sticky;
        top: 0;
        height: 100vh;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 9px;
        font-weight: 800;
        font-size: 19px;
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
        color: var(--c-muted);
        font-weight: 600;
        font-size: 15px;
      }
      nav a:hover {
        background: var(--c-bg);
        color: var(--c-text);
      }
      nav a.active {
        background: var(--c-primary-light);
        color: var(--c-primary-dark);
      }
      .ico {
        font-size: 17px;
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
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .page-title {
        font-weight: 700;
        font-size: 17px;
      }
      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .avatar-wrap {
        position: relative;
      }
      .avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
        color: #fff;
        font-weight: 700;
        font-size: 16px;
      }
      .avatar.sm {
        width: 38px;
        height: 38px;
        font-size: 14px;
      }
      .dropdown {
        position: absolute;
        right: 0;
        top: 52px;
        background: var(--c-surface);
        border: 1px solid var(--c-border);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        width: 220px;
        padding: 8px;
        z-index: 20;
      }
      .dd-head {
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 8px 8px 12px;
        border-bottom: 1px solid var(--c-border);
        margin-bottom: 6px;
      }
      .dd-name {
        font-weight: 700;
        font-size: 14px;
      }
      .dd-no {
        font-size: 12px;
        color: var(--c-muted);
      }
      .dropdown a,
      .dropdown button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 10px 10px;
        border: none;
        background: transparent;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 14px;
        color: var(--c-text);
      }
      .dropdown a:hover,
      .dropdown button:hover {
        background: var(--c-bg);
      }
      .content {
        padding: 28px;
        flex: 1;
      }
      @media (max-width: 760px) {
        .sidebar {
          width: 68px;
          padding: 18px 8px;
        }
        .brand span:last-child,
        nav a span:last-child {
          display: none;
        }
        nav a {
          justify-content: center;
        }
      }
    `,
  ],
})
export class MemberLayout {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private el = inject(ElementRef);

  open = signal(false);

  links = [
    { path: '/member/shop', label: 'nav.shop', icon: '🛒' },
    { path: '/member/cart', label: 'nav.cart', icon: '🧺' },
    { path: '/member/warehouse', label: 'nav.warehouse', icon: '📦' },
    { path: '/member/orders', label: 'nav.orders', icon: '🚚' },
    { path: '/member/recycled', label: 'nav.recycled', icon: '♻️' },
    { path: '/member/credit', label: 'nav.credit', icon: '💰' },
    { path: '/member/change-password', label: 'nav.changePwd', icon: '🔑' },
    { path: '/member/news', label: 'nav.news', icon: '🔔' },
  ];

  initial() {
    return this.auth.currentUser()?.name?.charAt(0) ?? '會';
  }

  toggle() {
    this.open.update((v) => !v);
  }
  close() {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (this.open() && !this.el.nativeElement.contains(e.target)) {
      this.open.set(false);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
