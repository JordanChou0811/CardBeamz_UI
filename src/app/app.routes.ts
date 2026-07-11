import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './services/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: 'member',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/member-layout/member-layout').then((m) => m.MemberLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'warehouse' },
      {
        path: 'warehouse',
        loadComponent: () => import('./member/warehouse/warehouse').then((m) => m.Warehouse),
      },
      {
        path: 'orders',
        loadComponent: () => import('./member/orders/orders').then((m) => m.Orders),
      },
      {
        path: 'recycled',
        loadComponent: () => import('./member/recycled/recycled').then((m) => m.Recycled),
      },
      {
        path: 'credit',
        loadComponent: () => import('./member/credit/credit').then((m) => m.Credit),
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./member/change-password/change-password').then((m) => m.ChangePassword),
      },
      {
        path: 'news',
        loadComponent: () => import('./member/news/news').then((m) => m.News),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'orders' },
      {
        path: 'orders',
        loadComponent: () => import('./admin/orders-admin/orders-admin').then((m) => m.OrdersAdmin),
      },
      {
        path: 'members',
        loadComponent: () =>
          import('./admin/members-admin/members-admin').then((m) => m.MembersAdmin),
      },
      {
        path: 'groups',
        loadComponent: () => import('./admin/groups-admin/groups-admin').then((m) => m.GroupsAdmin),
      },
      {
        path: 'items',
        loadComponent: () => import('./admin/items-admin/items-admin').then((m) => m.ItemsAdmin),
      },
      {
        path: 'pages',
        loadComponent: () => import('./admin/pages-admin/pages-admin').then((m) => m.PagesAdmin),
      },
      {
        path: 'notify',
        loadComponent: () => import('./admin/notify-admin/notify-admin').then((m) => m.NotifyAdmin),
      },
      {
        path: 'upload',
        loadComponent: () => import('./admin/upload-admin/upload-admin').then((m) => m.UploadAdmin),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
